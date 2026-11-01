import { createElement, useRef, type HTMLAttributes, type FormEventHandler } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlassCardProps = Omit<HTMLAttributes<HTMLElement>, "onSubmit"> & {
  as?: "div" | "section" | "form" | "nav" | "span";
  interactive?: boolean;
  depth?: "panel" | "floating" | "inset";
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

/** Shared refraction material; semantic elements preserve forms and navigation. */
export function GlassCard({ children, className, as = "div", interactive = false, depth = "panel", ...props }: GlassCardProps) {
  const reduced = useReducedMotion();
  const element = useRef<HTMLDivElement>(null);
  const springTo = (scale: number, y: number) => {
    if (!reduced && element.current) void animate(element.current, { scale, y }, { type: "spring", stiffness: 400, damping: 25 });
  };
  const classes = cn("glass-surface", `glass-${depth}`, className);
  const content = <><span aria-hidden="true" className="glass-edge" />{children}</>;
  if (interactive && as === "div") {
    const { onClick, onKeyDown, role, tabIndex, onSubmit: _onSubmit, ...rest } = props;
    return <div
      {...rest}
      ref={element}
      className={cn(classes, onClick && "cursor-pointer")}
      role={role ?? (onClick ? "button" : undefined)}
      tabIndex={tabIndex ?? (onClick ? 0 : undefined)}
      onClick={onClick}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (onClick && !event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      onPointerEnter={(event) => { props.onPointerEnter?.(event); if (event.pointerType === "mouse") springTo(1.02, -2); }}
      onPointerLeave={(event) => { props.onPointerLeave?.(event); springTo(1, 0); }}
      onPointerDown={(event) => { props.onPointerDown?.(event); springTo(0.96, 0); }}
      onPointerUp={(event) => { props.onPointerUp?.(event); springTo(1, 0); }}
      onPointerCancel={(event) => { props.onPointerCancel?.(event); springTo(1, 0); }}
    >{content}</div>;
  }
  return createElement(as, { ...props, className: classes }, content);
}