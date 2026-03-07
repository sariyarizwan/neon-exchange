"use client";

import { CityCanvas } from "@/components/city/CityCanvas";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { useNeonStore } from "@/store/useNeonStore";

export function CenterStage() {
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const focusMode = useNeonStore((state) => state.focusMode);
  const toggleFocusMode = useNeonStore((state) => state.toggleFocusMode);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);

  const district = districts.find((entry) => entry.id === selectedDistrictId) ?? null;
  const ticker = tickers.find((entry) => entry.id === selectedTickerId) ?? null;

  return (
    <section className="glass-panel panel-frame relative min-h-0 overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 border-b border-white/5 bg-gradient-to-b from-slate-950/90 to-slate-950/52 px-5 py-4 backdrop-blur-sm transition-opacity duration-300",
          overlaysDimmed && "opacity-15"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="pointer-events-none">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Center Stage</div>
            <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
              Pixel Market City
              <Badge variant="cyan">Playable World</Badge>
            </div>
            {!focusMode ? (
              <div className="text-xs text-slate-400">Top-down neon streets with avatar movement, stock NPCs, newsstands, and little blocks.</div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFocusMode}
              className={cn(
                "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70",
                focusMode
                  ? "border-neon-cyan/45 bg-neon-cyan/14 text-cyan-100 shadow-neon-cyan"
                  : "border-slate-700 bg-slate-950/78 text-slate-200 hover:border-slate-600"
              )}
            >
              <span aria-hidden="true">{focusMode ? "◉" : "◎"}</span>
              Focus Mode
            </button>
          </div>
          <div className={cn("pointer-events-none hidden items-center gap-2 xl:flex", focusMode && "hidden")}>
            {district ? <Badge variant="magenta">{district.name}</Badge> : null}
            {ticker ? <Badge variant="lime">{ticker.symbol}</Badge> : null}
            <Badge variant="slate">Smooth 2D Canvas</Badge>
          </div>
        </div>
        {focusMode ? (
          <div className="mt-3 flex items-center gap-2">
            {district ? <Badge variant="magenta">{district.name}</Badge> : null}
            {ticker ? <Badge variant="lime">{ticker.symbol}</Badge> : null}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {districts.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => focusDistrict(entry.id)}
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition ${
                  selectedDistrictId === entry.id
                    ? "border-neon-cyan/40 bg-neon-cyan/12 text-cyan-100 shadow-neon-cyan"
                    : "border-slate-800 bg-slate-950/75 text-slate-300 hover:border-slate-700"
                }`}
                aria-label={`Focus ${entry.name}`}
                tabIndex={0}
                style={{ pointerEvents: "auto" }}
              >
                {entry.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cn("relative h-full", focusMode ? "pt-[98px]" : "pt-[138px]")}>
        <CityCanvas />
      </div>
    </section>
  );
}
