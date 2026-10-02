import { prisma } from "@/lib/prisma";
import { examDurationMinutes, examSize } from "./config";

export type CategoryInfo = { key: string; label: string; gradeFrom: number; gradeTo: number; durationMinutes: number };

/** Class groups that actually have questions — i.e. the ones present in the imported question files. */
export async function getCategories(): Promise<CategoryInfo[]> {
  const [cats, counts] = await Promise.all([
    prisma.scholarshipCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { key: true, label: true, gradeFrom: true, gradeTo: true } }),
    prisma.scholarshipQuestion.groupBy({ by: ["categoryKey", "subject"], _count: { _all: true } }),
  ]);
  return cats
    .map((c) => {
      const pool = Object.fromEntries(counts.filter((x) => x.categoryKey === c.key).map((x) => [x.subject, x._count._all]));
      const size = examSize(pool);
      return { ...c, durationMinutes: examDurationMinutes(size), size };
    })
    .filter((c) => c.size > 0)
    .map(({ size: _size, ...c }) => c);
}
