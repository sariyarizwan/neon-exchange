import { cn } from "@/lib/cn";

type TabItem<T extends string> = {
  value: T;
  label: string;
};

type TabsProps<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  return (
    <div className={cn("flex rounded-full border border-slate-800 bg-slate-950/70 p-1", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70",
              active ? "bg-neon-cyan/14 text-cyan-100 shadow-neon-cyan" : "text-slate-400 hover:text-slate-200"
            )}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
