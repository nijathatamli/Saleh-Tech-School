import { TrendingUp } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressChart } from "@/components/app/progress-chart";

export const dynamic = "force-dynamic";

export default async function ProgressPage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div>
        <AppTopbar title="Tərəqqi" userName={parent.user.name} userEmail={parent.user.email} />
        <div className="p-6 md:p-10">
          <EmptyState icon={TrendingUp} title="Uşaq tapılmadı" />
        </div>
      </div>
    );
  }

  const grades = await prisma.grade.findMany({
    where: { studentId: child.id },
    orderBy: { createdAt: "asc" },
  });

  const chartData = grades.map((g) => ({
    label: new Date(g.createdAt).toLocaleDateString("az-AZ", { day: "2-digit", month: "short" }),
    score: Math.round((g.score / g.maxScore) * 100),
  }));

  return (
    <div>
      <AppTopbar title="Tərəqqi" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        {parent.children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => (
              <a
                key={c.id}
                href={`/parent/progress?child=${c.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  c.id === child.id ? "bg-electric-500 text-white" : "border border-navy-100 bg-white text-navy-400"
                }`}
              >
                {c.firstName} {c.lastName}
              </a>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
            <h3 className="mb-6 font-app text-base font-bold text-navy-900">Bacarıqlar üzrə tərəqqi</h3>
            {child.progress.length === 0 ? (
              <p className="text-sm text-navy-400">Hələ tərəqqi qeydi yoxdur.</p>
            ) : (
              <div className="space-y-5">
                {child.progress.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1.5 flex justify-between text-xs text-navy-400">
                      <span>{p.skill}</span>
                      <span className="font-bold text-navy-900">{p.percent}%</span>
                    </div>
                    <Progress value={p.percent} color="electric" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
            <h3 className="mb-6 font-app text-base font-bold text-navy-900">Zaman üzrə tərəqqi</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-navy-400">Hələ kifayət qədər məlumat yoxdur.</p>
            ) : (
              <ProgressChart data={chartData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
