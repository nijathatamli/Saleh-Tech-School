import Link from "next/link";
import { getFeaturedCourses } from "@/lib/data";
import { CourseCard } from "./course-card";
import { Button } from "@/components/ui/button";

export async function CoursesSection() {
  const courses = await getFeaturedCourses();

  return (
    <section id="courses" className="bg-grey-50 px-6 py-32 dark:bg-zinc-900 md:px-20">
      <div className="mx-auto mb-16 flex max-w-7xl flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-xl space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Ən çox seçilənlər</span>
          <h2 className="font-display text-3xl leading-tight md:text-5xl">Populyar kurslarımız</h2>
        </div>
        <Button asChild variant="outline" className="dark:border-zinc-700 dark:text-white">
          <Link href="/kurslar">Hamısına bax</Link>
        </Button>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
