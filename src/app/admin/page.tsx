import Link from "next/link";
import { Users, GraduationCap, BookOpen, CircleDollarSign, CalendarCheck, UserPlus, ClipboardCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminStats, getLeadsByStage } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { GreetingBanner } from "@/components/app/greeting-banner";
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
      <AppTopbar
        title="Admin Dashboard"
        subtitle="Biznesin ümumi görünüşü"
        userName={session?.user?.name ?? "Admin"}
        userEmail={session?.user?.email ?? ""}
      />

      <div className="space-y-8 p-6 md:p-10">
        <GreetingBanner
          name={(session?.user?.name ?? "Admin").split(" ")[0]}
          subtitle="Məktəbin bugünkü göstəriciləri budur."
        />

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-navy-400">Əsas göstəricilər</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cəmi Tələbə" value={String(stats.totalStudents)} icon={GraduationCap} color="electric" />
            <StatCard label="Müəllimlər" value={String(stats.totalTeachers)} icon={Users} color="violet" />
            <StatCard label="Kurslar" value={String(stats.totalCourses)} icon={BookOpen} color="cyan" />
            <StatCard label="Aylıq Gəlir" value={formatAzn(stats.monthlyRevenue)} icon={CircleDollarSign} color="emerald" />
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-navy-400">CRM və davamiyyət</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Davamiyyət Faizi" value={`${stats.attendanceRateOverall}%`} icon={CalendarCheck} color="emerald" />
            <StatCard label="Yeni Müraciətlər" value={String(stats.newLeads)} icon={UserPlus} color="amber" />
            <StatCard label="Sınaq Dərsləri" value={String(stats.trialBookings)} icon={ClipboardCheck} color="electric" />
          </div>
        </div>

        <section className="rounded-3xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-display text-base text-navy-900">CRM Pipeline üzrə müraciətlər</h3>
            <Link href="/admin/leads" className="text-xs font-bold text-electric-600 hover:underline">
              Bütün leadlərə bax
            </Link>
          </div>
          <AdminBarChart data={chartData} />
        </section>
      </div>
    </div>
  );
}
