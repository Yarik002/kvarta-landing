import { beforeEach, describe, expect, it } from "vitest";
import {
  claimLeadSlot,
  createLeadId,
  releaseLeadSlot,
  resetLeadsStoreForTests,
} from "@/lib/leads-store";

describe("дедупликация заявок", () => {
  beforeEach(() => {
    resetLeadsStoreForTests();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("первый номер занимает слот, повторный — нет", async () => {
    const first = await claimLeadSlot("+375291234567");
    expect(first.claimed).toBe(true);
    expect(first.backend).toBe("memory");

    const second = await claimLeadSlot("+375291234567");
    expect(second.claimed).toBe(false);
  });

  it("разные номера не мешают друг другу", async () => {
    expect((await claimLeadSlot("+375291234567")).claimed).toBe(true);
    expect((await claimLeadSlot("+375337654321")).claimed).toBe(true);
  });

  it("release освобождает слот — можно повторить после ошибки", async () => {
    expect((await claimLeadSlot("+375291234567")).claimed).toBe(true);
    await releaseLeadSlot("+375291234567");
    expect((await claimLeadSlot("+375291234567")).claimed).toBe(true);
  });
});

describe("createLeadId", () => {
  it("делает короткий читаемый id", () => {
    const id = createLeadId(new Date("2026-10-17T13:25:00+03:00"));
    expect(id).toMatch(/^KV-261017-[0-9A-F]{4}$/);
  });

  it("не повторяется", () => {
    const ids = new Set(Array.from({ length: 50 }, () => createLeadId()));
    expect(ids.size).toBe(50);
  });
});
