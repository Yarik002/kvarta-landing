/**
 * Схема заявки: общая для клиента и сервера.
 *
 * Клиент использует validate*-функции для мгновенной подсказки,
 * сервер — parseLeadPayload(): он не доверяет ни одному полю и заново
 * проверяет/чистит всё, что пришло в теле запроса.
 */

import {
  CLICK_ID_KEYS,
  UTM_KEYS,
  EMPTY_ATTRIBUTION,
  cleanAttributionValue,
  type Attribution,
  type Utm,
} from "@/lib/attribution";
import { BY_PHONE_ERROR, normalizeByPhone } from "@/lib/phone";

export type Interest = "subscription" | "order" | "question";

export const INTEREST_OPTIONS: Array<{ value: Interest; label: string; hint: string }> = [
  {
    value: "subscription",
    label: "Подписка",
    hint: "2 пачки по 250 г в месяц, доставка бесплатно",
  },
  {
    value: "order",
    label: "Заказ зерна",
    hint: "разовый заказ: сорта, помол, доставка",
  },
  {
    value: "question",
    label: "Вопрос",
    hint: "про помол, хранение, доставку — любой",
  },
];

export const LEAD_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  commentMax: 600,
  requestIdMax: 64,
} as const;

export interface LeadFormValues {
  name: string;
  phone: string;
  interest: Interest;
  comment: string;
}

export type LeadField = "name" | "phone" | "interest" | "comment";
export type LeadFieldErrors = Partial<Record<LeadField, string>>;

function normalizeText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateName(value: string): string | null {
  const normalized = normalizeText(value);

  if (normalized.length < LEAD_LIMITS.nameMin) {
    return "Напишите, как к вам обращаться — достаточно имени.";
  }

  if (normalized.length > LEAD_LIMITS.nameMax) {
    return `Слишком длинное имя: до ${LEAD_LIMITS.nameMax} символов.`;
  }

  return null;
}

export function validatePhone(value: string): string | null {
  if (normalizeText(value).length === 0) {
    return "Оставьте телефон — перезвоним и всё оформим.";
  }

  return normalizeByPhone(value) === null ? BY_PHONE_ERROR : null;
}

export function validateInterest(value: string): string | null {
  if (!INTEREST_OPTIONS.some((option) => option.value === value)) {
    return "Выберите, что вас интересует.";
  }

  return null;
}

export function validateComment(value: string): string | null {
  if (normalizeText(value).length > LEAD_LIMITS.commentMax) {
    return `Комментарий слишком длинный — до ${LEAD_LIMITS.commentMax} символов.`;
  }

  return null;
}

/** Быстрая проверка всей формы для клиента. Пустой объект — всё хорошо. */
export function validateLeadForm(values: LeadFormValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  const nameError = validateName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  const phoneError = validatePhone(values.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  const interestError = validateInterest(values.interest);
  if (interestError) {
    errors.interest = interestError;
  }

  const commentError = validateComment(values.comment);
  if (commentError) {
    errors.comment = commentError;
  }

  return errors;
}

export interface SanitizedLead {
  name: string;
  phoneE164: string;
  interest: Interest;
  comment: string;
  attribution: Attribution;
  requestId: string | null;
  honeypotFilled: boolean;
}

export type ParsedLead =
  | { ok: true; data: SanitizedLead }
  | { ok: false; fieldErrors: LeadFieldErrors; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeHttpUrl(value: string): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeAttribution(value: unknown): Attribution {
  if (!isRecord(value)) {
    return { ...EMPTY_ATTRIBUTION, utm: {} };
  }

  const utmRaw = isRecord(value.utm) ? value.utm : {};
  const utm: Utm = {};

  for (const key of UTM_KEYS) {
    const clean = cleanAttributionValue(utmRaw[key]);
    if (clean) {
      utm[key] = clean;
    }
  }

  return {
    utm,
    referrer: safeHttpUrl(cleanAttributionValue(value.referrer, 500)),
    page: safeHttpUrl(cleanAttributionValue(value.page, 500)) ?? "",
    clickId: cleanAttributionValue(value.clickId) || null,
  };
}

function sanitizeClickIdFallback(_value: unknown): void {
  // Click id приходит внутри attribution.clickId; отдельные поля не поддерживаем.
}

export function parseLeadPayload(payload: unknown): ParsedLead {
  if (!isRecord(payload)) {
    return {
      ok: false,
      fieldErrors: {},
      message: "Не получилось прочитать заявку. Обновите страницу и попробуйте ещё раз.",
    };
  }

  const name = normalizeText(typeof payload.name === "string" ? payload.name : "");
  const phoneRaw = typeof payload.phone === "string" ? payload.phone : "";
  const interestRaw = typeof payload.interest === "string" ? payload.interest : "";
  const comment = normalizeText(typeof payload.comment === "string" ? payload.comment : "");

  const fieldErrors: LeadFieldErrors = {};

  const nameError = validateName(name);
  if (nameError) {
    fieldErrors.name = nameError;
  }

  const phoneError = validatePhone(phoneRaw);
  if (phoneError) {
    fieldErrors.phone = phoneError;
  }

  const interestError = validateInterest(interestRaw);
  if (interestError) {
    fieldErrors.interest = interestError;
  }

  const commentError = validateComment(comment);
  if (commentError) {
    fieldErrors.comment = commentError;
  }

  const phoneE164 = normalizeByPhone(phoneRaw);

  if (Object.keys(fieldErrors).length > 0 || phoneE164 === null) {
    return {
      ok: false,
      fieldErrors,
      message: "Проверьте, пожалуйста, поля формы.",
    };
  }

  const requestIdRaw = cleanAttributionValue(payload.requestId, LEAD_LIMITS.requestIdMax);
  const requestId = /^[a-zA-Z0-9-]{8,64}$/.test(requestIdRaw) ? requestIdRaw : null;

  // Honeypot: реальный человек это поле не видит и не заполняет.
  const honeypotRaw = typeof payload.contactWebsite === "string" ? payload.contactWebsite.trim() : "";

  return {
    ok: true,
    data: {
      name,
      phoneE164,
      interest: interestRaw as Interest,
      comment,
      attribution: sanitizeAttribution(payload.attribution),
      requestId,
      honeypotFilled: honeypotRaw.length > 0,
    },
  };
}

export interface LeadSuccessResponse {
  ok: true;
  id: string;
  duplicate: boolean;
  message: string;
}

export interface LeadErrorResponse {
  ok: false;
  error: "validation" | "bad_request" | "rate_limited" | "delivery_failed";
  message: string;
  fieldErrors?: LeadFieldErrors;
  retryAfterSec?: number;
}

export type LeadResponse = LeadSuccessResponse | LeadErrorResponse;

export function interestLabel(interest: Interest): string {
  return INTEREST_OPTIONS.find((option) => option.value === interest)?.label ?? interest;
}
