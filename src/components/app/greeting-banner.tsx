import { cn } from "@/lib/utils";

export function GreetingBanner({
  name,
  subtitle,
  className,
  children,
}: {
  name: string;
  subtitle: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 rotate-12 text-[9rem] leading-none opacity-10">🦊</div>
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-electric-500/10 blur-3xl" />
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="font-display text-2xl text-white md:text-3xl">Salam, {name} 👋</h2>
          <p className="mt-1.5 text-sm text-navy-100/60">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
