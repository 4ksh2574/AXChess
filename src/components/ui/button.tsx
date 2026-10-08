import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useAnimate, useReducedMotion } from "framer-motion";

const buttonVariants = cva(
  "glass-control inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const [scope, animate] = useAnimate<HTMLButtonElement>();
    const reduced = useReducedMotion();
    const springTo = (scale: number, y: number) => {
      if (reduced || props.disabled || asChild || !scope.current) return;
      void animate(scope.current, { scale, y }, { type: "spring", stiffness: 400, damping: 25 });
    };
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} {...props}
        ref={(node) => {
          scope.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onPointerEnter={(event) => { props.onPointerEnter?.(event); if (event.pointerType === "mouse") springTo(1.02, -2); }}
        onPointerLeave={(event) => { props.onPointerLeave?.(event); springTo(1, 0); }}
        onPointerDown={(event) => { props.onPointerDown?.(event); springTo(0.96, 0); }}
        onPointerUp={(event) => { props.onPointerUp?.(event); springTo(1, 0); }}
        onPointerCancel={(event) => { props.onPointerCancel?.(event); springTo(1, 0); }}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
