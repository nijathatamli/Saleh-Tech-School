// In-memory abuse protection for a single server instance: fixed-window request counters and a
// failed-sign-in guard. State is lost on restart and not shared between instances — enough to stop
// scripted guessing against one process; put a shared store (database/Redis) behind it before running
// several instances.

const buckets = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
}

/** Counts one hit for `key`; `ok` is false once more than `limit` hits happened inside `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}

/** First hop of x-forwarded-for (set by the platform's proxy), else x-real-ip. */
export function ipFromHeader(get: (name: string) => string | string[] | null | undefined): string {
  const pick = (v: string | string[] | null | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const fwd = pick(get("x-forwarded-for"));
  return (fwd ? fwd.split(",")[0].trim() : pick(get("x-real-ip"))) || "unknown";
}

// ------------------------------------------------------------------ failed sign-in guard
const LOGIN_WINDOW_MS = 15 * 60_000;
export type LoginKey = { key: string; limit: number };

/**
 * Three counters per attempt: this e-mail from this address (5), everything from this address (30),
 * this e-mail from anywhere (50). The pair counter protects the account from guessing without letting a
 * stranger lock the real owner out from their own address; the others slow down distributed attempts.
 */
export function loginKeys(email: string, ip: string): LoginKey[] {
  return [
    { key: `login:pair:${email}|${ip}`, limit: 5 },
    { key: `login:ip:${ip}`, limit: 30 },
    { key: `login:email:${email}`, limit: 50 },
  ];
}

/** Seconds until the next attempt is allowed, or 0. */
export function loginBlockedFor(keys: LoginKey[]): number {
  const now = Date.now();
  let wait = 0;
  for (const { key, limit } of keys) {
    const b = buckets.get(key);
    if (b && b.resetAt > now && b.count >= limit) wait = Math.max(wait, Math.ceil((b.resetAt - now) / 1000));
  }
  return wait;
}

export function loginFailed(keys: LoginKey[]) {
  const now = Date.now();
  sweep(now);
  for (const { key } of keys) {
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    else b.count += 1;
  }
}

/** A correct password only clears the e-mail+address pair. */
export function loginSucceeded(keys: LoginKey[]) {
  buckets.delete(keys[0].key);
}
