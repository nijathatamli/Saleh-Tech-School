import { cn } from "@/lib/utils";

/** Frosted surface used for the "next lesson" / summary panels. */
export function GlassCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-dash-ink/[0.055] bg-white/60 p-8 backdrop-blur-xl backdrop-saturate-150",
        "shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_22px_48px_-32px_rgba(36,31,26,0.3)]",
        "dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
      {...props}
    />
  );
}
