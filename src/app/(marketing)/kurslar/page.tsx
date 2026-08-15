import type { Metadata } from "next";
import { getAllCourses } from "@/lib/data";
import { CourseCatalog } from "@/components/marketing/course-catalog";

export const metadata: Metadata = { title: "Kurslar" };
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <div className="px-6 py-20 md:px-20">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">İxtisaslar</span>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">Bütün kurslarımız</h1>
        <p className="text-grey-500 dark:text-zinc-400">
          6-18 yaş arası uşaqlar üçün 10-dan çox texnologiya istiqamətindən birini seçin
        </p>
      </div>
      <div className="mx-auto max-w-7xl">
        <CourseCatalog courses={courses} />
      </div>
    </div>
  );
}
