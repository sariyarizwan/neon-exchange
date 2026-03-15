"use client";

import { useNewsstand } from "@/hooks/useNewsstand";
import { useNeonStore } from "@/store/useNeonStore";
import { cn } from "@/lib/cn";

export function NewsstandOverlay() {
  const districtId = useNeonStore((s) => s.activeNewsstandDistrictId);
  const setActiveNewsstandDistrictId = useNeonStore((s) => s.setActiveNewsstandDistrictId);
  const liveNews = useNewsstand(districtId);

  if (!districtId || liveNews.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 w-[340px]">
      <div className="rounded-2xl border border-white/10 bg-base-950/95 p-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {districtId.replace(/-/g, " ")} Newsstand
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-neon-lime animate-pulse" />
          </div>
          <button
            type="button"
            onClick={() => setActiveNewsstandDistrictId(null)}
            className="text-[10px] text-slate-500 hover:text-white"
          >
            x
          </button>
        </div>

        {/* News cards */}
        <div className="space-y-1.5">
          {liveNews.map((item, i) => {
            const sentiment =
              item.severity === "high"
                ? "magenta"
                : item.tickers.length > 0
                  ? "cyan"
                  : "amber";
            const borderColor = {
              magenta: "border-neon-magenta/25",
              cyan: "border-neon-cyan/25",
              amber: "border-neon-amber/25",
            }[sentiment];
            const accentColor = {
              magenta: "bg-neon-magenta/10",
              cyan: "bg-neon-cyan/10",
              amber: "bg-neon-amber/10",
            }[sentiment];

            return (
              <div
                key={`${item.headline}-${i}`}
                className={cn(
                  "rounded-lg border p-2 transition-all",
                  borderColor,
                  accentColor
                )}
              >
                <div className="text-[11px] leading-snug text-slate-200">
                  {item.headline}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {item.tickers.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-slate-800/60 px-1 py-0.5 text-[8px] font-mono uppercase text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="ml-auto text-[8px] text-slate-600">
                    {item.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
