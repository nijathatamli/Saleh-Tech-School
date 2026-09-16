import { notFound, redirect } from "next/navigation";
import { ParentDashboard } from "@/features/parent-dashboard/ParentDashboard";
import { loadParentPortal } from "@/features/parent-dashboard/data";
import type { Route } from "@/features/parent-dashboard/logic";

export const dynamic = "force-dynamic";

// One page serves every portal screen: the file's UI switches screens on the
// client, and the URL (/parent, /parent/attendance, …) says which one to show.
const SCREENS: Record<string, Route> = {
  "": "/parent",
  children: "/parent/children",
  attendance: "/parent/attendance",
  homework: "/parent/homework",
  notifications: "/parent/notifications",
  settings: "/parent/settings",
};

export default async function ParentPortalPage({
  params,
  searchParams,
}: {
  params: { slug?: string[] };
  searchParams: { child?: string };
}) {
  const slug = params.slug ?? [];
  if (slug.length > 1) notFound();
  const route = SCREENS[slug[0] ?? ""];
  if (!route) notFound();

  const data = await loadParentPortal();
  if (!data) redirect("/giris");

  const childIndex = Math.max(
    0,
    data.children.findIndex((c) => c.id === searchParams.child)
  );

  return <ParentDashboard data={data} initialRoute={route} initialChildIndex={childIndex} />;
}
