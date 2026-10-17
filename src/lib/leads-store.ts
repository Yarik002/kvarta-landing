/**
 * Хранилище заявок.
 *
 * Почему так, а не SQLite-файл: на Vercel файловая система read-only
 * и не переживает холодный старт. Поэтому:
 *   1) основной «склад» — Telegram-чат мастерской (мгновенное уведомление
 *      + история заявок остаётся в переписке);
 *   2) на случай сбоя Telegram заявка пишется в память инстанса и в лог;
 *   3) локально (не на Vercel) дополнительно дописывается в .data/leads.jsonl —
 *      удобно смотреть заявки при разработке;
 *   4) дедупликация на 10 минут: Redis (Upstash REST) если настроен,
 *      иначе память инстанса. Подробности — в README.
 */

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Attribution } from "@/lib/attribution";
import type { Interest } from "@/lib/lead-schema";

export interface LeadRecord {
  id: string;
  createdAt: string;
  name: string;
  phoneE164: string;
  interest: Interest;
  comment: string;
  attribution: Attribution;
  requestId: string | null;
}

export type DedupeBackend = "redis" | "memory";

export interface ClaimResult {
  claimed: boolean;
  backend: DedupeBackend;
}

const DEDUPE_PREFIX = "kvarta:lead:";

const globalStore = globalThis as typeof globalThis & {
  __kvartaDedupe?: Map<string, number>;
  __kvartaRecentLeads?: LeadRecord[];
};

const memoryClaims: Map<string, number> = (globalStore.__kvartaDedupe ??= new Map());
const recentLeads: LeadRecord[] = (globalStore.__kvartaRecentLeads ??= []);

const RECENT_LEADS_LIMIT = 100;

function dedupeKey(phoneE164: string): string {
  return `${DEDUPE_PREFIX}${phoneE164}`;
}

interface UpstashConfig {
  url: string;
  token: string;
}

function getUpstashConfig(): UpstashConfig | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim().replace(/\/+$/, "");
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

async function upstashFetch(config: UpstashConfig, command: string, timeoutMs = 4_000): Promise<Response> {
  return fetch(`${config.url}/${command}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/**
 * Атомарно занимает «слот» дедупликации.
 * true — заявка первая, можно отправлять; false — номер уже заявлен.
 */
export async function claimLeadSlot(phoneE164: string, ttlSec = 600): Promise<ClaimResult> {
  const key = dedupeKey(phoneE164);
  const config = getUpstashConfig();

  if (config) {
    try {
      const response = await upstashFetch(
        config,
        `set/${encodeURIComponent(key)}/1?EX=${ttlSec}&NX`,
      );

      if (!response.ok) {
        throw new Error(`Upstash ответил ${response.status}`);
      }

      const payload = (await response.json()) as { result?: string | null };
      return { claimed: payload.result === "OK", backend: "redis" };
    } catch (error) {
      console.warn(
        "[kvarta] Upstash недоступен — дедуплицирую в памяти инстанса:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const now = Date.now();
  const expiresAt = memoryClaims.get(key);

  if (expiresAt !== undefined && expiresAt > now) {
    return { claimed: false, backend: "memory" };
  }

  memoryClaims.set(key, now + ttlSec * 1_000);
  pruneMemoryClaims(now);

  return { claimed: true, backend: "memory" };
}

function pruneMemoryClaims(now: number): void {
  if (memoryClaims.size < 500) {
    return;
  }
  for (const [key, expiresAt] of memoryClaims) {
    if (expiresAt <= now) {
      memoryClaims.delete(key);
    }
  }
}

/** Освобождает слот, если доставка не удалась — человек сможет повторить. */
export async function releaseLeadSlot(phoneE164: string): Promise<void> {
  const key = dedupeKey(phoneE164);
  memoryClaims.delete(key);

  const config = getUpstashConfig();
  if (!config) {
    return;
  }

  try {
    await upstashFetch(config, `del/${encodeURIComponent(key)}`);
  } catch (error) {
    console.warn(
      "[kvarta] Не удалось снять слот дедупликации в Upstash:",
      error instanceof Error ? error.message : error,
    );
  }
}

export function rememberLead(lead: LeadRecord): void {
  recentLeads.push(lead);
  if (recentLeads.length > RECENT_LEADS_LIMIT) {
    recentLeads.shift();
  }
}

export function getRecentLeads(): readonly LeadRecord[] {
  return recentLeads;
}

/** Короткий человекочитаемый id: KV-261017-A1B2. */
export function createLeadId(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `KV-${stamp}-${suffix}`;
}

/**
 * Локальное файловое хранилище — только вне Vercel. На Vercel файловая
 * система read-only/ephemeral, поэтому там ничего не пишем.
 */
export async function appendLeadToLocalFile(lead: LeadRecord): Promise<void> {
  const isServerless = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const storeDisabled = process.env.KVARTA_LEAD_STORE === "off";

  if (isServerless || storeDisabled) {
    return;
  }

  try {
    const directory = path.join(process.cwd(), ".data");
    await fs.mkdir(directory, { recursive: true });
    await fs.appendFile(path.join(directory, "leads.jsonl"), `${JSON.stringify(lead)}\n`, "utf8");
  } catch (error) {
    console.warn(
      "[kvarta] Не удалось дописать заявку в локальный файл:",
      error instanceof Error ? error.message : error,
    );
  }
}

/** Сброс in-memory состояния между тестами. */
export function resetLeadsStoreForTests(): void {
  memoryClaims.clear();
  recentLeads.length = 0;
}
