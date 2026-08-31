import { LucideIcon } from "lucide-react";

export function DashEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-dash-rule bg-dash-paper-2/50 px-6 py-14 text-center dark:border-dash-dark-rule dark:bg-white/[0.02]">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-dash-ink/40 dark:bg-dash-dark-surface dark:text-white/40">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 font-display text-sm text-dash-ink dark:text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-dash-ink/50 dark:text-white/45">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
