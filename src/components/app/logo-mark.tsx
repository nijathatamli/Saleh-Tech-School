import Image from "next/image";
import { cn } from "@/lib/utils";

const RATIO = 282 / 255;

/** The striped "S" brand mark. `size` is the rendered height in px. */
export function LogoMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-s.png"
      alt=""
      aria-hidden
      width={Math.round(size * RATIO)}
      height={size}
      className={cn("shrink-0 select-none", className)}
    />
  );
}
