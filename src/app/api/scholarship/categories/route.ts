import { prisma } from "@/lib/prisma";
import { ok, route } from "@/lib/scholarship/http";

export const dynamic = "force-dynamic";

// Public: the class groups come straight from the question files that were imported.
export const GET = route(async () => {
  const categories = await prisma.scholarshipCategory.findMany({
    where: { questions: { some: {} } },
    orderBy: { sortOrder: "asc" },
    select: { key: true, label: true },
  });
  return ok({ categories });
});
