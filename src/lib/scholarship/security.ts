import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { encode, decode, type JWT } from "next-auth/jwt";
import { SESSION_MAX_AGE_SECONDS } from "./config";
import { CODE_ALPHABET } from "./validation";

// ------------------------------------------------------------------ keys
function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}
const derive = (purpose: string) => createHash("sha256").update(`scholarship:${purpose}:${secret()}`).digest();

// ------------------------------------------------------------------ FIN (sensitive ID)
/** Deterministic keyed hash: lets us look a FIN up and enforce uniqueness without storing it. */
export function hashFin(fin: string): string {
  return createHmac("sha256", derive("fin-hmac")).update(fin).digest("hex");
}

/** Reversible encryption so organisers can still read the FIN with the server key. */
export function encryptFin(fin: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derive("fin-aes"), iv);
  const ct = Buffer.concat([cipher.update(fin, "utf8"), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64")}`;
}

export function decryptFin(blob: string): string {
  const raw = Buffer.from(blob.replace(/^v1:/, ""), "base64");
  const decipher = createDecipheriv("aes-256-gcm", derive("fin-aes"), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

// ------------------------------------------------------------------ course codes
/** 32 characters from a 32-symbol alphabet = 160 bits of randomness (unambiguous: no 0/O/1/I). */
export function generateCourseCode(): string {
  const bytes = randomBytes(32);
  let out = "";
  for (let i = 0; i < 32; i++) out += CODE_ALPHABET[bytes[i] & 31];
  return out;
}

/** "ABCD-EFGH-..." for reading aloud / printing; the dashes are optional when typing it back. */
export const formatCourseCode = (code: string) => code.replace(/(.{4})(?=.)/g, "$1-");

// ------------------------------------------------------------------ session cookie
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-sts_scholarship" : "sts_scholarship";
// A distinct salt keeps this token from ever being accepted as a portal (NextAuth) session.
const SALT = "scholarship-session";

export async function createSessionToken(studentId: string): Promise<string> {
  // not a portal user: no id/role claims, which is also why the portal middleware rejects this token
  const token = { sub: studentId, kind: "scholarship" } as unknown as JWT;
  return encode({ token, secret: secret(), salt: SALT, maxAge: SESSION_MAX_AGE_SECONDS });
}

export async function readSessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const t = await decode({ token, secret: secret(), salt: SALT });
    return t && t.kind === "scholarship" && typeof t.sub === "string" ? t.sub : null;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

// ------------------------------------------------------------------ request checks
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip")) || "unknown";
}

/** CSRF defence in depth (cookies are already SameSite=Lax): a browser-sent Origin must match the host. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client; a cross-site browser request always carries Origin
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ rate limiting
// Fixed-window counters kept in memory: protects a single instance from bursts. Per-account
// lockout (ScholarshipStudent.failedLogins/lockedUntil) is stored in the database and holds
// across instances and restarts.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  return { ok: b.count <= limit, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}
