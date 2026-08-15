"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const colorMap: Record<string, string> = {
  electric: "bg-electric-500",
  violet: "bg-amber-500",
  cyan: "bg-teal-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  primary: "bg-primary",
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { value?: number; color?: keyof typeof colorMap }
>(({ className, value, color = "electric", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-navy-50", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full flex-1 rounded-full transition-all duration-700 ease-out", colorMap[color])}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
