import { notFound } from "next/navigation";
import { getTeacherById } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/marketing/course-card";
import { TeacherPhoto } from "@/components/marketing/teacher-photo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const teacher = await getTeacherById(params.id);
  return { title: teacher?.user.name ?? "Müəllim tapılmadı" };
}

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  const teacher = await getTeacherById(params.id);
  if (!teacher) notFound();

  return (
    <div className="px-6 py-20 md:px-20">
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-3">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <TeacherPhoto src={teacher.photoUrl} name={teacher.user.name} fill />
          </div>
        </div>
        <div className="md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{teacher.position}</p>
          <h1 className="mt-2 font-display text-3xl">{teacher.user.name}</h1>
          <p className="mt-2 text-sm text-grey-500 dark:text-zinc-400">{teacher.experienceYears} illik təcrübə</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {teacher.specializations.map((s) => (
              <Badge key={s} variant="primary">
                {s}
              </Badge>
            ))}
          </div>

          <p className="mt-8 max-w-2xl leading-relaxed text-grey-500 dark:text-zinc-400">{teacher.bio}</p>

          {teacher.courses.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-6 font-display text-xl">Tədris etdiyi kurslar</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {teacher.courses.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
