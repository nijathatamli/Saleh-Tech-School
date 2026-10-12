import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fromBakuLocal } from "@/features/parent-dashboard/az";

const day = /^\d{4}-\d{2}-\d{2}$/;

/** Admin read-only view of attendance: server-side filters + pagination, with totals for the whole filter (not just the page). */
export async function listAttendance(p: { classId?: string; studentId?: string; status?: string; from?: string; to?: string; page: number; size: number }) {
  const where: Prisma.AttendanceWhereInput = {
    ...(p.studentId ? { studentId: p.studentId } : {}),
    ...(p.status && ["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(p.status) ? { status: p.status as never } : {}),
    lesson: {
      status: { not: "CANCELLED" },
      ...(p.classId ? { classId: p.classId } : {}),
    },
    ...((p.from && day.test(p.from)) || (p.to && day.test(p.to))
      ? { date: { ...(p.from && day.test(p.from) ? { gte: fromBakuLocal(`${p.from}T00:00`) } : {}), ...(p.to && day.test(p.to) ? { lt: new Date(fromBakuLocal(`${p.to}T00:00`).getTime() + 86_400_000) } : {}) } }
      : {}),
  };
  const [total, rows, byStatus] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "asc" }],
      skip: (p.page - 1) * p.size,
      take: p.size,
      select: {
        id: true, status: true, note: true, completed: true, date: true,
        student: { select: { id: true, firstName: true, lastName: true } },
        lesson: { select: { id: true, title: true, class: { select: { id: true, name: true } } } },
        markedBy: { select: { name: true } },
      },
    }),
    prisma.attendance.groupBy({ by: ["status"], where, _count: { _all: true } }),
  ]);
  const totals = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all])) as Record<string, number>;
  return {
    total,
    totals,
    items: rows.map((r) => ({
      id: r.id, status: r.status, note: r.note, completed: r.completed, date: r.date.toISOString(),
      studentId: r.student.id, studentName: `${r.student.firstName} ${r.student.lastName}`,
      lessonId: r.lesson.id, classId: r.lesson.class.id, className: r.lesson.class.name, markedBy: r.markedBy?.name ?? null,
    })),
  };
}
