import Link from "next/link";
import { ArrowRight, BookOpen, Flame, Trophy } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashCard } from "@/components/dash/card";
import { GlassCard } from "@/components/dash/glass-card";
import { StatRing } from "@/components/dash/stat-ring";
import { LevelRing } from "@/components/dash/level-ring";
import { StreakWeek } from "@/components/dash/streak-week";
import { ProgressBars } from "@/components/dash/progress-bars";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { attendanceRate, averageProgress, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** XP needed to reach the next level. Mirrors the prototype's 1,500-at-L12
 *  curve; swap for your real formula if you have one. */
function nextLevelXp(level: number) {
  return (level + 1) * 125;
}

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const classIds = student.enrollments.map((e) => e.classId).filter((id): id is string => !!id);

  const [nextLesson, activeSubmissions, recentSubmissions] = await Promise.all([
    classIds.length
      ? prisma.lesson.findFirst({
          where: { classId: { in: classIds }, date: { gte: new Date() } },
          orderBy: { date: "asc" },
          include: { class: { include: { teacher: { include: { user: true } } } } },
        })
      : null,
    prisma.submission.findMany({
      where: { studentId: student.id, status: { in: ["PENDING", "OVERDUE"] } },
      include: { homework: true },
      orderBy: { homework: { dueDate: "asc" } },
    }),
    prisma.submission.findMany({
      where: { studentId: student.id, submittedAt: { not: null } },
      include: { homework: true },
      orderBy: { submittedAt: "desc" },
      take: 4,
    }),
  ]);

  const todaysTask = activeSubmissions[0] ?? null;
  const course = student.enrollments[0]?.course;
  const subjects = student.progress.map((p) => ({ name: p.skill, pct: p.percent }));
  const overall = averageProgress(student.progress);
  const rate = attendanceRate(student.attendance);

  const target = nextLevelXp(student.level);
  const levelPct = Math.min(100, Math.round((student.xp / target) * 100));

  const achievements = [...student.studentBadges]
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
    .slice(0, 6);

  const firstName = student.firstName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Sabahın xeyir" : hour < 18 ? "Salam" : "Axşamın xeyir";

  return (
    <main className="mx-auto max-w-[1240px] px-6 pb-20 pt-11 md:px-11">
      <div
        aria-hidden
        className="pointer-events-none fixed -right-56 -top-80 -z-10 h-[820px] w-[1000px] animate-blob rounded-full blur-[30px]"
        style={{ background: "radial-gradient(closest-side, rgba(255,107,0,0.13), rgba(255,107,0,0) 78%)" }}
      />

      <header className="mb-11 flex items-start justify-between gap-8 [animation:count-up_0.5s_ease_both]">
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-[1.12] tracking-[-0.032em]">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mt-3 text-[16.5px] tracking-[-0.005em] text-dash-muted">Bu gün nə yaradacağıq?</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-full border border-dash-ink/[0.055] bg-white/60 py-1.5 pl-3.5 pr-1.5 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/[0.05]">
          <span className="whitespace-nowrap text-[12.5px] font-semibold">Səviyyə {student.level}</span>
          <Avatar name={`${student.firstName} ${student.lastName}`} src={student.avatarUrl} size={32} />
        </div>
      </header>

      {/* ── BU GÜN ─────────────────────────────────────────── */}
      <div className="mb-[18px] pl-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
        Bu gün
      </div>
      <section className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(330px,1fr))]">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1C1B19] to-[#2A2825] p-9 text-white shadow-[0_30px_66px_-34px_rgba(23,23,23,0.6)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80"
            style={{ background: "radial-gradient(closest-side, rgba(255,107,0,0.42), rgba(255,107,0,0) 74%)" }}
          />
          <div className="relative">
            <div className="mb-[22px] flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-400" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
                Növbəti dərs
              </span>
            </div>
            {nextLesson ? (
              <>
                <h2 className="font-display text-[27px] font-semibold leading-[1.24] tracking-[-0.028em]">
                  {nextLesson.title}
                </h2>
                <div className="my-5 text-[14.5px] font-semibold">
                  {new Date(nextLesson.date).toLocaleDateString("az-AZ", { day: "2-digit", month: "long" })} ·{" "}
                  {new Date(nextLesson.date).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center gap-3 border-t border-white/[0.12] pt-[22px]">
                  <Avatar
                    name={nextLesson.class.teacher.user.name}
                    src={nextLesson.class.teacher.user.avatarUrl}
                    size={38}
                  />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold">{nextLesson.class.teacher.user.name}</div>
                    <div className="mt-0.5 text-xs text-white/55">{nextLesson.class.teacher.position}</div>
                  </div>
                </div>
                <Link
                  href="/student/homework"
                  className="mt-[26px] flex w-full items-center justify-center gap-2 rounded-2xl bg-electric-500 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(255,107,0,0.7)] transition hover:-translate-y-px"
                >
                  Dərsə bax <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-white/55">Yaxın vaxtda planlaşdırılmış dərs yoxdur.</p>
            )}
          </div>
        </div>

        <DashCard className="flex flex-col rounded-[28px] p-9">
          <div className="mb-[22px] flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-dash-muted">
              Bugünkü tapşırıq
            </span>
          </div>
          {todaysTask ? (
            <>
              <h2 className="font-display text-[25px] font-semibold leading-[1.26] tracking-[-0.028em]">
                {todaysTask.homework.title}
              </h2>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-[9px] bg-electric-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-electric-600">
                  Təhvil: {formatDate(todaysTask.homework.dueDate)}
                </span>
                <span className="rounded-[9px] bg-grey-100 px-3 py-1.5 text-[11.5px] font-semibold text-navy-600">
                  {todaysTask.status === "OVERDUE" ? "Gecikmiş" : "Başlanmadı"}
                </span>
              </div>
              <Link
                href="/student/homework"
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-dash-ink py-4 text-[13.5px] font-semibold text-white transition hover:-translate-y-px dark:bg-white dark:text-dash-ink"
              >
                Tapşırığa başla <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <DashEmptyState icon={BookOpen} title="Hər şey tamamlanıb." description="Gözləyən tapşırıq yoxdur." />
          )}
        </DashCard>
      </section>

      {/* ── ÖYRƏNMƏYƏ DAVAM ET ─────────────────────────────── */}
      {course && (
        <DashCard className="mb-5 flex flex-wrap items-center gap-9 rounded-[28px] p-9">
          <div className="min-w-[260px] flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
              Öyrənməyə davam et
            </div>
            <h2 className="mt-3.5 font-display text-[26px] font-semibold tracking-[-0.028em]">{course.name}</h2>
            <p className="mt-2.5 text-[14.5px] text-dash-muted">
              {course.durationMonths} ay · həftədə {course.lessonsPerWeek} dərs
            </p>
            <div className="mt-6 max-w-[420px]">
              <div className="h-1.5 overflow-hidden rounded-full bg-dash-rule dark:bg-dash-dark-rule">
                <div className="h-full rounded-full bg-electric-500" style={{ width: `${overall}%` }} />
              </div>
              <div className="mt-2.5 text-[12.5px] text-dash-muted">{overall}% tamamlanıb</div>
            </div>
          </div>
          <Link
            href="/student/homework"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl bg-electric-500 px-[34px] py-[17px] text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(255,107,0,0.6)] transition hover:-translate-y-px"
          >
            Davam et <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </DashCard>
      )}

      {/* ── XP / SƏVİYYƏ / SERİYA ──────────────────────────── */}
      <section className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <DashCard className="rounded-[26px] p-[34px]">
          <div className="mb-1.5 flex items-baseline justify-between gap-4">
            <div className="font-display text-[34px] font-semibold leading-none tracking-[-0.035em]">
              {student.xp.toLocaleString("az-AZ")}
              <span className="ml-1.5 text-[17px] font-medium text-dash-muted">XP</span>
            </div>
            <span className="shrink-0 rounded-lg bg-electric-500/10 px-3 py-1.5 text-[11.5px] font-semibold">
              {student.points.toLocaleString("az-AZ")} bal
            </span>
          </div>
          <div className="mb-[26px] text-[12.5px] text-dash-muted">
            Səviyyə {student.level + 1}-ə {Math.max(0, target - student.xp).toLocaleString("az-AZ")} XP qalıb
          </div>
          <div className="flex flex-col gap-px overflow-hidden rounded-2xl bg-dash-ink/[0.055]">
            {[
              ["Ev tapşırığı", "+20 XP"],
              ["Layihə", "+100 XP"],
              ["Mükəmməl quiz", "+50 XP"],
            ].map(([label, xp]) => (
              <div key={label} className="flex items-center gap-3.5 bg-white px-4 py-3.5 dark:bg-dash-dark-surface">
                <span className="flex-1 text-[13.5px] font-medium">{label}</span>
                <span className="whitespace-nowrap text-[13px] font-semibold text-electric-600">{xp}</span>
              </div>
            ))}
          </div>
        </DashCard>

        <DashCard className="flex flex-col rounded-[26px] p-[34px]">
          <div className="mb-[26px] flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
                Səviyyə {student.level}
              </div>
              <div className="mt-2.5 font-display text-[22px] font-semibold tracking-[-0.025em]">
                {student.xp.toLocaleString("az-AZ")} / {target.toLocaleString("az-AZ")} XP
              </div>
            </div>
            <LevelRing level={student.level} pct={levelPct} />
          </div>
          <div className="border-t border-dash-ink/[0.06] pt-6">
            <div className="mb-[18px] flex items-center gap-2.5">
              <Flame className="h-4 w-4 text-electric-500" />
              <span className="text-[14.5px] font-semibold">{student.streakDays} günlük seriya</span>
              <span className="text-[12.5px] text-dash-muted">· Davam et!</span>
            </div>
            <StreakWeek days={student.streakDays} />
          </div>
        </DashCard>
      </section>

      {/* ── İNKİŞAF + DAVAMİYYƏT ───────────────────────────── */}
      <section className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        <DashCard className="rounded-[28px] p-9">
          <div className="mb-[34px]">
            <h2 className="font-display text-[23px] font-semibold tracking-[-0.025em]">Sənin inkişafın</h2>
            <p className="mt-2 text-[14.5px] text-dash-muted">Fənlər üzrə irəliləyişin.</p>
          </div>
          {subjects.length > 0 ? (
            <ProgressBars subjects={subjects} />
          ) : (
            <p className="text-sm text-dash-muted">Hələ inkişaf məlumatı yoxdur.</p>
          )}
        </DashCard>

        <GlassCard className="flex items-center gap-[30px] rounded-[26px]">
          <StatRing value={rate} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">Davamiyyət</div>
            <div className="my-2 font-display text-[17px] font-semibold tracking-[-0.02em]">
              {rate >= 80 ? "Əla davamiyyət" : "Diqqət tələb edir"}
            </div>
            <p className="text-[13.5px] leading-[1.5] text-dash-muted">
              {student.attendance.length} dərsdən{" "}
              {student.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length}-ində iştirak
              etmisən.
            </p>
          </div>
        </GlassCard>
      </section>

      {/* ── LAYİHƏLƏR ──────────────────────────────────────── */}
      {student.projects.length > 0 && (
        <section className="mb-5">
          <div className="mb-[18px] flex items-baseline justify-between pl-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
              Mənim layihələrim
            </div>
            <Link href="/student/portfolio" className="text-[12.5px] font-semibold text-electric-600">
              Hamısı
            </Link>
          </div>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {student.projects.slice(0, 3).map((p) => (
              <DashCard key={p.id} className="overflow-hidden rounded-[26px] p-0 transition hover:-translate-y-0.5">
                <div className="flex h-[132px] items-center justify-center bg-gradient-to-br from-[#1C1B19] to-[#33302B]">
                  <Trophy className="h-8 w-8 text-white/40" />
                </div>
                <div className="p-[26px]">
                  <div className="font-display text-[17px] font-semibold tracking-[-0.02em]">{p.title}</div>
                  <div className="mt-[7px] text-[12.5px] text-dash-muted">
                    {p.technologies.join(" · ") || p.courseTag}
                  </div>
                </div>
              </DashCard>
            ))}
          </div>
        </section>
      )}

      {/* ── NAİLİYYƏTLƏR + FƏALİYYƏT ───────────────────────── */}
      <section className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <div>
          <div className="mb-[18px] pl-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
            Nailiyyətlər
          </div>
          {achievements.length === 0 ? (
            <DashEmptyState icon={Trophy} title="İlk nailiyyət gözləyir." description="Öyrənməyə davam et." />
          ) : (
            <div className="grid grid-cols-2 gap-[11px]">
              {achievements.map((a) => (
                <DashCard key={a.id} className="flex items-center gap-3.5 rounded-[20px] p-[18px]">
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] bg-electric-500/10 text-base">
                    {a.badge.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-[12.5px] font-semibold uppercase tracking-[0.04em]">
                      {a.badge.name}
                    </div>
                    <div className="mt-1 text-[11px] text-dash-muted">{formatDate(a.earnedAt)}</div>
                  </div>
                </DashCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-[18px] pl-0.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
            Son fəaliyyət
          </div>
          <div className="flex flex-col pl-0.5">
            {recentSubmissions.map((s, i) => (
              <div key={s.id} className="flex gap-4 py-3.5">
                <span className="w-[74px] shrink-0 pt-px text-xs text-dash-muted">
                  {formatDate(s.submittedAt as Date)}
                </span>
                <span
                  className={`mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full ${i === 0 ? "bg-electric-500" : "bg-dash-ink/15"}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {s.homework.title}
                  {s.status === "GRADED" && s.score !== null ? ` — ${s.score}` : ""}
                </span>
              </div>
            ))}
            {recentSubmissions.length === 0 && <p className="text-sm text-dash-muted">Hələ fəaliyyət yoxdur.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
