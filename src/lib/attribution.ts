/**
 * Сквозная аналитика: UTM-метки, реферер, страница входа, click id.
 *
 * Правила:
 *   • client-side модуль не трогает DOM на импорте — только внутри функций;
 *   • first-touch хранится в sessionStorage: если человек пришёл по рекламе,
 *     а потом обновил страницу без query-параметров, метки не потеряются;
 *   • сервер всё перепроверяет и обрезает длины (см. lead-schema.ts).
 */

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export const CLICK_ID_KEYS = ["yclid", "gclid", "fbclid"] as const;

export const ATTRIBUTION_STORAGE_KEY = "kvarta:attribution:v1";

export interface Attribution {
  utm: Utm;
  referrer: string | null;
  page: string;
  clickId: string | null;
}

export const EMPTY_ATTRIBUTION: Attribution = {
  utm: {},
  referrer: null,
  page: "",
  clickId: null,
};

export function cleanAttributionValue(value: unknown, maxLength = 200): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function hasAttribution(attribution: Attribution): boolean {
  return (
    Object.values(attribution.utm).some((value) => Boolean(value)) ||
    Boolean(attribution.clickId) ||
    Boolean(attribution.referrer)
  );
}

export function parseStoredAttribution(raw: string | null): Attribution | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as Partial<Attribution>;
    const utm: Utm = {};
    for (const key of UTM_KEYS) {
      const value = cleanAttributionValue(candidate.utm?.[key]);
      if (value) {
        utm[key] = value;
      }
    }

    return {
      utm,
      referrer: cleanAttributionValue(candidate.referrer, 500) || null,
      page: cleanAttributionValue(candidate.page, 500),
      clickId: cleanAttributionValue(candidate.clickId) || null,
    };
  } catch {
    return null;
  }
}

export function serializeAttribution(attribution: Attribution): string {
  return JSON.stringify(attribution);
}

interface BuildAttributionInput {
  search: string;
  referrer: string | null;
  page: string;
  /** First-touch из sessionStorage — используется, если в текущем URL меток нет. */
  stored?: Attribution | null;
}

export function buildAttribution(input: BuildAttributionInput): Attribution {
  const params = new URLSearchParams(input.search.startsWith("?") ? input.search.slice(1) : input.search);

  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = cleanAttributionValue(params.get(key));
    if (value) {
      utm[key] = value;
    }
  }

  let clickId: string | null = null;
  for (const key of CLICK_ID_KEYS) {
    const value = cleanAttributionValue(params.get(key));
    if (value) {
      clickId = value;
      break;
    }
  }

  const stored = input.stored ?? null;
  const hasCurrentUtm = Object.keys(utm).length > 0;

  return {
    // Если в текущем URL меток нет — это повторный визит, отдаём first-touch.
    utm: hasCurrentUtm ? utm : { ...(stored?.utm ?? {}) },
    clickId: clickId ?? stored?.clickId ?? null,
    referrer: cleanAttributionValue(input.referrer, 500) || null,
    page: cleanAttributionValue(input.page, 500),
  };
}

/** Браузерный сборщик. На сервере (typeof window === "undefined") вернёт пустое значение. */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") {
    return EMPTY_ATTRIBUTION;
  }

  let stored: Attribution | null = null;
  try {
    stored = parseStoredAttribution(window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY));
  } catch {
    stored = null;
  }

  const attribution = buildAttribution({
    search: window.location.search,
    referrer: document.referrer || null,
    page: window.location.href,
    stored,
  });

  // first-touch: сохраняем только если есть что сохранять.
  if (hasAttribution(attribution)) {
    try {
      const hasStored = stored !== null && hasAttribution(stored);
      if (!hasStored) {
        window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, serializeAttribution(attribution));
      }
    } catch {
      // sessionStorage может быть недоступен (приватный режим) — не критично.
    }
  }

  return attribution;
}
