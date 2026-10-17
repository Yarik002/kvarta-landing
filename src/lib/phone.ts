/**
 * Белорусские телефонные номера: нормализация, маска и валидация.
 * Один и тот же модуль использует и форма (клиент), и route handler (сервер) —
 * поэтому правила не могут разойтись.
 *
 * Национальный значимый номер Беларуси — 9 цифр:
 *   • мобильный: код оператора (25/29/33/44) + 7 цифр;
 *   • городской: код населённого пункта начинается с 1 (17 — Минск и т.д.).
 * E.164: +375 + 9 цифр.
 */

export const BY_PHONE_ERROR =
  "Похоже, это не белорусский номер. Нужен формат +375 (29) 123-45-67 — мобильный или городской с кодом.";

export const BY_PHONE_HINT =
  "Мобильный: +375 (25/29/33/44) XXX-XX-XX. Городской: +375 (17) XXX-XX-XX.";

export const BY_PHONE_PLACEHOLDER = "+375 (29) 123-45-67";

const MOBILE_OPERATOR_CODES = ["25", "29", "33", "44"] as const;

const NATIONAL_LENGTH = 9;

function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

/**
 * Вытаскивает национальный значимый номер из любого ввода:
 * поддерживает +375…, 375…, 80…, 0… и «просто цифры».
 *
 * Лишние цифры НЕ обрезаются: валидация должна видеть, что их больше 9.
 * Обрезает только маска (formatByPhone) — чтобы поле не «съедало» ввод.
 */
export function extractNationalDigits(input: string): string {
  let digits = digitsOnly(input);

  if (digits.startsWith("375")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("80")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Защитный потолок от гигантской вставки из буфера обмена.
  return digits.slice(0, 24);
}

export type ByPhoneKind = "mobile" | "landline";

export function classifyByPhone(nationalDigits: string): ByPhoneKind | null {
  if (!/^\d{9}$/.test(nationalDigits)) {
    return null;
  }

  const operator = nationalDigits.slice(0, 2);
  if (MOBILE_OPERATOR_CODES.includes(operator as (typeof MOBILE_OPERATOR_CODES)[number])) {
    return "mobile";
  }

  if (nationalDigits.startsWith("1")) {
    return "landline";
  }

  return null;
}

export function isValidByPhone(input: string): boolean {
  const national = extractNationalDigits(input);
  return classifyByPhone(national) !== null;
}

/** E.164-номер для хранения и отправки: +375XXXXXXXXX. */
export function normalizeByPhone(input: string): string | null {
  const national = extractNationalDigits(input);

  if (classifyByPhone(national) === null) {
    return null;
  }

  return `+375${national}`;
}

function formatLandline(national: string): string {
  const isMinsk = national.startsWith("17");
  const areaLength = isMinsk ? 2 : 3;
  const area = national.slice(0, areaLength);
  const rest = national.slice(areaLength);

  let output = `+375 (${area}`;
  if (national.length <= areaLength) {
    return output;
  }

  output += ") ";

  if (isMinsk) {
    // Минск: 7 цифр абонента, привычная группировка 3-2-2.
    output += rest.slice(0, 3);
    if (rest.length > 3) {
      output += `-${rest.slice(3, 5)}`;
    }
    if (rest.length > 5) {
      output += `-${rest.slice(5, 7)}`;
    }
    return output;
  }

  // Остальные города: 6 цифр абонента, группировка 2-2-2.
  output += rest.slice(0, 2);
  if (rest.length > 2) {
    output += `-${rest.slice(2, 4)}`;
  }
  if (rest.length > 4) {
    output += `-${rest.slice(4, 6)}`;
  }
  return output;
}

function formatMobile(national: string): string {
  let output = `+375 (${national.slice(0, 2)}`;

  if (national.length <= 2) {
    return output;
  }

  output += ") ";
  output += national.slice(2, 5);

  if (national.length > 5) {
    output += `-${national.slice(5, 7)}`;
  }

  if (national.length > 7) {
    output += `-${national.slice(7, 9)}`;
  }

  return output;
}

/**
 * Интерактивная маска. Возвращает отформатированную строку для поля ввода.
 * Невалидные для звонка номера всё равно форматируются — проверка отдельно.
 * Показываем максимум 9 цифр, лишние не «раздувают» поле.
 */
export function formatByPhone(input: string): string {
  const national = extractNationalDigits(input).slice(0, NATIONAL_LENGTH);

  if (national.length === 0) {
    return "";
  }

  const firstDigit = national.charAt(0);

  if (firstDigit === "2" || firstDigit === "3" || firstDigit === "4") {
    return formatMobile(national);
  }

  if (firstDigit === "1") {
    return formatLandline(national);
  }

  // Незнакомый префикс: не ломаем ввод, просто показываем цифры.
  return `+375 ${national}`;
}

/** Сколько цифр ещё осталось до полного номера (для подсказки/счётчика). */
export function missingNationalDigits(input: string): number {
  const length = Math.min(extractNationalDigits(input).length, NATIONAL_LENGTH);
  return Math.max(0, NATIONAL_LENGTH - length);
}
