"use client";

import { useEffect } from "react";
import { useNeonStore } from "@/store/useNeonStore";

const mappings = [
  {
    game: "Weather",
    market: "Volatility",
    icons: ["\u2600\uFE0F Clear = Calm", "\uD83C\uDF27\uFE0F Rain = Choppy", "\u26A1 Storm = High Vol"],
    hint: "Storm means risk\u2014check Newsstand for details.",
  },
  {
    game: "Traffic",
    market: "Liquidity",
    icons: ["\uD83D\uDEB6 Empty = Thin", "\uD83D\uDEB6\uD83D\uDEB6 Normal", "\uD83D\uDEB6\uD83D\uDEB6\uD83D\uDEB6 Heavy = Deep"],
    hint: "Low traffic = wide spreads, harder to trade.",
  },
  {
    game: "Crowds",
    market: "Volume / Attention",
    icons: ["\uD83D\uDC65 Cluster = High Volume", "\uD83D\uDEB6 Sparse = Low Interest"],
    hint: "Crowds near an NPC mean big moves. Investigate.",
  },
  {
    game: "NPC Mood",
    market: "Trend / Momentum",
    icons: ["\uD83D\uDE0E Confident = Bullish", "\uD83D\uDE30 Nervous = Bearish", "\uD83E\uDD2A Erratic = Volatile"],
    hint: "Talk to NPCs\u2014mood reveals momentum.",
  },
  {
    game: "Alliance Cables",
    market: "Correlation",
    icons: ["\uD83D\uDD17 Bright cable = High r", "\u2500\u2500 Dim cable = Weak link"],
    hint: "Correlated assets move together\u2014synergy opportunity!",
  },
];

export function LegendOverlay() {
  const legendOverlayOpen = useNeonStore((state) => state.legendOverlayOpen);
  const toggleLegendOverlay = useNeonStore((state) => state.toggleLegendOverlay);
  const legendSeenOnce = useNeonStore((state) => state.legendSeenOnce);
  const setLegendSeenOnce = useNeonStore((state) => state.setLegendSeenOnce);

  // First-time auto-show
  useEffect(() => {
    if (!legendSeenOnce) {
      // Small delay so the city loads first
      const timer = setTimeout(() => {
        useNeonStore.setState({ legendOverlayOpen: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [legendSeenOnce]);

  if (!legendOverlayOpen) return null;

  const handleGotIt = () => {
    setLegendSeenOnce();
    toggleLegendOverlay();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[420px] max-h-[560px] flex flex-col rounded-2xl border border-white/10 bg-slate-950/96 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-neon-cyan">City Guide</div>
            <div className="mt-1 text-sm font-semibold text-white">How to Read the Market</div>
          </div>
          <button
            type="button"
            onClick={handleGotIt}
            className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white"
          >
            x
          </button>
        </div>

        {/* Mappings */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 space-y-3">
          {mappings.map((m) => (
            <div key={m.game} className="rounded-xl border border-white/5 bg-slate-900/40 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-white">{m.game}</span>
                <span className="text-[10px] text-slate-500">\u2192</span>
                <span className="text-xs font-semibold text-neon-cyan">{m.market}</span>
              </div>
              <div className="mt-2 space-y-0.5">
                {m.icons.map((icon) => (
                  <div key={icon} className="text-[10px] text-slate-400">{icon}</div>
                ))}
              </div>
              <div className="mt-2 text-[10px] italic text-amber-400/70">{m.hint}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
          <div className="text-[9px] text-slate-500">Press L or click Legend button to reopen</div>
          <button
            type="button"
            onClick={handleGotIt}
            className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-neon-cyan hover:bg-neon-cyan/20"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
