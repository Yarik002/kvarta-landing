import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import {
  BY_PHONE_ERROR,
  classifyByPhone,
  extractNationalDigits,
  formatByPhone,
  isValidByPhone,
  missingNationalDigits,
  normalizeByPhone,
} from "@/lib/phone";

/**
 * Фикстура: все строки ниже реально встречаются, когда человек
 * вводит белорусский номер на мобильном.
 */
describe("extractNationalDigits", () => {
  it("вытаскивает 9 национальных цифр из любого формата", () => {
    expect(extractNationalDigits("+375 (29) 123-45-67")).toBe("291234567");
    expect(extractNationalDigits("375291234567")).toBe("291234567");
    expect(extractNationalDigits("80291234567")).toBe("291234567");
    expect(extractNationalDigits("0291234567")).toBe("291234567");
    expect(extractNationalDigits("29 123 45 67")).toBe("291234567");
  });

  it("не падает на мусоре и не обрезает лишние цифры", () => {
    expect(extractNationalDigits("")).toBe("");
    expect(extractNationalDigits("позвоните мне")).toBe("");
    // Лишние цифры сохраняем — иначе валидация не отличит «+…678» от «+…67».
    expect(extractNationalDigits("+375 29 123 45 67 99")).toBe("29123456799");
  });
});

describe("classifyByPhone / isValidByPhone", () => {
  it("принимает всех мобильных операторов", () => {
    for (const operator of ["25", "29", "33", "44"]) {
      const number = `+375${operator}1234567`;
      expect(isValidByPhone(number), number).toBe(true);
      expect(classifyByPhone(`${operator}1234567`)).toBe("mobile");
    }
  });

  it("принимает городские номера (код начинается с 1)", () => {
    expect(isValidByPhone("+375 (17) 123-45-67")).toBe(true);
    expect(isValidByPhone("162123456")).toBe(true);
    expect(classifyByPhone("162123456")).toBe("landline");
  });

  it("отклоняет неверные варианты", () => {
    const invalid = [
      "",
      "12345",
      "+375 91 123-45-67",
      "+375 29 123-45-6",
      "+375 29 123-45-678",
      "8 029 123",
      "телефон",
      "+375 21 123-45-67",
    ];

    for (const value of invalid) {
      expect(isValidByPhone(value), value).toBe(false);
      expect(normalizeByPhone(value), value).toBeNull();
    }
  });

  it("возвращает E.164 для валидного номера", () => {
    expect(normalizeByPhone("+375 (33) 765-43-21")).toBe("+375337654321");
    expect(normalizeByPhone("80251234567")).toBe("+375251234567");
  });
});

describe("formatByPhone — маска", () => {
  it("пошагово форматирует мобильный", () => {
    expect(formatByPhone("")).toBe("");
    expect(formatByPhone("2")).toBe("+375 (2");
    expect(formatByPhone("29")).toBe("+375 (29");
    expect(formatByPhone("291")).toBe("+375 (29) 1");
    expect(formatByPhone("2912")).toBe("+375 (29) 12");
    expect(formatByPhone("2912345")).toBe("+375 (29) 123-45");
    expect(formatByPhone("291234567")).toBe("+375 (29) 123-45-67");
  });

  it("форматирует городской номер", () => {
    expect(formatByPhone("17")).toBe("+375 (17");
    expect(formatByPhone("171234567")).toBe("+375 (17) 123-45-67");
    expect(formatByPhone("162123456")).toBe("+375 (162) 12-34-56");
  });

  it("не ломается на неизвестном префиксе — просто показывает цифры", () => {
    expect(formatByPhone("9")).toBe("+375 9");
  });

  it("сохраняет уже отформатированную строку при повторном форматировании", () => {
    const once = formatByPhone("+375 (29) 123-45-67");
    expect(formatByPhone(once)).toBe(once);
  });

  it("показывает максимум 9 цифр, даже если вставили больше", () => {
    expect(formatByPhone("+375 (29) 123-45-67 89")).toBe("+375 (29) 123-45-67");
  });
});

describe("служебные хелперы", () => {
  it("считает недостающие цифры", () => {
    expect(missingNationalDigits("29123")).toBe(4);
    expect(missingNationalDigits("291234567")).toBe(0);
    expect(missingNationalDigits("")).toBe(9);
  });

  it("отдаёт понятный текст ошибки", () => {
    expect(BY_PHONE_ERROR).toMatch(/белорусский/i);
    expect(BY_PHONE_ERROR).toMatch(/\+375/);
  });
});
