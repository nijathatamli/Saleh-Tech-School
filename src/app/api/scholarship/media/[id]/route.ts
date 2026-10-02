import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MSG } from "@/lib/scholarship/config";
import { fail, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";

export const dynamic = "force-dynamic";

// Question images are served only to a signed-in candidate who has started the exam, and
// only if the image belongs to a question of their own class.
export const GET = route(async (_req, ctx: { params: { id: string } }) => {
  const id = ctx.params.id;
  if (!/^[0-9a-f]{16}$/.test(id)) return fail(404, MSG.badRequest);
  const s = await getSessionStudent();
  if (!s) return fail(401, MSG.sessionExpired);

  const attempt = await prisma.scholarshipAttempt.findUnique({ where: { studentId: s.id }, select: { id: true } });
  if (!attempt) return fail(403, MSG.forbidden);
  const owns = await prisma.scholarshipQuestion.findFirst({ where: { categoryKey: s.categoryKey, imageIds: { has: id } }, select: { id: true } });
  if (!owns) return fail(404, MSG.badRequest);

  const media = await prisma.scholarshipMedia.findUnique({ where: { id } });
  if (!media) return fail(404, MSG.badRequest);
  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
});
