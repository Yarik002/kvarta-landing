import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_STORAGE_KEY,
  buildAttribution,
  cleanAttributionValue,
  hasAttribution,
  parseStoredAttribution,
  serializeAttribution,
  type Attribution,
} from "@/lib/attribution";

const baseInput = {
  search: "",
  referrer: null,
  page: "https://kvarta.by/",
};

describe("buildAttribution", () => {
  it("перехватывает все UTM-метки из URL", () => {
    const attribution = buildAttribution({
      ...baseInput,
      search: "?utm_source=instagram&utm_medium=cpc&utm_campaign=october&utm_content=story_v2&utm_term=coffee",
      referrer: "https://l.instagram.com/",
    });

    expect(attribution.utm).toEqual({
      utm_source: "instagram",
      utm_medium: "cpc",
      utm_campaign: "october",
      utm_content: "story_v2",
      utm_term: "coffee",
    });
    expect(attribution.referrer).toBe("https://l.instagram.com/");
    expect(attribution.page).toBe("https://kvarta.by/");
  });

  it("понимает Яндексовый yclid и не тащит пустые метки", () => {
    const attribution = buildAttribution({
      ...baseInput,
      search: "?utm_source=yandex&utm_medium=&yclid=1234567890",
    });

    expect(attribution.utm).toEqual({ utm_source: "yandex" });
    expect(attribution.clickId).toBe("1234567890");
  });

  it("если в URL меток нет — отдаёт first-touch из sessionStorage", () => {
    const stored: Attribution = {
      utm: { utm_source: "instagram", utm_campaign: "september" },
      clickId: "stored-click",
      referrer: "https://l.instagram.com/",
      page: "https://kvarta.by/?utm_source=instagram",
    };

    const attribution = buildAttribution({ ...baseInput, search: "", stored });

    expect(attribution.utm).toEqual(stored.utm);
    expect(attribution.clickId).toBe("stored-click");
    // referrer всё равно берём текущий (в браузере это document.referrer).
    expect(attribution.referrer).toBeNull();
  });

  it("обрезает слишком длинные значения и вычищает управляющие символы", () => {
    const attribution = buildAttribution({
      ...baseInput,
      search: `?utm_source=${"a".repeat(400)}&utm_medium=${encodeURIComponent("cpc\u0000evil")}`,
    });

    expect(attribution.utm.utm_source).toHaveLength(200);
    expect(attribution.utm.utm_medium).toBe("cpc evil");
  });
});

describe("сериализация first-touch", () => {
  it("сериализует и читает обратно", () => {
    const attribution = buildAttribution({
      ...baseInput,
      search: "?utm_source=telegram&utm_medium=post",
    });
    const restored = parseStoredAttribution(serializeAttribution(attribution));

    expect(restored?.utm).toEqual(attribution.utm);
    expect(hasAttribution(restored ?? attribution)).toBe(true);
  });

  it("не падает на битом JSON и null", () => {
    expect(parseStoredAttribution(null)).toBeNull();
    expect(parseStoredAttribution("{not-json")).toBeNull();
    expect(parseStoredAttribution('"строка"')).toBeNull();
  });

  it("экспортирует стабильный ключ хранилища", () => {
    expect(ATTRIBUTION_STORAGE_KEY).toMatch(/^kvarta:/);
  });
});

describe("cleanAttributionValue", () => {
  it("оставляет только строку, чистит и обрезает", () => {
    expect(cleanAttributionValue(123)).toBe("");
    expect(cleanAttributionValue("  instagram  ")).toBe("instagram");
    expect(cleanAttributionValue("a\nb\tc")).toBe("a b c");
    expect(cleanAttributionValue("x".repeat(300), 10)).toBe("xxxxxxxxxx");
  });
});
