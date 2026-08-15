import type { Metadata } from "next";
import { getAllCourses } from "@/lib/data";
import { TrialWizard } from "@/components/marketing/trial-wizard";

export const metadata: Metadata = { title: "Sınaq dərsinə yazıl" };
export const dynamic = "force-dynamic";

export default async function TrialLessonPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const courses = await getAllCourses();

  return (
    <div className="px-6 md:px-20">
      <TrialWizard courses={courses} defaultCourseSlug={searchParams.course} />
    </div>
  );
}
