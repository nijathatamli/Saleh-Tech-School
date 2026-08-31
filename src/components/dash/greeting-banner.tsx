import { cn } from "@/lib/utils";

export function DashGreetingBanner({
  greeting,
  subtitle,
  className,
  children,
}: {
  greeting: string;
  subtitle: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 border-b border-dash-rule pb-6 dark:border-white/10", className)}>
      <div>
        <h2 className="font-display text-xl text-dash-ink dark:text-white">{greeting}</h2>
        <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/45">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
