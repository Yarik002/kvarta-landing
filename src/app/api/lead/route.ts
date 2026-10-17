/**
 * POST /api/lead — приём заявки.
 *
 * Порядок: rate limit → размер и JSON → строгая валидация →
 * honeypot → дедупликация номера (10 минут) → Telegram → локальный лог.
 * Любая неудача после «занятия» слота дедупликации освобождает слот,
 * чтобы человек мог спокойно повторить отправку.
 */

import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import {
  parseLeadPayload,
  type LeadErrorResponse,
  type LeadSuccessResponse,
} from "@/lib/lead-schema";
import {
  appendLeadToLocalFile,
  claimLeadSlot,
  createLeadId,
  releaseLeadSlot,
  rememberLead,
  type LeadRecord,
} from "@/lib/leads-store";
import { deliverLead } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 12 * 1024;
const RATE_LIMIT = { limit: 8, windowMs: 10 * 60 * 1_000 };

function jsonResponse<T>(body: T, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function failure(
  error: LeadErrorResponse["error"],
  message: string,
  status: number,
  extra: Omit<Partial<LeadErrorResponse>, "ok" | "error" | "message"> = {},
  extraHeaders: Record<string, string> = {},
) {
  return jsonResponse<LeadErrorResponse>({ ok: false, error, message, ...extra }, status, extraHeaders);
}

function maskPhone(phone: string): string {
  return phone.length > 8 ? `${phone.slice(0, 6)}***${phone.slice(-2)}` : phone;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request.headers);
  const rate = checkRateLimit(`lead:${ip}`, RATE_LIMIT);

  if (!rate.allowed) {
    return failure(
      "rate_limited",
      "С этого адреса уже было несколько заявок. Подождите пару минут — или позвоните нам, так быстрее.",
      429,
      { retryAfterSec: rate.retryAfterSec },
      { "retry-after": String(rate.retryAfterSec) },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return failure("bad_request", "Ожидается тело запроса в формате JSON.", 415);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return failure("bad_request", "Не получилось прочитать тело запроса. Попробуйте ещё раз.", 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return failure("bad_request", "Слишком большой запрос.", 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return failure(
      "bad_request",
      "Не получилось прочитать заявку. Обновите страницу и отправьте ещё раз.",
      400,
    );
  }

  const parsed = parseLeadPayload(payload);

  if (!parsed.ok) {
    return failure("validation", parsed.message, 400, { fieldErrors: parsed.fieldErrors });
  }

  const lead = parsed.data;

  // Honeypot: человек поле не видит. Боту отвечаем «успехом» и ничего не отправляем.
  if (lead.honeypotFilled) {
    console.warn("[kvarta] Honeypot сработал — заявка отброшена без доставки.");
    return jsonResponse<LeadSuccessResponse>({
      ok: true,
      id: createLeadId(),
      duplicate: false,
      message: "Заявка принята.",
    });
  }

  const claim = await claimLeadSlot(lead.phoneE164);

  if (!claim.claimed) {
    console.info(`[kvarta] Дубль заявки (${maskPhone(lead.phoneE164)}, backend=${claim.backend}) — не отправляю повторно.`);
    return jsonResponse<LeadSuccessResponse>({
      ok: true,
      id: createLeadId(),
      duplicate: true,
      message: "Мы уже получили заявку с этого номера — менеджер скоро перезвонит.",
    });
  }

  const record: LeadRecord = {
    id: createLeadId(),
    createdAt: new Date().toISOString(),
    name: lead.name,
    phoneE164: lead.phoneE164,
    interest: lead.interest,
    comment: lead.comment,
    attribution: lead.attribution,
    requestId: lead.requestId,
  };

  const delivery = await deliverLead(record);

  if (!delivery.ok) {
    // Доставка сорвалась — снимаем блокировку, чтобы человек мог повторить.
    await releaseLeadSlot(lead.phoneE164);
    return failure(
      "delivery_failed",
      "Не получилось передать заявку менеджеру. Попробуйте ещё раз чуть позже — или позвоните нам: так точно быстрее.",
      502,
    );
  }

  rememberLead(record);
  await appendLeadToLocalFile(record);

  console.info(
    `[kvarta] Заявка ${record.id} принята: ${maskPhone(record.phoneE164)}, интерес=${record.interest}, доставка=${delivery.mode}, source=${record.attribution.utm.utm_source ?? "direct"}`,
  );

  return jsonResponse<LeadSuccessResponse>({
    ok: true,
    id: record.id,
    duplicate: false,
    message: "Заявка принята. Менеджер перезвонит с 10 до 20 по Минску.",
  });
}
