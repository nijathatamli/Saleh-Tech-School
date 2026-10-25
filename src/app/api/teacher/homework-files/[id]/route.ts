import { handle, ok, requireRole } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Removes a file the teacher uploaded but has not attached to a homework yet (the ✕ next to it in the form). */
export const DELETE = handle(
  async (_req, { params }) => {
    const teacher = await requireRole("TEACHER");
    await prisma.homeworkFile.deleteMany({ where: { id: params.id, uploaderId: teacher.id, homeworkId: null } });
    return ok({ ok: true });
  },
  { mutating: true }
);
