import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadRecord } from "@/lib/leads-store";
import {
  deliverLead,
  formatLeadMessage,
  getTelegramConfig,
} from "@/lib/telegram";

function makeLead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: "KV-261017-AB12",
    createdAt: "2026-10-17T10:45:00.000Z",
    name: "Аня",
    phoneE164: "+375291234567",
    interest: "order",
    comment: "Нужен помол под воронку",
    attribution: {
      utm: { utm_source: "instagram", utm_medium: "cpc", utm_campaign: "october" },
      referrer: "https://l.instagram.com/",
      page: "https://kvarta.by/?utm_source=instagram",
      clickId: "yclid-777",
    },
    requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    ...overrides,
  };
}

describe("formatLeadMessage", () => {
  it("собирает полное уведомление с источником", () => {
    const message = formatLeadMessage(makeLead());

    expect(message).toContain("Новая заявка · Кварта");
    expect(message).toContain("Аня");
    expect(message).toContain("+375291234567");
    expect(message).toContain("Заказ зерна");
    expect(message).toContain("Нужен помол под воронку");
    expect(message).toContain("utm_source: instagram");
    expect(message).toContain("utm_campaign: october");
    expect(message).toContain("yclid-777");
    expect(message).toContain("https://l.instagram.com/");
    expect(message).toContain("KV-261017-AB12");
    expect(message).toContain("17.10.2026");
  });

  it("пишет про прямой заход, если меток нет", () => {
    const message = formatLeadMessage(
      makeLead({ attribution: { utm: {}, referrer: null, page: "", clickId: null } }),
    );
    expect(message).toContain("utm-меток нет");
  });

  it("экранирует HTML в пользовательских данных", () => {
    const message = formatLeadMessage(
      makeLead({ name: "<b>Хакер</b>", comment: "5 < 6 & 7 > 6" }),
    );
    expect(message).toContain("&lt;b&gt;Хакер&lt;/b&gt;");
    expect(message).not.toContain("<b>Хакер</b>");
    expect(message).toContain("5 &lt; 6 &amp; 7 &gt; 6");
  });

  it("ограничивает длину сообщения", () => {
    const message = formatLeadMessage(makeLead({ comment: "я".repeat(600) }));
    expect(message.length).toBeLessThanOrEqual(3_900);
  });
});

describe("getTelegramConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("без переменных возвращает null", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_CHAT_ID", "");
    expect(getTelegramConfig()).toBeNull();
  });

  it("возвращает конфиг, если обе переменные заданы", () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:ABC");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100500");
    expect(getTelegramConfig()).toEqual({ botToken: "123:ABC", chatId: "-100500" });
  });
});

describe("deliverLead", () => {
  beforeEach(() => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:ABC");
    vi.stubEnv("TELEGRAM_CHAT_ID", "-100500");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("без токена работает в console-режиме и не роняет заявку", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const fetchMock = vi.fn();

    const result = await deliverLead(makeLead(), fetchMock as unknown as typeof fetch);

    expect(result).toEqual({ ok: true, mode: "console" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
  });

  it("отправляет сообщение в Bot API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await deliverLead(makeLead(), fetchMock as unknown as typeof fetch);

    expect(result).toEqual({ ok: true, mode: "telegram" });
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/bot123:ABC/sendMessage");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.chat_id).toBe("-100500");
    expect(body.parse_mode).toBe("HTML");
    expect(String(body.text)).toContain("Новая заявка");
  });

  it("возвращает ошибку telegram_api на 4xx/5xx", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ ok: false, description: "Unauthorized" }), { status: 401 }),
    );

    const result = await deliverLead(makeLead(), fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, error: "telegram_api" });
  });

  it("возвращает ошибку сети, если запрос не прошёл", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });

    const result = await deliverLead(makeLead(), fetchMock as unknown as typeof fetch);
    expect(result).toEqual({ ok: false, error: "telegram_network" });
  });
});
