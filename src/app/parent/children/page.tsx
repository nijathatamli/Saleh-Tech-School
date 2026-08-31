import { Users } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { ChildCard } from "@/components/app/child-card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { locale, dict } = getServerDictionary();

  return (
    <div>
      <DashTopbar
        title={dict.children.title}
        userName={parent.user.name}
        userEmail={parent.user.email}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />
      <div className="p-6 md:p-10">
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
