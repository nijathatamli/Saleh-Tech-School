import Link from "next/link";
import { Users, Trophy, BookOpen, Activity } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashCard } from "@/components/dash/card";
import { GlassCard } from "@/components/dash/glass-card";
import { StatRing } from "@/components/dash/stat-ring";
import { ProgressBars } from "@/components/dash/progress-bars";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { ProgressChart } from "@/components/app/progress-chart";
import { attendanceRate, formatDate, relativeDayLabel } from "@/lib/utils";
import { homeworkStatusMeta, homeworkStatusOrder } from "@/lib/homework";
import { format } from "@/i18n/locales";
import { getServerDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { dict } = getServerDictionary();
  const child = parent.children[0];

  if (!child) {
    return (
      <main className="mx-auto max-w-[1240px] px-6 pb-20 pt-11 md:px-11">
        <h1 className="mb-8 font-display text-[32px] font-semibold leading-[1.12] tracking-[-0.032em]">
          {dict.parentDashboard.greetingPrefix}, {parent.user.name.split(" ")[0]}
        </h1>
        <DashEmptyState icon={Users} title={dict.parentDashboard.noChildrenTitle} description={dict.parentDashboard.noChildrenDesc} />
      </main>
    );
  }

  const classIds = child.enrollments.map((e) => e.classId).filter((id): id is string => !!id);

  const [nextLesson, teacherNote, submissions] = await Promise.all([
    classIds.length
      ? prisma.lesson.findFirst({
          where: { classId: { in: classIds }, date: { gte: new Date() } },
          orderBy: { date: "asc" },
          include: { class: { include: { teacher: { include: { user: true } } } } },
        })
      : null,
    prisma.submission.findFirst({
      where: { studentId: child.id, feedback: { not: null } },
      orderBy: { submittedAt: "desc" },
      include: {
        homework: { include: { lesson: { include: { class: { include: { teacher: { include: { user: true } } } } } } } },
      },
    }),
    prisma.submission.findMany({
      where: { studentId: child.id },
      include: { homework: true },
      orderBy: { homework: { dueDate: "asc" } },
    }),
  ]);

  const homeworkPreview = [...submissions]
    .sort((a, b) => homeworkStatusOrder.indexOf(a.status) - homeworkStatusOrder.indexOf(b.status))
    .slice(0, 4);
  const activeHomeworkCount = submissions.filter((s) => s.status === "PENDING" || s.status === "OVERDUE").length;

  const achievements = [...child.studentBadges]
    .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
    .slice(0, 3);

  const activityEvents = [
    ...submissions
      .filter((s) => s.submittedAt)
      .map((s) => ({
        date: new Date(s.submittedAt as Date),
        text:
          s.status === "GRADED" && s.score !== null
            ? format(dict.parentDashboard.activityGraded, { title: s.homework.title, score: s.score })
            : format(dict.parentDashboard.activitySubmitted, { title: s.homework.title }),
      })),
    ...child.studentBadges.map((b) => ({
      date: new Date(b.earnedAt),
      text: format(dict.parentDashboard.activityBadgeEarned, { name: b.badge.name }),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4);

  const monthBuckets = new Map<string, { total: number; count: number; date: Date }>();
  for (const g of child.grades) {
    const d = new Date(g.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const entry = monthBuckets.get(key) ?? { total: 0, count: 0, date: new Date(d.getFullYear(), d.getMonth(), 1) };
    entry.total += g.score;
    entry.count += 1;
    monthBuckets.set(key, entry);
  }
  const trendData = Array.from(monthBuckets.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6)
    .map((b) => ({ label: b.date.toLocaleDateString("az-AZ", { month: "short" }), score: Math.round(b.total / b.count) }));
  const trendDelta =
    trendData.length >= 2 ? trendData[trendData.length - 1].score - trendData[0].score : null;

  const rate = attendanceRate(child.attendance);
  const course = child.enrollments[0]?.course;
  const age = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const attendanceCounts = child.attendance.reduce(
    (acc, a) => {
      if (a.status === "PRESENT") acc.present += 1;
      else if (a.status === "LATE") acc.late += 1;
      else acc.absent += 1;
      return acc;
    },
    { present: 0, late: 0, absent: 0 }
  );

  const subjects = child.progress.map((p) => ({ name: p.skill, pct: p.percent }));
  const learningProgress = subjects.length
    ? Math.round(subjects.reduce((sum, s) => sum + s.pct, 0) / subjects.length)
    : 0;
  const homeworkCompletion = child.submissions.length
    ? Math.round(
        (child.submissions.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED").length / child.submissions.length) * 100
      )
    : 0;

  const statusMeta = homeworkStatusMeta(dict);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? dict.parentDashboard.greetingMorning : hour < 18 ? dict.parentDashboard.greetingAfternoon : dict.parentDashboard.greetingEvening;

  return (
    <main className="mx-auto max-w-[1240px] px-6 pb-20 pt-11 md:px-11">
      <div
        aria-hidden
        className="pointer-events-none fixed -right-56 -top-80 -z-10 h-[820px] w-[1000px] animate-blob rounded-full blur-[30px]"
        style={{ background: "radial-gradient(closest-side, rgba(255,107,0,0.13), rgba(255,107,0,0) 78%)" }}
      />

      <header className="mb-13 flex items-start justify-between gap-8 [animation:count-up_0.5s_ease_both]">
        <div>
          <h1 className="font-display text-[40px] font-semibold leading-[1.12] tracking-[-0.032em]">
            {greeting}, {parent.user.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-[16.5px] tracking-[-0.005em] text-dash-muted">
            {format(dict.parentDashboard.greetingSubtitleChild, { name: child.firstName })}
          </p>
        </div>
      </header>

      <section className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <DashCard className="rounded-[26px] p-[30px]">
          <div className="flex items-center gap-[18px]">
            <Avatar name={`${child.firstName} ${child.lastName}`} src={child.avatarUrl} size={62} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-xl font-semibold tracking-[-0.02em]">
                {child.firstName} {child.lastName}
              </div>
              <div className="mt-1 text-[13.5px] text-dash-muted">
                {age} {dict.childProfile.yearsOld} {course ? `· ${course.name}` : ""}
              </div>
            </div>
          </div>
          <div className="my-6 flex items-center gap-2.5">
            <span className="inline-flex items-center gap-[7px] rounded-[9px] bg-electric-500/10 px-3 py-1.5 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />
              {dict.childProfile.level} {child.level}
            </span>
            <span className="rounded-[9px] bg-grey-100 px-3 py-1.5 text-xs font-medium text-navy-600">
              {child.points.toLocaleString("az-AZ")} {dict.childProfile.points}
            </span>
          </div>
          <Link
            href="/parent/children"
            className="block w-full rounded-2xl border border-dash-ink/[0.08] bg-white py-3.5 text-center text-[13px] font-semibold transition hover:-translate-y-px hover:bg-grey-50 dark:bg-transparent"
          >
            {dict.parentDashboard.changeChild}
          </Link>
        </DashCard>

        <DashCard className="flex items-center gap-[30px] rounded-[26px] p-[30px]">
          <StatRing value={rate} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
              {dict.childProfile.attendance}
            </div>
            <div className="my-2 font-display text-[17px] font-semibold tracking-[-0.02em]">
              {rate >= 80 ? dict.attendance.standingGood : dict.attendance.standingWarning}
            </div>
            <div className="flex flex-col gap-2 text-[13px]">
              {[
                [dict.attendance.statusPresent, attendanceCounts.present, "bg-electric-500"],
                [dict.attendance.statusLate, attendanceCounts.late, "bg-dash-ink/25"],
                [dict.attendance.statusAbsent, attendanceCounts.absent, "bg-dash-ink/10"],
              ].map(([label, value, dot]) => (
                <div key={label as string} className="flex items-center gap-2.5">
                  <span className={`h-[7px] w-[7px] rounded-full ${dot}`} />
                  <span className="flex-1 text-dash-muted">{label}</span>
                  <span className="font-semibold tabular-nums">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </DashCard>
      </section>

      <section className="mb-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        {[
          [dict.parentDashboard.learningProgressTitle, `${learningProgress}%`],
          [dict.parentDashboard.statHomework, `${homeworkCompletion}%`],
          [dict.childProfile.points, child.points.toLocaleString("az-AZ")],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-dash-ink/[0.045] bg-white/55 px-6 py-[22px] dark:bg-white/[0.03]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">{label}</div>
            <div className="mt-3 font-display text-[27px] font-semibold tracking-[-0.03em]">{value}</div>
          </div>
        ))}
      </section>

      <DashCard className="mb-5 rounded-[28px] p-9">
        <div className="mb-[34px]">
          <h2 className="font-display text-[23px] font-semibold tracking-[-0.025em]">{dict.parentDashboard.learningProgressTitle}</h2>
          <p className="mt-2 text-[14.5px] text-dash-muted">
            {format(dict.parentDashboard.learningProgressSubtitle, { name: child.firstName })}
          </p>
        </div>
        {subjects.length > 0 ? (
          <ProgressBars subjects={subjects} />
        ) : (
          <p className="text-sm text-dash-muted">{dict.parentDashboard.noProgressYet}</p>
        )}
      </DashCard>

      <DashCard className="mb-5 rounded-[28px] p-9">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-[23px] font-semibold tracking-[-0.025em]">{dict.childProfile.overTimeTitle}</h2>
            {trendData.length > 0 && (
              <p className="mt-2 text-[14.5px] text-dash-muted">
                {trendData[0].label} — {trendData[trendData.length - 1].label}
              </p>
            )}
          </div>
          {trendDelta !== null && (
            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                trendDelta >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              }`}
            >
              {trendDelta >= 0 ? "+" : ""}
              {trendDelta}%
            </span>
          )}
        </div>
        {trendData.length > 0 ? (
          <ProgressChart data={trendData} />
        ) : (
          <p className="text-sm text-dash-muted">{dict.childProfile.noGrades}</p>
        )}
      </DashCard>

      <section className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
        <GlassCard className="flex flex-col rounded-[26px]">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-electric-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
              {dict.parentDashboard.nextLessonLabel}
            </span>
          </div>
          {nextLesson ? (
            <>
              <h3 className="font-display text-[22px] font-semibold leading-[1.28] tracking-[-0.025em]">{nextLesson.title}</h3>
              <div className="my-[18px] flex items-center gap-4 text-sm">
                <span className="font-semibold">
                  {new Date(nextLesson.date).toLocaleDateString("az-AZ", { day: "2-digit", month: "long" })} ·{" "}
                  {new Date(nextLesson.date).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="h-3.5 w-px bg-dash-ink/15" />
                <span className="text-dash-muted">{nextLesson.class.name}</span>
              </div>
              <div className="flex items-center gap-3 border-t border-dash-ink/[0.07] pt-[22px]">
                <Avatar name={nextLesson.class.teacher.user.name} src={nextLesson.class.teacher.user.avatarUrl} size={38} />
                <div>
                  <div className="text-[13.5px] font-semibold">{nextLesson.class.teacher.user.name}</div>
                  <div className="mt-0.5 text-xs text-dash-muted">{nextLesson.class.teacher.position}</div>
                </div>
              </div>
              <Link
                href="/parent/attendance"
                className="mt-7 block w-full rounded-[15px] bg-electric-500 py-[15px] text-center text-[13.5px] font-semibold text-white shadow-[0_12px_26px_-12px_rgba(255,107,0,0.6)] transition hover:-translate-y-px"
              >
                {dict.parentDashboard.goToLesson}
              </Link>
            </>
          ) : (
            <DashEmptyState
              icon={Users}
              title={dict.parentDashboard.noUpcomingLesson}
              description={dict.parentDashboard.noUpcomingLessonDesc}
            />
          )}
        </GlassCard>

        <div className="rounded-[26px] border border-dash-ink/[0.04] bg-grey-100/70 p-9 dark:bg-white/[0.03]">
          <div className="mb-[22px] text-[11px] font-semibold uppercase tracking-[0.09em] text-dash-muted">
            {dict.parentDashboard.teacherNoteLabel}
          </div>
          {teacherNote?.feedback ? (
            <>
              <p className="mb-6 font-display text-[19px] font-normal leading-[1.55] tracking-[-0.015em] [text-wrap:pretty]">
                &ldquo;{teacherNote.feedback}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar
                  name={teacherNote.homework.lesson.class.teacher.user.name}
                  src={teacherNote.homework.lesson.class.teacher.user.avatarUrl}
                  size={36}
                />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{teacherNote.homework.lesson.class.teacher.user.name}</div>
                  <div className="mt-0.5 text-xs text-dash-muted">{teacherNote.homework.lesson.class.teacher.position}</div>
                </div>
                {teacherNote.submittedAt && <span className="text-xs text-dash-muted">{formatDate(teacherNote.submittedAt)}</span>}
              </div>
            </>
          ) : (
            <p className="text-sm text-dash-muted">
              {dict.parentDashboard.noTeacherNote} — {dict.parentDashboard.noTeacherNoteDesc}
            </p>
          )}
        </div>
      </section>

      <section className="mt-5 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(340px,1fr))]">
        <DashCard className="rounded-[26px] p-9">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-[19px] font-semibold tracking-[-0.02em]">
              <BookOpen className="h-[18px] w-[18px] text-electric-500" /> {dict.parentDashboard.homeworkWidgetTitle}
            </h2>
            {activeHomeworkCount > 0 && (
              <span className="shrink-0 text-xs font-semibold text-dash-muted">
                {format(dict.parentDashboard.activeCount, { n: activeHomeworkCount })}
              </span>
            )}
          </div>
          {homeworkPreview.length === 0 ? (
            <p className="text-sm text-dash-muted">{dict.homework.noneTitle}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {homeworkPreview.map((s) => {
                const meta = statusMeta[s.status as keyof typeof statusMeta];
                const done = s.status === "SUBMITTED" || s.status === "GRADED";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 border-b border-dash-ink/[0.06] pb-4 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">{s.homework.title}</p>
                      <p className="mt-0.5 text-xs text-dash-muted">
                        {dict.homework.dueDate} {formatDate(s.homework.dueDate)}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold ${done ? "text-dash-muted" : "text-dash-ink"}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>

        <DashCard className="rounded-[26px] p-9">
          <h2 className="mb-6 flex items-center gap-2 font-display text-[19px] font-semibold tracking-[-0.02em]">
            <Trophy className="h-[18px] w-[18px] text-electric-500" /> {dict.parentDashboard.achievementsTitle}
          </h2>
          {achievements.length === 0 ? (
            <DashEmptyState
              icon={Trophy}
              title={dict.parentDashboard.noAchievementsTitle}
              description={dict.parentDashboard.noAchievementsDesc}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {achievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-lg">
                    {a.badge.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{a.badge.name}</p>
                    <p className="mt-0.5 text-xs text-dash-muted">
                      {format(dict.parentDashboard.unlockedOn, { date: formatDate(a.earnedAt) })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashCard>
      </section>

      <DashCard className="mt-5 rounded-[26px] p-9">
        <h2 className="mb-6 flex items-center gap-2 font-display text-[19px] font-semibold tracking-[-0.02em]">
          <Activity className="h-[18px] w-[18px] text-electric-500" /> {dict.parentDashboard.recentActivityTitle}
        </h2>
        {activityEvents.length === 0 ? (
          <p className="text-sm text-dash-muted">{dict.parentDashboard.noActivityTitle}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {activityEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-6">
                <span className="w-20 shrink-0 pt-px text-xs text-dash-muted">{relativeDayLabel(e.date, dict)}</span>
                <div className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${i === 0 ? "bg-electric-500" : "bg-dash-ink/15"}`} />
                  <span className="min-w-0 flex-1 truncate">{e.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashCard>
    </main>
  );
}
