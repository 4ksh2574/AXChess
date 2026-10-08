import { createElement, type HTMLAttributes, type FormEventHandler } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  const classes = cn("glass-surface", `glass-${depth}`, className);
  const content = <><span aria-hidden="true" className="glass-edge" />{children}</>;
  if (interactive && as === "div") {
    const { onClick, onKeyDown, role, tabIndex, ...rest } = props;
    return <motion.div
      {...rest}
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
      whileHover={reduced ? undefined : { scale: 1.02, y: -2 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >{content}</motion.div>;
  }
  return createElement(as, { ...props, className: classes }, content);
}