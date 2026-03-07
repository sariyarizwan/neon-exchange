import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "cyan" | "magenta" | "lime" | "amber" | "slate";
  className?: string;
};

export function Badge({ children, variant = "slate", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        variant === "cyan" && "border-neon-cyan/30 bg-neon-cyan/10 text-cyan-100",
        variant === "magenta" && "border-neon-magenta/30 bg-neon-magenta/10 text-fuchsia-100",
        variant === "lime" && "border-neon-lime/35 bg-neon-lime/10 text-lime-100",
        variant === "amber" && "border-neon-amber/35 bg-neon-amber/10 text-amber-100",
        variant === "slate" && "border-slate-700/70 bg-slate-900/70 text-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}
