import { cn } from "@/lib/cn";

type TooltipProps = {
  children: React.ReactNode;
  x: number;
  y: number;
  className?: string;
};

export function Tooltip({ children, x, y, className }: TooltipProps) {
  return (
    <div
      className={cn("pointer-events-none absolute z-30 min-w-[180px] rounded-2xl border border-neon-cyan/30 bg-[#020617] p-3 shadow-neon-cyan backdrop-blur-md", className)}
      style={{ left: x, top: y, transform: "translate(14px, -50%)" }}
    >
      {children}
    </div>
  );
}
