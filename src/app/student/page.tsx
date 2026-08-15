import Link from "next/link";
import { Flame, Star, Trophy, BookOpen, ArrowUpRight } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const xpIntoLevel = student.xp % 200;
  const levelProgress = Math.round((xpIntoLevel / 200) * 100);

  const homeworks = await prisma.submission.findMany({
    where: { studentId: student.id, status: { in: ["PENDING", "SUBMITTED"] } },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "asc" } },
    take: 3,
  });

  return (
    <div>
      <AppTopbar title="Dashboard" userName={student.user?.name ?? student.firstName} userEmail={student.user?.email ?? ""} />

      <div className="space-y-8 p-6 md:p-10">
        {/* Gamified hero band */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-electric-600 p-8 text-white">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm text-white/70">Salam, {student.firstName} 👋</p>
              <h2 className="mt-1 font-app text-2xl font-extrabold">Səviyyə {student.level}</h2>
              <div className="mt-4 w-56">
                <div className="mb-1 flex justify-between text-xs text-white/70">
                  <span>{student.xp.toLocaleString("az-AZ")} XP</span>
                  <span>Növbəti səviyyə</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-teal-400" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-extrabold">
                  <Flame className="h-6 w-6 text-orange-400" /> {student.streakDays}
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Gün ardıcıl</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-extrabold">
                  <Star className="h-6 w-6 text-amber-400" /> {student.points.toLocaleString("az-AZ")}
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Xal</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-extrabold">
                  <Trophy className="h-6 w-6 text-amber-300" /> {student.studentBadges.length}
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/60">Nişan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h3 className="mb-4 font-app text-base font-bold text-navy-900">Kurslarım</h3>
              {student.enrollments.length === 0 ? (
                <EmptyState icon={BookOpen} title="Hələ kursa yazılmamısınız" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {student.enrollments.map((e) => (
                    <div key={e.id} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
                      <p className="font-bold text-navy-900">{e.course.name}</p>
                      <p className="mt-1 text-xs text-navy-400">{e.course.durationMonths} ay · {e.course.lessonsPerWeek} dərs/həftə</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-app text-base font-bold text-navy-900">Ev tapşırıqları</h3>
                <Link href="/student/homework" className="flex items-center gap-1 text-xs font-bold text-electric-600">
                  Hamısına bax <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {homeworks.length === 0 ? (
                <EmptyState icon={BookOpen} title="Gözləyən tapşırıq yoxdur" description="Əla iş! Hamısı tamamlanıb." />
              ) : (
                <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
                  {homeworks.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b border-navy-50 p-5 last:border-0">
                      <div>
                        <p className="text-sm font-bold text-navy-900">{s.homework.title}</p>
                        <p className="text-xs text-navy-400">{s.homework.lesson.class.course.name}</p>
                      </div>
                      <span className="text-xs font-bold text-navy-400">Son: {formatDate(s.homework.dueDate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
            <h3 className="mb-6 flex items-center gap-2 font-app text-base font-bold text-navy-900">
              <Trophy className="h-4 w-4 text-amber-500" /> Nişanlarım
            </h3>
            {student.studentBadges.length === 0 ? (
              <p className="text-sm text-navy-400">Hələ nişan qazanmamısınız. Davam et! 🚀</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {student.studentBadges.map((sb) => (
                  <div key={sb.id} className="flex flex-col items-center gap-1 rounded-xl bg-navy-50 p-3 text-center" title={sb.badge.description}>
                    <span className="text-2xl">{sb.badge.emoji}</span>
                    <span className="text-[10px] font-bold leading-tight text-navy-900">{sb.badge.name}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {student.progress.slice(0, 3).map((p) => (
                <Badge key={p.id} variant="app-violet">{p.skill} {p.percent}%</Badge>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
