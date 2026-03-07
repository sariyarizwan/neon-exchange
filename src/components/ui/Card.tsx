import { cn } from "@/lib/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <div className={cn("glass-panel neon-border rounded-3xl p-4", className)}>{children}</div>;
}
