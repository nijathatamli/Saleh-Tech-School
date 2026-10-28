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
    <div className="relative isolate overflow-hidden px-6 md:px-20">
      {/* coloured shapes for the frosted panel to blur */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 -z-10 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/3 -z-10 h-[26rem] w-[26rem] rounded-full bg-blue-400/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
      <h1 className="sr-only">Ödənişsiz konsultasiya və demo dərsə yazılın</h1>
      <TrialWizard courses={courses} defaultCourseSlug={searchParams.course} />
    </div>
  );
}
