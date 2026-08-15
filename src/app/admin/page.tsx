import { Users, GraduationCap, BookOpen, CircleDollarSign, CalendarCheck, UserPlus, ClipboardCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminStats, getLeadsByStage } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { AdminBarChart } from "@/components/app/bar-chart";
import { formatAzn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = {
  NEW: "Yeni",
  CONTACTED: "Əlaqə",
  TRIAL_LESSON: "Sınaq",
  TRIAL_COMPLETED: "Bitib",
  INTERESTED: "Maraqlı",
  REGISTERED: "Qeydiyyat",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const stats = await getAdminStats();
  const leads = await getLeadsByStage();

  const chartData = Object.entries(stageLabels).map(([stage, label]) => ({
    label,
    value: leads.filter((l) => l.stage === stage).length,
  }));

  return (
    <div>
      <AppTopbar title="Admin Dashboard" userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Cəmi Tələbə" value={String(stats.totalStudents)} icon={GraduationCap} color="electric" />
          <StatCard label="Müəllimlər" value={String(stats.totalTeachers)} icon={Users} color="violet" />
          <StatCard label="Kurslar" value={String(stats.totalCourses)} icon={BookOpen} color="cyan" />
          <StatCard label="Aylıq Gəlir" value={formatAzn(stats.monthlyRevenue)} icon={CircleDollarSign} color="emerald" />
          <StatCard label="Davamiyyət Faizi" value={`${stats.attendanceRateOverall}%`} icon={CalendarCheck} color="emerald" />
          <StatCard label="Yeni Müraciətlər" value={String(stats.newLeads)} icon={UserPlus} color="amber" />
          <StatCard label="Sınaq Dərsləri" value={String(stats.trialBookings)} icon={ClipboardCheck} color="electric" />
        </div>

        <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <h3 className="mb-6 font-app text-base font-bold text-navy-900">CRM Pipeline üzrə müraciətlər</h3>
          <AdminBarChart data={chartData} />
        </section>
      </div>
    </div>
  );
}
