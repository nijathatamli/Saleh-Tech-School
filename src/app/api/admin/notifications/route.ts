import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, ok, pageParams, readJson, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const admin = await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size, skip } = pageParams(url, { size: 20, max: 100 });
  const event = url.searchParams.get("event") || undefined;
  const filter = url.searchParams.get("read");
  const where = { userId: admin.id, ...(event ? { event } : {}), ...(filter === "unread" ? { read: false } : filter === "read" ? { read: true } : {}) };
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: size }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: admin.id, read: false } }),
  ]);
  return ok({ page, total, unread, items });
});

const body = z.object({ ids: z.array(z.string()).optional() });

// mark specific notifications (or all, when no ids are sent) as read
export const PATCH = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const { ids } = body.parse(await readJson(req));
    const { count } = await prisma.notification.updateMany({ where: { userId: admin.id, read: false, ...(ids ? { id: { in: ids } } : {}) }, data: { read: true } });
    return ok({ updated: count });
  },
  { mutating: true }
);
