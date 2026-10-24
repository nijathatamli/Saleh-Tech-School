// Small helpers shared by the admin / teacher / student REST routes: one place that turns
// "who is calling" and "what went wrong" into consistent JSON + status codes, so no route
// leaks stack traces or database errors (details go to the server log only).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessError } from "@/lib/access";

export class ApiError extends Error {
  constructor(public readonly status: 400 | 404 | 409 | 422, message: string, public readonly fields?: Record<string, string>) {
    super(message);
  }
}

export const MSG = {
  unauthenticated: "Sessiya müddəti bitib. Zəhmət olmasa yenidən daxil olun.",
  forbidden: "Bu əməliyyata icazə verilmir.",
  notFound: "Məlumat tapılmadı.",
  invalid: "Məlumatlar düzgün deyil.",
  server: "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.",
  classCreate: "Sinif yaratmaq mümkün olmadı.",
  teacherNotFound: "Müəllim tapılmadı.",
  studentNotFound: "Tələbə tapılmadı.",
  alreadyMember: "Seçilmiş tələbə artıq bu sinifdədir.",
  lessonComplete: "Dərsin tamamlanması mümkün olmadı.",
  paymentCreate: "Ödəniş məlumatı yaradılmadı.",
} as const;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export const ok = (data: unknown, status = 200) => json(data, status);
export const fail = (status: number, error: string, fields?: Record<string, string>) => json({ error, ...(fields ? { fields } : {}) }, status);

/** Signed-in user of the session cookie (id + role), or an AccessError. */
export async function sessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new AccessError("unauthenticated");
  return { id: session.user.id as string, role: session.user.role as "PARENT" | "TEACHER" | "STUDENT" | "ADMIN" | "BLOGGER", name: session.user.name ?? "" };
}

/** Requires the role AND that the account is still active in the database (a deactivated user's old cookie stops working). */
export async function requireRole(role: "ADMIN" | "TEACHER" | "STUDENT" | "BLOGGER") {
  const u = await sessionUser();
  if (u.role !== role) throw new AccessError("forbidden");
  const row = await prisma.user.findUnique({ where: { id: u.id }, select: { active: true, role: true } });
  if (!row || !row.active || row.role !== role) throw new AccessError("forbidden");
  return u;
}

/** Cross-site requests with a browser Origin that does not match the host are refused (cookies are SameSite=Lax as well). */
export function sameOriginOk(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

type Ctx = { params: Record<string, string> };

/** Wraps a route handler: CSRF check for mutations, error → status mapping, safe 500s. */
export function handle(fn: (req: Request, ctx: Ctx) => Promise<Response>, opts: { mutating?: boolean } = {}) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      if (opts.mutating && !sameOriginOk(req)) return fail(403, MSG.forbidden);
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof AccessError) {
        if (e.code === "unauthenticated") return fail(401, MSG.unauthenticated);
        if (e.code === "forbidden") return fail(403, MSG.forbidden);
        return fail(404, MSG.notFound);
      }
      if (e instanceof ApiError) return fail(e.status, e.message, e.fields);
      if (e instanceof ZodError) {
        const fields: Record<string, string> = {};
        for (const i of e.issues) {
          fields[String(i.path[0] ?? "form")] ??= i.message;
          if (i.path.length > 1) fields[i.path.join(".")] ??= i.message; // nested bodies: "student.email", "student.newParent.password"
        }
        return fail(400, Object.values(fields)[0] ?? MSG.invalid, fields);
      }
      // a unique key lost a race between "does it exist?" and "create it": the duplicate is a conflict, not a server fault
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fail(409, "Bu qeyd artıq mövcuddur.");
      console.error("[api]", req.method, new URL(req.url).pathname, e);
      return fail(500, MSG.server);
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, MSG.invalid);
  }
}

/** Drop cached server renders of every dashboard that shows classes, lessons or payments. */
export function revalidateDashboards() {
  for (const p of ["/admin", "/teacher", "/student", "/parent"]) revalidatePath(p, "layout");
}

export function pageParams(url: URL, defaults = { size: 20, max: 100 }) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const size = Math.min(defaults.max, Math.max(1, Number(url.searchParams.get("size")) || defaults.size));
  return { page, size, skip: (page - 1) * size };
}
