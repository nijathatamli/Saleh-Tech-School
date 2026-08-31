import { cn } from "@/lib/utils";

export function DashCard({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dash-rule bg-white p-6 dark:border-dash-dark-rule dark:bg-dash-dark-surface",
        interactive && "transition-colors hover:border-dash-ink/20 dark:hover:border-white/25",
        className
      )}
      {...props}
    />
  );
}
