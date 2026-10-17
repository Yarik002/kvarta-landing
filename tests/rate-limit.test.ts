import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitForTests } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("пропускает в пределах лимита и блокирует сверх него", () => {
    const options = { limit: 3, windowMs: 1_000, now: 1_000_000 };

    expect(checkRateLimit("ip-1", options).allowed).toBe(true);
    expect(checkRateLimit("ip-1", options).allowed).toBe(true);
    expect(checkRateLimit("ip-1", options).allowed).toBe(true);

    const blocked = checkRateLimit("ip-1", options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("не смешивает разные ключи", () => {
    const options = { limit: 1, windowMs: 1_000, now: 5_000 };
    expect(checkRateLimit("ip-1", options).allowed).toBe(true);
    expect(checkRateLimit("ip-2", options).allowed).toBe(true);
    expect(checkRateLimit("ip-1", options).allowed).toBe(false);
  });

  it("сбрасывает счётчик после окна", () => {
    const start = { limit: 1, windowMs: 1_000, now: 10_000 };
    expect(checkRateLimit("ip-1", start).allowed).toBe(true);
    expect(checkRateLimit("ip-1", { ...start, now: 10_500 }).allowed).toBe(false);
    expect(checkRateLimit("ip-1", { ...start, now: 11_001 }).allowed).toBe(true);
  });

  it("считает remaining", () => {
    const options = { limit: 2, windowMs: 1_000, now: 50_000 };
    expect(checkRateLimit("ip-x", options).remaining).toBe(1);
    expect(checkRateLimit("ip-x", options).remaining).toBe(0);
    expect(checkRateLimit("ip-x", options).remaining).toBe(0);
  });
});
