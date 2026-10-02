import { NextResponse } from "next/server";
import { MSG } from "./config";
import { sameOrigin } from "./security";

const NO_STORE = { "Cache-Control": "no-store" };

export function ok(data: unknown, status = 200, init?: { headers?: Record<string, string> }) {
  return NextResponse.json(data, { status, headers: { ...NO_STORE, ...init?.headers } });
}

export function fail(status: number, error: string, extra?: { fields?: Record<string, string>; retryAfter?: number }) {
  const headers: Record<string, string> = { ...NO_STORE };
  if (extra?.retryAfter) headers["Retry-After"] = String(extra.retryAfter);
  return NextResponse.json({ error, ...(extra?.fields ? { fields: extra.fields } : {}) }, { status, headers });
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response> | Response;

/**
 * Wraps a route handler: rejects cross-site state-changing requests and turns unexpected
 * exceptions into a generic Azerbaijani message (details go to the server log only).
 */
export function route<C = unknown>(handler: Handler<C>, opts: { mutating?: boolean } = {}): Handler<C> {
  return async (req, ctx) => {
    try {
      if (opts.mutating && !sameOrigin(req)) return fail(403, MSG.forbidden);
      return await handler(req, ctx);
    } catch (e) {
      console.error("[scholarship]", req.method, new URL(req.url).pathname, e);
      return fail(500, MSG.server);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}
