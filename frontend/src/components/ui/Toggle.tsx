import { cn } from "@/lib/cn";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
};

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-left transition hover:border-neon-cyan/30 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70"
    >
      <span className="space-y-1">
        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-100">{label}</span>
        {hint ? <span className="block text-[11px] text-slate-400">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition",
          checked ? "border-neon-cyan/40 bg-neon-cyan/18" : "border-slate-700 bg-slate-900"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-slate-100 transition",
            checked ? "left-[22px] shadow-[0_0_14px_rgba(51,245,255,0.55)]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}
