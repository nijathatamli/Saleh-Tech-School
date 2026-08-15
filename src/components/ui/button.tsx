import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold uppercase tracking-widest text-xs transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20",
        secondary: "bg-secondary text-white hover:bg-black",
        outline: "border border-grey-200 text-secondary hover:bg-secondary hover:text-white",
        ghost: "text-secondary hover:bg-grey-100",
        app: "bg-electric-500 text-white hover:bg-electric-600 shadow-lg shadow-electric-500/20",
        "app-outline": "border border-navy-100 text-navy-900 hover:bg-navy-50",
        "app-ghost": "text-navy-400 hover:bg-navy-50",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "px-4 py-2",
        md: "px-6 py-3",
        lg: "px-10 py-5",
        icon: "h-10 w-10 rounded-full p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
