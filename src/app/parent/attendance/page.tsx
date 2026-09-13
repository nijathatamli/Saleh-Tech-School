import { CalendarCheck } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ParentPageHeader } from "@/components/dash/parent-page-header";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashCard } from "@/components/dash/card";
import { attendanceRate, formatDate, monthlyAttendanceByClass } from "@/lib/utils";
import { getServerDictionary } from "@/i18n/server";
import { format } from "@/i18n/locales";
import type { Dictionary } from "@/i18n";

export const dynamic = "force-dynamic";

function statusMeta(dict: Dictionary) {
  return {
    PRESENT: { label: dict.attendance.statusPresent, icon: "✓", className: "bg-emerald-500 text-white" },
    ABSENT: { label: dict.attendance.statusAbsent, icon: "✕", className: "bg-red-500 text-white" },
    LATE: { label: dict.attendance.statusLate, icon: "◐", className: "bg-amber-500 text-white" },
    EXCUSED: { label: dict.attendance.statusExcused, icon: "•", className: "bg-dash-ink/40 text-white" },
  } as const;
}

export default async function AttendancePage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { dict } = getServerDictionary();
  const meta = statusMeta(dict);

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div className="mx-auto max-w-[1240px]">
        <ParentPageHeader title={dict.attendance.title} />
        <div className="px-6 pb-20 md:px-11">
          <DashEmptyState icon={CalendarCheck} title={dict.attendance.childNotFound} />
        </div>
      </div>
    );
  }

  const records = await prisma.attendance.findMany({
    where: { studentId: child.id },
    include: { lesson: { include: { class: { include: { course: true } } } } },
    orderBy: { date: "desc" },
  });

  const rate = attendanceRate(records);
  const monthly = monthlyAttendanceByClass(records);

  return (
    <div className="mx-auto max-w-[1240px]">
      <ParentPageHeader title={dict.attendance.title} />

      <div className="space-y-6 px-6 pb-20 md:px-11">
        {parent.children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => (
              <a
                key={c.id}
                href={`/parent/attendance?child=${c.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  c.id === child.id
                    ? "bg-electric-500 text-white"
                    : "border border-dash-rule bg-white text-dash-ink/50 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white/50"
                }`}
              >
                {c.firstName} {c.lastName}
              </a>
            ))}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {monthly.length > 0 ? (
            monthly.map((m) => (
              <DashCard key={m.className} className="rounded-[22px] p-[26px]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-grey-500">
                  {m.className} · {dict.attendance.classesThisMonthLabel}
                </p>
                <p className="mt-3 font-display text-[27px] font-semibold tracking-[-0.03em] text-dash-ink dark:text-white">
                  {format(dict.attendance.classesThisMonth, { x: m.attended, y: m.expected })}
                </p>
              </DashCard>
            ))
          ) : (
            <DashCard className="rounded-[22px] p-[26px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-grey-500">{dict.attendance.thisMonth}</p>
              <p className="mt-3 font-display text-[27px] font-semibold tracking-[-0.03em] text-dash-ink dark:text-white">—</p>
            </DashCard>
          )}
          <DashCard className="rounded-[22px] p-[26px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-grey-500">{dict.attendance.overall}</p>
            <p className="mt-3 font-display text-[27px] font-semibold tracking-[-0.03em] text-dash-ink dark:text-white">{rate}%</p>
          </DashCard>
        </div>

        <DashCard className="flex flex-wrap gap-4 rounded-[22px] p-5 text-xs font-semibold text-grey-500">
          {(Object.keys(meta) as (keyof typeof meta)[]).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${meta[key].className}`}>
                {meta[key].icon}
              </span>
              {meta[key].label}
            </div>
          ))}
        </DashCard>

        <DashCard className="rounded-[22px] p-0">
          <h3 className="border-b border-dash-ink/[0.06] p-6 font-display text-[19px] font-semibold tracking-[-0.02em] dark:border-white/10">
            {dict.attendance.historyTitle}
          </h3>
          {records.length === 0 ? (
            <div className="p-6">
              <DashEmptyState icon={CalendarCheck} title={dict.attendance.noRecords} />
            </div>
          ) : (
            <div className="divide-y divide-dash-ink/[0.06] dark:divide-white/10">
              {records.map((r) => {
                const m = meta[r.status as keyof typeof meta];
                return (
                  <div key={r.id} className="flex items-center gap-4 p-6">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${m.className}`}>
                      {m.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold">{r.lesson.class.course.name}</p>
                      <p className="mt-0.5 text-xs text-grey-500">{formatDate(r.date)}</p>
                      {r.note && <p className="mt-1 text-xs italic text-grey-500">&quot;{r.note}&quot;</p>}
                    </div>
                    <span className="text-xs font-semibold text-grey-500">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DashCard>
      </div>
    </div>
  );
}
