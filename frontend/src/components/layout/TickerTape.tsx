"use client";

import { useLiveData } from "@/components/LiveDataProvider";
import { cn } from "@/lib/cn";

export function TickerTape() {
  const { tickers } = useLiveData();

  if (!tickers) return null;

  const entries = Object.values(tickers)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  if (entries.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...entries, ...entries];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden border-t border-neon-cyan/10 bg-base-950/90 backdrop-blur-sm">
      <div
        className="flex animate-[ticker-scroll_40s_linear_infinite] whitespace-nowrap py-1"
        style={{ width: "max-content" }}
      >
        {items.map((ticker, i) => {
          const isUp = ticker.changePct > 0;
          const isFlat = Math.abs(ticker.changePct) < 0.1;
          return (
            <span
              key={`${ticker.neonId}-${i}`}
              className="mx-3 inline-flex items-center gap-1.5 text-[11px] font-mono"
            >
              <span className="font-semibold text-slate-300">
                {ticker.neonSymbol}
              </span>
              <span className={cn(
                "font-medium",
                isFlat ? "text-slate-500" : isUp ? "text-neon-lime" : "text-neon-magenta"
              )}>
                ${ticker.price.toFixed(2)}
              </span>
              <span className={cn(
                "text-[10px]",
                isFlat ? "text-slate-600" : isUp ? "text-neon-lime/70" : "text-neon-magenta/70"
              )}>
                {isUp ? "+" : ""}{ticker.changePct.toFixed(2)}%
              </span>
              <span className="text-slate-700">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
