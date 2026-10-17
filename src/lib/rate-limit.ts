/**
 * Простой in-memory rate limit для serverless-инстанса.
 *
 * Это не замена WAF: лимит живёт в памяти одного инстанса, поэтому
 * он отсекает «долбёжку» кнопки и наивные скрипты, но не распределённый
 * флуд. Основная защита от дублей — дедупликация по номеру на 10 минут
 * (leads-store.ts), а WAF/ботозащита — на уровне хостинга.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as typeof globalThis & {
  __kvartaRateLimit?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> = (globalStore.__kvartaRateLimit ??= new Map());

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

function prune(now: number): void {
  if (buckets.size < 1_000) {
    return;
  }
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - bucket.count),
    retryAfterSec: 0,
  };
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
