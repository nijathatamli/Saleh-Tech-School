import { prisma } from "@/lib/prisma";
import { MSG } from "@/lib/scholarship/config";
import { fail, ok, route } from "@/lib/scholarship/http";
import { getSessionStudent } from "@/lib/scholarship/session";

export const dynamic = "force-dynamic";

// Only fields that are safe to show: never the FIN, the hash or internal counters.
export const GET = route(async () => {
  const s = await getSessionStudent();
  if (!s) return fail(401, MSG.sessionExpired);
  const attempt = await prisma.scholarshipAttempt.findUnique({ where: { studentId: s.id }, select: { status: true } });
  return ok({
    student: { id: s.id, name: s.name, surname: s.surname, category: { key: s.categoryKey, label: s.categoryLabel } },
    exam: { status: attempt?.status ?? "NOT_STARTED" },
  });
});
