import Link from "next/link";
import { ArrowUpRight, BookOpen, ClipboardList } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashLedgerCard, DashLedgerRow, DashSectionLabel, DashStatusPill, DashAttendanceStatusCard } from "@/components/dash/ledger";
import { formatDate, attendanceRate, monthlyAttendanceByClass } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import { format } from "@/i18n/locales";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const { locale, dict } = getServerDictionary();

  const monthly = monthlyAttendanceByClass(student.attendance)[0];
  const rate = attendanceRate(student.attendance);
  const absentCount = student.attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = student.attendance.filter((a) => a.status === "LATE").length;
  const excusedCount = student.attendance.filter((a) => a.status === "EXCUSED").length;

  const homeworks = await prisma.submission.findMany({
    where: { studentId: student.id, status: { in: ["PENDING", "SUBMITTED"] } },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "asc" } },
    take: 5,
  });

  return (
    <div>
      <DashTopbar
        title={dict.studentDashboard.pageTitle}
        subtitle={dict.studentDashboard.pageSubtitle}
        userName={student.user?.name ?? student.firstName}
        userEmail={student.user?.email ?? ""}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/student/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <div>
          <DashSectionLabel className="mb-4">{dict.studentDashboard.myCoursesTitle}</DashSectionLabel>
          {student.enrollments.length === 0 ? (
            <DashEmptyState icon={BookOpen} title={dict.studentDashboard.noCoursesTitle} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {student.enrollments.map((e) => (
                <DashCard key={e.id}>
                  <p className="font-bold text-dash-ink dark:text-white">{e.course.name}</p>
                  <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">
                    {e.course.durationMonths} {dict.studentDashboard.monthUnit} · {e.course.lessonsPerWeek} {dict.studentDashboard.lessonsPerWeekUnit}
                  </p>
                </DashCard>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <DashSectionLabel>{dict.studentDashboard.homeworkTitle}</DashSectionLabel>
            <Link href="/student/homework" className="flex items-center gap-1 text-xs font-bold text-electric-600">
              {dict.common.viewAll} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {homeworks.length === 0 ? (
            <DashEmptyState icon={BookOpen} title={dict.studentDashboard.noHomeworkTitle} description={dict.studentDashboard.noHomeworkDesc} />
          ) : (
            <DashLedgerCard>
              {homeworks.map((s) => (
                <Link key={s.id} href="/student/homework">
                  <DashLedgerRow
                    icon={BookOpen}
                    title={s.homework.title}
                    meta={`${s.homework.lesson.class.course.name} · ${dict.studentDashboard.dueLabel}: ${formatDate(s.homework.dueDate)}`}
                    chevron
                    trailing={
                      <DashStatusPill tone={s.status === "SUBMITTED" ? "done" : "pending"}>
                        {s.status === "SUBMITTED" ? dict.studentHomework.statusSubmitted : dict.studentHomework.statusPending}
                      </DashStatusPill>
                    }
                  />
                </Link>
              ))}
            </DashLedgerCard>
          )}
        </div>

        <div>
          <DashSectionLabel className="mb-4">{dict.attendance.classesThisMonthLabel}</DashSectionLabel>
          <DashAttendanceStatusCard
            rate={rate}
            attended={monthly?.attended ?? 0}
            total={monthly?.expected ?? 0}
            breakdown={format(dict.attendance.breakdown, { absent: absentCount, late: lateCount, excused: excusedCount })}
            warning={absentCount >= 3}
            standingLabel={dict.attendance.standingGood}
            warningLabel={dict.attendance.standingWarning}
          />
        </div>

        <div>
          <DashSectionLabel className="mb-4">{dict.studentDashboard.gradesTitle}</DashSectionLabel>
          {student.grades.length === 0 ? (
            <DashEmptyState icon={ClipboardList} title={dict.studentDashboard.noGradesTitle} />
          ) : (
            <DashLedgerCard>
              {student.grades.map((g) => (
                <DashLedgerRow
                  key={g.id}
                  icon={ClipboardList}
                  title={g.subject}
                  trailing={<span className="text-sm font-bold text-dash-ink dark:text-white">{g.score}/{g.maxScore}</span>}
                />
              ))}
            </DashLedgerCard>
          )}
        </div>
      </div>
    </div>
  );
}
