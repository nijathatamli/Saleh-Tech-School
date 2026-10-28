import { prisma } from "@/lib/prisma";
import { handle, ok, sessionUser } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Nothing older than this is announced as "new" (a user who comes back after a day is not greeted by a pile of banners). */
const FRESH_MS = 10 * 60_000;
const MAX_ITEMS = 5;

/**
 * Feed for the slide-in banners of every panel (admin, teacher, student, parent): the signed-in user's unread
 * notifications created after `since` (the `now` of the previous answer). Without `since` it only returns the cursor,
 * so opening a page never replays old notifications. The cursor is the server's clock, so a wrong clock on the
 * visitor's device cannot hide or repeat anything.
 */
export const GET = handle(async (req) => {
  const u = await sessionUser();
  const row = await prisma.user.findUnique({ where: { id: u.id }, select: { active: true } });
  if (!row?.active) return ok({ now: new Date().toISOString(), userId: u.id, role: u.role, unread: 0, items: [] });

  const now = new Date();
  const raw = new URL(req.url).searchParams.get("since");
  const since = raw ? new Date(raw) : null;
  const unread = await prisma.notification.count({ where: { userId: u.id, read: false } });
  if (!since || Number.isNaN(since.getTime())) return ok({ now: now.toISOString(), userId: u.id, role: u.role, unread, items: [] });

  const floor = new Date(now.getTime() - FRESH_MS);
  const items = await prisma.notification.findMany({
    where: { userId: u.id, read: false, createdAt: { gt: since > floor ? since : floor, lte: now } },
    orderBy: { createdAt: "asc" },
    take: MAX_ITEMS,
    select: { id: true, title: true, body: true, type: true, event: true, createdAt: true },
  });
  return ok({ now: now.toISOString(), userId: u.id, role: u.role, unread, items });
});
