import { CalendarCheck } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { attendanceRate, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusMeta: Record<string, { label: string; icon: string; className: string }> = {
  PRESENT: { label: "İştirak edib", icon: "✓", className: "bg-emerald-500 text-white" },
  ABSENT: { label: "Qayıb", icon: "✕", className: "bg-red-500 text-white" },
  LATE: { label: "Gecikib", icon: "◐", className: "bg-amber-500 text-white" },
  EXCUSED: { label: "İcazəli", icon: "•", className: "bg-navy-400 text-white" },
};

export default async function AttendancePage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div>
        <AppTopbar title="Davamiyyət" userName={parent.user.name} userEmail={parent.user.email} />
        <div className="p-6 md:p-10">
          <EmptyState icon={CalendarCheck} title="Uşaq tapılmadı" />
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
  const thisMonth = records.filter((r) => new Date(r.date).getMonth() === new Date().getMonth());
  const monthRate = attendanceRate(thisMonth);

  return (
    <div>
      <AppTopbar title="Davamiyyət" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        {parent.children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => (
              <a
                key={c.id}
                href={`/parent/attendance?child=${c.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  c.id === child.id ? "bg-electric-500 text-white" : "bg-white text-navy-400 border border-navy-100"
                }`}
              >
                {c.firstName} {c.lastName}
              </a>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
            <p className="text-xs font-bold uppercase tracking-widest text-navy-400">Bu ay davamiyyət</p>
            <p className="mt-2 font-display text-3xl text-navy-900">{monthRate}%</p>
          </div>
          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
            <p className="text-xs font-bold uppercase tracking-widest text-navy-400">Ümumi davamiyyət</p>
            <p className="mt-2 font-display text-3xl text-navy-900">{rate}%</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 rounded-2xl border border-navy-100 bg-white p-4 text-xs font-semibold text-navy-400 shadow-sm shadow-navy-900/[0.03]">
          {Object.entries(statusMeta).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${meta.className}`}>
                {meta.icon}
              </span>
              {meta.label}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <h3 className="border-b border-navy-100 p-6 font-display text-base text-navy-900">Davamiyyət tarixçəsi</h3>
          {records.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CalendarCheck} title="Hələ davamiyyət qeydi yoxdur" />
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {records.map((r) => {
                const meta = statusMeta[r.status];
                return (
                  <div key={r.id} className="flex items-center gap-4 p-5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${meta.className}`}>
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{r.lesson.class.course.name}</p>
                      <p className="text-xs text-navy-400">{formatDate(r.date)}</p>
                      {r.note && <p className="mt-1 text-xs italic text-navy-400">"{r.note}"</p>}
                    </div>
                    <span className="text-xs font-bold text-navy-400">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
