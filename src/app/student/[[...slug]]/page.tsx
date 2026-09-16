import { notFound, redirect } from "next/navigation";
import { StudentDashboard } from "@/features/student-dashboard/StudentDashboard";
import { loadStudentDashboard } from "@/features/student-dashboard/data";
import type { Route } from "@/features/student-dashboard/logic";

export const dynamic = "force-dynamic";

// One page serves every dashboard screen: the file's UI switches screens on
// the client, and the URL (/student, /student/homework, …) says which one.
const SCREENS: Record<string, Route> = {
  "": "/student",
  progress: "/student/progress",
  attendance: "/student/attendance",
  homework: "/student/homework",
  portfolio: "/student/portfolio",
  leaderboard: "/student/leaderboard",
  settings: "/student/settings",
};

export default async function StudentDashboardPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug ?? [];
  if (slug.length > 1) notFound();
  const route = SCREENS[slug[0] ?? ""];
  if (!route) notFound();

  const data = await loadStudentDashboard();
  if (!data) redirect("/giris");

  return <StudentDashboard data={data} initialRoute={route} />;
}
