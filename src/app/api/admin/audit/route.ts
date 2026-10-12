import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, ok, pageParams, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size, skip } = pageParams(url, { size: 30, max: 100 });
  const action = url.searchParams.get("action")?.trim();
  const entityType = url.searchParams.get("entityType")?.trim();
  const where: Prisma.AuditLogWhereInput = { ...(action ? { action: { startsWith: action } } : {}), ...(entityType ? { entityType } : {}) };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size, include: { actor: { select: { name: true, role: true } } } }),
  ]);
  return ok({ page, total, items: rows.map((r) => ({ id: r.id, action: r.action, entityType: r.entityType, entityId: r.entityId, actor: r.actor.name, actorRole: r.actor.role, before: r.before, after: r.after, createdAt: r.createdAt.toISOString() })) });
});
