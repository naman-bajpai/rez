"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_18px_44px_-28px_rgba(15,118,110,0.75)] hover:bg-[hsl(var(--primary))]/92",
        destructive:
          "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90",
        outline:
          "border border-white/60 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-xl hover:bg-white/72 hover:text-[hsl(var(--accent-foreground))]",
        secondary:
          "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80",
        ghost:
          "hover:bg-white/54 hover:text-[hsl(var(--accent-foreground))]",
        link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
        /** Uses CSS vars from [data-dashboard-skin] (dashboard layout only). */
        dash:
          "bg-[var(--dash-accent)] text-[var(--dash-accent-fg)] shadow-[0_18px_48px_-28px_oklch(0.35_0.08_200/0.35)] hover:bg-[var(--dash-accent-hover)]",
        dashOutline:
          "border border-[var(--dash-border)] bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-none hover:bg-[var(--dash-surface-elevated)] hover:text-[var(--dash-text)]",
        dashGhost:
          "text-[var(--dash-muted)] hover:bg-[var(--dash-nav-item-hover-bg)] hover:text-[var(--dash-text)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
