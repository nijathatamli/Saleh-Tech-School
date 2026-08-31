import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashEmptyState } from "@/components/dash/empty-state";
import { formatDate } from "@/lib/utils";
import { HomeworkLedger } from "./homework-ledger";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherHomeworkPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classIds = teacher.classes.map((c) => c.id);
  const homeworks = await prisma.homework.findMany({
    where: { lesson: { classId: { in: classIds } } },
    include: {
      lesson: { include: { class: { include: { course: true } } } },
      submissions: true,
    },
    orderBy: { dueDate: "desc" },
  });

  const items = homeworks.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    dueDateFormatted: formatDate(h.dueDate),
    courseName: h.lesson.class.course.name,
    submissionCount: h.submissions.length,
    pendingCount: h.submissions.filter((s) => s.status === "SUBMITTED").length,
    graded: h.submissions.length > 0 && h.submissions.every((s) => s.status === "GRADED"),
  }));

  return (
    <div>
      <DashTopbar
        title="Ev tapşırıqları"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="p-6 md:p-10">
        <div className="mb-4 flex items-center justify-end">
          <Link href="/teacher/homework/new" className="flex items-center gap-1.5 text-xs font-bold text-electric-600 hover:text-electric-700">
            <Plus className="h-3.5 w-3.5" /> Yeni tapşırıq
          </Link>
        </div>

        {items.length === 0 ? <DashEmptyState icon={ClipboardList} title="Hələ tapşırıq yaradılmayıb" /> : <HomeworkLedger items={items} />}
      </div>
    </div>
  );
}
