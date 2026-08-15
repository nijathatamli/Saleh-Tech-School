import { getCurrentTeacher } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { createHomework } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewHomeworkPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <AppTopbar title="Yeni ev tapşırığı" userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="max-w-xl p-6 md:p-10">
        <form action={createHomework} className="space-y-5 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <div>
            <Label htmlFor="lessonId">Dərs</Label>
            <LessonSelect teacherId={teacher.id} />
          </div>
          <div>
            <Label htmlFor="title">Başlıq</Label>
            <Input id="title" name="title" required placeholder="Web Security tapşırığı" />
          </div>
          <div>
            <Label htmlFor="description">Təsvir</Label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 placeholder:text-navy-400/60 focus:border-electric-500"
              placeholder="Tapşırığın təsviri..."
            />
          </div>
          <div>
            <Label htmlFor="dueDate">Son tarix</Label>
            <Input id="dueDate" name="dueDate" type="date" required />
          </div>
          <Button type="submit" variant="app" className="w-full">Tapşırığı yarat</Button>
        </form>
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
    <select
      id="lessonId"
      name="lessonId"
      required
      className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500"
    >
      <option value="">Dərs seçin...</option>
      {lessons.map((l) => (
        <option key={l.id} value={l.id}>
          {l.class.course.name} · {l.title} ({formatDate(l.date)})
        </option>
      ))}
    </select>
  );
}
