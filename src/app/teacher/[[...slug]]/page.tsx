import { notFound, redirect } from "next/navigation";
import { TeacherDashboard } from "@/features/teacher-dashboard/TeacherDashboard";
import { loadTeacherDashboard } from "@/features/teacher-dashboard/data";
import { parseTeacherPath } from "@/features/teacher-dashboard/routes";

export const dynamic = "force-dynamic";

// One page serves every dashboard screen: the five sections and the five
// drill-downs (/teacher/classes/[id], /teacher/classes/[id]/attendance,
// /teacher/students/[id], /teacher/homework/[id]/grade, /teacher/homework/new).
export default async function TeacherDashboardPage({
  params,
  searchParams,
}: {
  params: { slug?: string[] };
  searchParams: { lesson?: string };
}) {
  const screen = parseTeacherPath(params.slug ?? [], searchParams.lesson);
  if (!screen) notFound();

  const data = await loadTeacherDashboard();
  if (!data) redirect("/giris");

  // Drill-downs must point at something the teacher owns.
  const d = screen.detail;
  if (d?.kind === "class" || d?.kind === "attendance") {
    if (!data.classes.some((c) => c.id === d.key)) notFound();
  } else if (d?.kind === "student") {
    if (!data.students.some((s) => s.id === d.key)) notFound();
  } else if (d?.kind === "grading") {
    if (!data.homeworks.some((h) => h.id === d.key)) notFound();
  }

  return <TeacherDashboard data={data} initialScreen={screen} />;
}
