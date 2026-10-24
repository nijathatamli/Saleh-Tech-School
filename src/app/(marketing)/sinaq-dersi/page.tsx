import type { Metadata } from "next";
import { getAllCourses } from "@/lib/data";
import { TrialWizard } from "@/components/marketing/trial-wizard";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("registration");
export const dynamic = "force-dynamic";

export default async function TrialLessonPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const courses = await getAllCourses();

  return (
    <div className="px-6 md:px-20">
      <h1 className="sr-only">Ödənişsiz konsultasiya və demo dərsə yazılın</h1>
      <TrialWizard courses={courses} defaultCourseSlug={searchParams.course} />
    </div>
  );
}
