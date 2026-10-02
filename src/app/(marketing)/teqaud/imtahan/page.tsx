import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExamRunner } from "@/components/scholarship/exam-runner";
import { SCHOLARSHIP_BASE } from "@/lib/scholarship/config";
import { categoryLabelFor } from "@/lib/scholarship/i18n";
import { getSessionStudent } from "@/lib/scholarship/session";

export const metadata: Metadata = { title: "İmtahan", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ScholarshipExamPage() {
  // Only reachable right after registering with a course code (the session cookie it sets).
  const student = await getSessionStudent();
  if (!student) redirect(`${SCHOLARSHIP_BASE}/qeydiyyat`);
  return (
    <section className="px-4 py-10 sm:px-6 md:px-20">
      <ExamRunner studentName={`${student.name} ${student.surname}`} categoryLabel={categoryLabelFor(student.categoryKey, student.categoryLabel, student.language)} lang={student.language} />
    </section>
  );
}
