import { describe, expect, it } from "vitest";
import {
  LEAD_LIMITS,
  parseLeadPayload,
  sanitizeAttribution,
  validateComment,
  validateInterest,
  validateLeadForm,
  validateName,
  validatePhone,
} from "@/lib/lead-schema";

describe("валидация полей формы", () => {
  it("принимает нормальное имя", () => {
    expect(validateName("Аня")).toBeNull();
    expect(validateName("  Дмитрий  ")).toBeNull();
  });

  it("просит имя от 2 символов", () => {
    expect(validateName("Я")).toMatch(/имени/i);
    expect(validateName("   ")).not.toBeNull();
    expect(validateName("Я".repeat(LEAD_LIMITS.nameMax + 1))).toMatch(/длинное/i);
  });

  it("проверяет телефон белорусским форматом", () => {
    expect(validatePhone("+375 (29) 123-45-67")).toBeNull();
    expect(validatePhone("+375 (17) 123-45-67")).toBeNull();
    expect(validatePhone("")).toMatch(/телефон/i);
    expect(validatePhone("+7 999 123-45-67")).toMatch(/белорусский/i);
  });

  it("проверяет интерес и длину комментария", () => {
    expect(validateInterest("subscription")).toBeNull();
    expect(validateInterest("order")).toBeNull();
    expect(validateInterest("question")).toBeNull();
    expect(validateInterest("hack")).toMatch(/интересует/i);

    expect(validateComment("")).toBeNull();
    expect(validateComment("а".repeat(LEAD_LIMITS.commentMax + 1))).toMatch(/длинный/i);
  });

  it("собирает ошибки всей формы", () => {
    const errors = validateLeadForm({
      name: "",
      phone: "123",
      interest: "subscription",
      comment: "",
    });

    expect(Object.keys(errors).sort()).toEqual(["name", "phone"]);
  });
});

describe("parseLeadPayload — сервер не доверяет клиенту", () => {
  const validPayload = {
    name: "Аня",
    phone: "+375 (29) 123-45-67",
    interest: "order",
    comment: "  хочу помол под воронку  ",
    attribution: {
      utm: {
        utm_source: "instagram",
        utm_medium: "  cpc  ",
        utm_campaign: "",
      },
      referrer: "https://l.instagram.com/",
      page: "https://kvarta.by/?utm_source=instagram",
      clickId: "yclid-123",
    },
    requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    contactWebsite: "",
  };

  it("нормализует данные и телефон", () => {
    const result = parseLeadPayload(validPayload);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data.name).toBe("Аня");
    expect(result.data.phoneE164).toBe("+375291234567");
    expect(result.data.interest).toBe("order");
    expect(result.data.comment).toBe("хочу помол под воронку");
    expect(result.data.attribution.utm).toEqual({
      utm_source: "instagram",
      utm_medium: "cpc",
    });
    expect(result.data.attribution.clickId).toBe("yclid-123");
    expect(result.data.requestId).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
    expect(result.data.honeypotFilled).toBe(false);
  });

  it("ловит заполненный honeypot", () => {
    const result = parseLeadPayload({ ...validPayload, contactWebsite: "http://spam.example" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.honeypotFilled).toBe(true);
    }
  });

  it("отклоняет невалидную заявку с понятными ошибками полей", () => {
    const result = parseLeadPayload({
      ...validPayload,
      name: "Я",
      phone: "12345",
      interest: "hack",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.fieldErrors.name).toBeDefined();
    expect(result.fieldErrors.phone).toBeDefined();
    expect(result.fieldErrors.interest).toBeDefined();
    expect(result.message).toMatch(/проверьте/i);
  });

  it("не пропускает не-объект", () => {
    expect(parseLeadPayload(null).ok).toBe(false);
    expect(parseLeadPayload("строка").ok).toBe(false);
    expect(parseLeadPayload([1, 2, 3]).ok).toBe(false);
  });

  it("чистит attribution от javascript: и мусорных значений", () => {
    const attribution = sanitizeAttribution({
      utm: { utm_source: "<script>alert(1)</script>", utm_medium: 42 },
      referrer: "javascript:alert(1)",
      page: "ftp://example.com",
      clickId: "x".repeat(500),
    });

    expect(attribution.utm.utm_source).toBe("<script>alert(1)</script>");
    expect(attribution.utm.utm_medium).toBeUndefined();
    expect(attribution.referrer).toBeNull();
    expect(attribution.page).toBe("");
    expect(attribution.clickId).toHaveLength(200);
  });

  it("не пропускает странный requestId", () => {
    const result = parseLeadPayload({ ...validPayload, requestId: "<script>" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.requestId).toBeNull();
    }
  });
});
