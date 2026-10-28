import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("ap-badge inline-flex items-center gap-1 rounded-full font-bold", {
  variants: {
    variant: {
      default: "ap-badge-default bg-grey-100 text-secondary",
      primary: "ap-badge-primary bg-primary/10 text-primary",
      success: "ap-badge-success bg-emerald-100 text-emerald-700",
      warning: "ap-badge-warning bg-amber-100 text-amber-700",
      danger: "ap-badge-danger bg-red-100 text-red-700",
      violet: "ap-badge-violet bg-violet-500/10 text-violet-600",
      "app-electric": "bg-electric-500/10 text-electric-600",
      "app-violet": "bg-amber-500/10 text-amber-600",
      "app-cyan": "bg-teal-500/10 text-teal-600",
      "app-navy": "bg-navy-900/5 text-navy-900",
    },
    size: {
      sm: "text-[10px] px-2.5 py-1 uppercase tracking-widest",
      md: "text-xs px-3 py-1.5",
    },
  },
  defaultVariants: { variant: "default", size: "sm" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}

export { Badge, badgeVariants };
