import { getCurrentTeacher } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { createHomework } from "../actions";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

const fieldClass =
  "w-full rounded-xl border border-dash-rule bg-white px-4 py-3 text-sm text-dash-ink placeholder:text-dash-ink/40 transition-colors focus:border-electric-500 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white dark:placeholder:text-white/30";

export default async function NewHomeworkPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <DashTopbar
        title="Yeni ev tapşırığı"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="max-w-xl p-6 md:p-10">
        <DashCard>
          <form action={createHomework} className="space-y-5">
            <div>
              <Label htmlFor="lessonId">Dərs</Label>
              <LessonSelect teacherId={teacher.id} />
            </div>
            <div>
              <Label htmlFor="title">Başlıq</Label>
              <input id="title" name="title" required placeholder="Web Security tapşırığı" className={fieldClass} />
            </div>
            <div>
              <Label htmlFor="description">Təsvir</Label>
              <textarea id="description" name="description" required rows={4} className={fieldClass} placeholder="Tapşırığın təsviri..." />
            </div>
            <div>
              <Label htmlFor="dueDate">Son tarix</Label>
              <input id="dueDate" name="dueDate" type="date" required className={fieldClass} />
            </div>
            <Button type="submit" variant="app" className="w-full">Tapşırığı yarat</Button>
          </form>
        </DashCard>
      </div>
    </div>
  );
}

async function LessonSelect({ teacherId }: { teacherId: string }) {
  const { prisma } = await import("@/lib/prisma");
  const lessons = await prisma.lesson.findMany({
    where: { class: { teacherId } },
    include: { class: { include: { course: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <select id="lessonId" name="lessonId" required className={fieldClass}>
      <option value="">Dərs seçin...</option>
      {lessons.map((l) => (
        <option key={l.id} value={l.id}>
          {l.class.course.name} · {l.title} ({formatDate(l.date)})
        </option>
      ))}
    </select>
  );
}
