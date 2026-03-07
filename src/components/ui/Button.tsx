import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "neon-hover inline-flex items-center justify-center gap-2 rounded-full border font-medium tracking-[0.08em] text-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-base-950 disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-xs",
        variant === "primary" &&
          "border-neon-cyan/40 bg-neon-cyan/12 shadow-neon-cyan hover:bg-neon-cyan/16",
        variant === "ghost" && "border-slate-700/70 bg-slate-900/60 hover:border-neon-cyan/40 hover:bg-slate-900/90",
        variant === "danger" && "border-neon-magenta/40 bg-neon-magenta/10 shadow-neon-magenta hover:bg-neon-magenta/18",
        className
      )}
      {...props}
    />
  )
);

Button.displayName = "Button";
