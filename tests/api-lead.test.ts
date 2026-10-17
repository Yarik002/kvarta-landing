import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/lead/route";
import type { LeadErrorResponse, LeadSuccessResponse } from "@/lib/lead-schema";
import { resetRateLimitForTests } from "@/lib/rate-limit";
import { resetLeadsStoreForTests } from "@/lib/leads-store";

const VALID_BODY = {
  name: "Аня",
  phone: "+375 (29) 123-45-67",
  interest: "order",
  comment: "Хочу Эфиопию в зёрнах",
  attribution: {
    utm: { utm_source: "instagram", utm_medium: "cpc", utm_campaign: "october" },
    referrer: "https://l.instagram.com/",
    page: "https://kvarta.by/?utm_source=instagram",
    clickId: "yclid-123",
  },
  requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  contactWebsite: "",
};

function makeRequest(body: unknown, ip = "203.0.113.10"): NextRequest {
  return new NextRequest("http://localhost:3000/api/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function telegramOkResponse(): Response {
  return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("POST /api/lead", () => {
  beforeEach(() => {
    resetRateLimitForTests();
    resetLeadsStoreForTests();
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:TEST");
    vi.stubEnv("TELEGRAM_CHAT_ID", "42");
    vi.stubEnv("KVARTA_LEAD_STORE", "off");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("принимает валидную заявку и отправляет её в Telegram", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest(VALID_BODY));
    const payload = await readJson<LeadSuccessResponse>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.duplicate).toBe(false);
    expect(payload.id).toMatch(/^KV-\d{6}-[0-9A-F]{4}$/);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("api.telegram.org");
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    expect(body.chat_id).toBe("42");
    expect(body.text).toContain("utm_source: instagram");
    expect(body.text).toContain("Хочу Эфиопию в зёрнах");
    expect(body.text).toContain("instagram");
  });

  it("отклоняет невалидный телефон с понятной ошибкой поля", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest({ ...VALID_BODY, phone: "+7 999 123-45-67" }));
    const payload = await readJson<LeadErrorResponse>(response);

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe("validation");
    expect(payload.fieldErrors?.phone).toMatch(/белорусский/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("не создаёт дубль при повторной отправке в течение 10 минут", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const first = await POST(makeRequest(VALID_BODY));
    const second = await POST(
      makeRequest({ ...VALID_BODY, comment: "Повторная отправка, дабл-клик" }),
    );

    const firstPayload = await readJson<LeadSuccessResponse>(first);
    const secondPayload = await readJson<LeadSuccessResponse>(second);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstPayload.duplicate).toBe(false);
    expect(secondPayload.duplicate).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("при сбое Telegram возвращает 502 и освобождает слот для повтора", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failingFetch = vi.fn(async () =>
      new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", failingFetch);

    const failed = await POST(makeRequest(VALID_BODY));
    const failedPayload = await readJson<LeadErrorResponse>(failed);

    expect(failed.status).toBe(502);
    expect(failedPayload.ok).toBe(false);
    expect(failedPayload.error).toBe("delivery_failed");

    const retryFetch = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", retryFetch);

    const retried = await POST(makeRequest({ ...VALID_BODY, comment: "После сбоя" }));
    const retriedPayload = await readJson<LeadSuccessResponse>(retried);

    expect(retried.status).toBe(200);
    expect(retriedPayload.ok).toBe(true);
    expect(retriedPayload.duplicate).toBe(false);
  });

  it("молча принимает honeypot и ничего не отправляет", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(makeRequest({ ...VALID_BODY, contactWebsite: "http://spam.example" }));
    const payload = await readJson<LeadSuccessResponse>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.duplicate).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ограничивает флуд с одного IP", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    for (let index = 0; index < 8; index += 1) {
      const phone = `+37529${String(100000 + index).padStart(7, "0")}`;
      const response = await POST(makeRequest({ ...VALID_BODY, phone }));
      expect(response.status).toBe(200);
    }

    const blocked = await POST(makeRequest({ ...VALID_BODY, phone: "+375291112233" }));
    const payload = await readJson<LeadErrorResponse>(blocked);

    expect(blocked.status).toBe(429);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe("rate_limited");
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });

  it("отказывает на битый JSON и неверный content-type", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const broken = await POST(makeRequest("{not-json"));
    expect(broken.status).toBe(400);

    const wrongType = new NextRequest("http://localhost:3000/api/lead", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "hello",
    });
    const wrongTypeResponse = await POST(wrongType);
    expect(wrongTypeResponse.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("не пропускает javascript: в referrer и source", async () => {
    const fetchMock = vi.fn(async () => telegramOkResponse());
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        attribution: {
          utm: { utm_source: "instagram" },
          referrer: "javascript:alert(1)",
          page: "javascript:alert(2)",
          clickId: null,
        },
      }),
    );
    expect(response.status).toBe(200);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    expect(body.text).not.toContain("javascript:");
  });
});
