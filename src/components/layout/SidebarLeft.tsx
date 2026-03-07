"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toggle } from "@/components/ui/Toggle";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

const trafficDots: Record<string, number> = {
  Low: 1,
  Med: 2,
  High: 3
};

export function SidebarLeft() {
  const [query, setQuery] = useState("");
  const [replayMode, setReplayMode] = useState(false);
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const setSelectedTickerId = useNeonStore((state) => state.setSelectedTickerId);
  const showAlliances = useNeonStore((state) => state.showAlliances);
  const showStorms = useNeonStore((state) => state.showStorms);
  const showRumors = useNeonStore((state) => state.showRumors);
  const setFilterToggle = useNeonStore((state) => state.setFilterToggle);

  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    return tickers
      .filter(
        (ticker) =>
          ticker.symbol.toLowerCase().includes(trimmed) ||
          ticker.fullName.toLowerCase().includes(trimmed) ||
          ticker.archetype.toLowerCase().includes(trimmed)
      )
      .slice(0, 6);
  }, [query]);

  return (
    <aside className="glass-panel panel-frame flex h-full min-h-0 max-h-full flex-col overflow-hidden">
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.9))] px-5 py-5 backdrop-blur-sm">
        <div className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan">NEON EXCHANGE</div>
        <h1 className="mt-2 text-3xl font-semibold leading-none text-white neon-text">Dark Cyberpunk Market City</h1>
        <p className="mt-3 max-w-[18rem] text-sm text-slate-400">
          District scanner, rumor filters, and camera launchpad for the sprawling market grid.
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4">
        <section className="space-y-3">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl bg-slate-950/92 px-2 py-2 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Districts</div>
            <Badge variant="slate">8 Zones</Badge>
          </div>

          <div className="space-y-2">
            {districts.map((district) => {
              const selected = district.id === selectedDistrictId;
              return (
                <button
                  key={district.id}
                  type="button"
                  onClick={() => focusDistrict(district.id)}
                  className={cn(
                    "w-full rounded-3xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70",
                    selected
                      ? "border-neon-cyan/40 bg-neon-cyan/10 shadow-neon-cyan"
                      : "border-slate-800 bg-slate-950/55 hover:border-slate-700 hover:bg-slate-900/80"
                  )}
                  aria-label={`Focus ${district.name}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{district.name}</div>
                      <div className="mt-1 text-[11px] text-slate-400">{district.summary}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={district.regime === "storm" ? "magenta" : district.regime === "choppy" ? "amber" : "lime"}
                      >
                        {district.regime}
                      </Badge>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                        {Array.from({ length: 3 }, (_, index) => (
                          <span
                            key={`${district.id}-${index}`}
                            className={cn(
                              "h-1.5 w-4 rounded-full border",
                              index < trafficDots[district.traffic]
                                ? "border-neon-cyan/40 bg-neon-cyan/40"
                                : "border-slate-800 bg-slate-900"
                            )}
                          />
                        ))}
                        {district.traffic}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="sticky top-0 z-10 rounded-2xl bg-slate-950/92 px-2 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 backdrop-blur-sm">
            Ticker Search
          </div>
          <SearchInput
            id="ticker-search-input"
            aria-label="Find a ticker"
            placeholder="Find a ticker..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/60 p-2">
              {searchResults.length > 0 ? (
                searchResults.map((ticker) => (
                  <button
                    key={ticker.id}
                    type="button"
                    onClick={() => {
                      setSelectedTickerId(ticker.id);
                      focusDistrict(ticker.districtId);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition hover:bg-slate-900/90",
                      ticker.id === selectedTickerId && "bg-neon-cyan/10"
                    )}
                  >
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-white">{ticker.symbol}</span>
                      <span className="block text-[11px] text-slate-400">{ticker.fullName}</span>
                    </span>
                    <Badge variant="slate">{ticker.mood}</Badge>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-500">No signals found.</div>
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <div className="sticky top-0 z-10 rounded-2xl bg-slate-950/92 px-2 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 backdrop-blur-sm">
            Filters
          </div>
          <div className="space-y-2">
            <Toggle checked={showAlliances} onChange={(checked) => setFilterToggle("showAlliances", checked)} label="Show alliances" />
            <Toggle checked={showStorms} onChange={(checked) => setFilterToggle("showStorms", checked)} label="Show storms" />
            <Toggle checked={showRumors} onChange={(checked) => setFilterToggle("showRumors", checked)} label="Show rumors" />
            <Toggle checked={replayMode} onChange={setReplayMode} label="Replay Mode" hint="UI only" />
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.92),rgba(8,12,18,0.98))] px-5 py-4 backdrop-blur-sm">
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</div>
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-neon-cyan/20 bg-neon-cyan/8 px-3 py-2 text-xs text-slate-200">
          <span>Live Connected (Mock)</span>
          <span className="h-2.5 w-2.5 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(51,245,255,0.65)]" />
        </div>
      </div>
    </aside>
  );
}
