import { BookOpen } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { submitHomework } from "./actions";

export const dynamic = "force-dynamic";

const statusMeta: Record<string, { label: string; variant: "warning" | "default" | "success" }> = {
  PENDING: { label: "Gözləyir", variant: "warning" },
  SUBMITTED: { label: "Təqdim edilib", variant: "default" },
  GRADED: { label: "Qiymətləndirilib", variant: "success" },
  OVERDUE: { label: "Gecikmiş", variant: "warning" },
};

export default async function StudentHomeworkPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const submissions = await prisma.submission.findMany({
    where: { studentId: student.id },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "desc" } },
  });

  return (
    <div>
      <AppTopbar title="Ev tapşırığı" userName={student.user?.name ?? student.firstName} userEmail={student.user?.email ?? ""} />

      <div className="space-y-4 p-6 md:p-10">
        {submissions.length === 0 ? (
          <EmptyState icon={BookOpen} title="Hələ tapşırıq yoxdur" />
        ) : (
          submissions.map((s) => {
            const meta = statusMeta[s.status];
            return (
              <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-navy-900">{s.homework.title}</p>
                  <p className="mt-1 text-xs text-navy-400">{s.homework.lesson.class.course.name} · Son tarix {formatDate(s.homework.dueDate)}</p>
                  {s.feedback && <p className="mt-2 rounded-lg bg-navy-50 p-2 text-xs italic text-navy-600">"{s.feedback}"</p>}
                </div>
                <div className="flex items-center gap-3">
                  {s.score !== null && <span className="font-bold text-navy-900">{s.score}/100</span>}
                  <Badge variant={meta.variant} size="md">{meta.label}</Badge>
                  {s.status === "PENDING" && (
                    <form action={submitHomework.bind(null, s.id)}>
                      <Button type="submit" variant="app" size="sm">Təqdim et</Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
