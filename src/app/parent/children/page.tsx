import { Users } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { ChildCard } from "@/components/app/child-card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  return (
    <div>
      <AppTopbar title="Uşaqlarım" userName={parent.user.name} userEmail={parent.user.email} />
      <div className="p-6 md:p-10">
        {parent.children.length === 0 ? (
          <EmptyState icon={Users} title="Hələ heç bir uşaq əlavə edilməyib" />
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
