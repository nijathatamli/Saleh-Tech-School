import { notFound } from "next/navigation";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { gradeSubmission } from "../actions";

export const dynamic = "force-dynamic";

const statusMeta: Record<string, { label: string; variant: "warning" | "default" | "success" }> = {
  PENDING: { label: "Gözləyir", variant: "warning" },
  SUBMITTED: { label: "Təqdim edilib", variant: "default" },
  GRADED: { label: "Qiymətləndirilib", variant: "success" },
  OVERDUE: { label: "Gecikmiş", variant: "warning" },
};

export default async function HomeworkGradingPage({ params }: { params: { id: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const homework = await prisma.homework.findFirst({
    where: { id: params.id, lesson: { class: { teacherId: teacher.id } } },
    include: {
      lesson: { include: { class: { include: { course: true } } } },
      submissions: { include: { student: true }, orderBy: { student: { firstName: "asc" } } },
    },
  });
  if (!homework) notFound();

  return (
    <div>
      <AppTopbar title={homework.title} userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-6 p-6 md:p-10">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{homework.lesson.class.course.name}</p>
          <h2 className="mt-1 font-display text-lg text-navy-900">{homework.title}</h2>
          <p className="mt-2 text-sm text-navy-400">{homework.description}</p>
          <p className="mt-2 text-xs text-navy-400">Son tarix: {formatDate(homework.dueDate)}</p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          {homework.submissions.map((s) => {
            const meta = statusMeta[s.status];
            return (
              <div key={s.id} className="flex flex-col gap-4 border-b border-navy-50 p-5 last:border-0 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                  <Avatar name={`${s.student.firstName} ${s.student.lastName}`} src={s.student.avatarUrl} size={36} />
                  <span className="font-bold text-navy-900">{s.student.firstName} {s.student.lastName}</span>
                </div>
                <Badge variant={meta.variant} size="md">{meta.label}</Badge>

                {s.status === "GRADED" ? (
                  <div className="flex-1 text-sm">
                    <span className="font-bold text-navy-900">{s.score}/100</span>
                    {s.feedback && <span className="ml-2 text-navy-400 italic">"{s.feedback}"</span>}
                  </div>
                ) : s.status === "SUBMITTED" ? (
                  <form action={gradeSubmission} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="submissionId" value={s.id} />
                    <input
                      type="number"
                      name="score"
                      min={0}
                      max={100}
                      required
                      placeholder="Bal"
                      className="w-20 rounded-lg border border-navy-100 px-3 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      name="feedback"
                      placeholder="Rəy yazın..."
                      className="min-w-[160px] flex-1 rounded-lg border border-navy-100 px-3 py-1.5 text-sm"
                    />
                    <Button type="submit" variant="app" size="sm">Qiymətləndir</Button>
                  </form>
                ) : (
                  <span className="flex-1 text-xs text-navy-400">Tələbə hələ təqdim etməyib</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
