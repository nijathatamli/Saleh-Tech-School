import { Users } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { ParentPageHeader } from "@/components/dash/parent-page-header";
import { ChildCard } from "@/components/app/child-card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { getServerDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { dict } = getServerDictionary();

  return (
    <div className="mx-auto max-w-[1240px]">
      <ParentPageHeader title={dict.children.title} />
      <div className="px-6 pb-20 md:px-11">
        {parent.children.length === 0 ? (
          <DashEmptyState icon={Users} title={dict.children.noChildren} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parent.children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
