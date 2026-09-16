import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/app/logo-mark";

/**
 * Full brand lockup: the S mark beside a two-line wordmark, "Tech" over
 * "School". `size` is the wordmark font size in px; the mark is scaled to
 * match the height of the two lines.
 */
export function Logo({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display tracking-tight", className)}>
      <LogoMark size={Math.round(size * 1.9)} />
      <span className="flex flex-col leading-[0.95]" style={{ fontSize: size }}>
        <span>Tech</span>
        <span>School</span>
      </span>
    </span>
  );
}
