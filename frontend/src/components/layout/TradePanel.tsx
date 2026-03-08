"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { useLiveData } from "@/components/LiveDataProvider";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

export function TradePanel() {
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const portfolio = useNeonStore((state) => state.portfolio);
  const paperBalance = useNeonStore((state) => state.paperBalance);
  const synergyBurst = useNeonStore((state) => state.synergyBurst);
  const acquireUplink = useNeonStore((state) => state.acquireUplink);
  const extractPosition = useNeonStore((state) => state.extractPosition);
  const addQuestToast = useNeonStore((state) => state.addQuestToast);
  const advanceOnboarding = useNeonStore((state) => state.advanceOnboarding);

  const { tickers: liveTickers } = useLiveData();

  const [shares, setShares] = useState(10);
  const [flash, setFlash] = useState<"acquire" | "extract" | null>(null);

  const ticker = selectedTickerId ? tickers.find((t) => t.id === selectedTickerId) : null;
  const live = ticker && liveTickers ? liveTickers[ticker.id] : null;
  const price = live?.price ?? 0;
  const position = ticker ? portfolio.find((p) => p.tickerId === ticker.id) : null;
  const district = ticker ? districts.find((d) => d.id === ticker.districtId) : null;

  // District dominance: count shares held in this district
  const districtStake = district
    ? portfolio.filter((p) => p.districtId === district.id).reduce((sum, p) => sum + p.shares, 0)
    : 0;

  if (!ticker || !live) return null;

  const handleAcquire = () => {
    const cost = price * shares;
    if (cost > paperBalance) return;
    acquireUplink(ticker.id, ticker.symbol, ticker.districtId, price, shares);
    addQuestToast(`Acquired ${shares} ${ticker.symbol} @ $${price.toFixed(2)}`, "trade", ticker.districtId);
    advanceOnboarding(); // counts toward onboarding if applicable
    setFlash("acquire");
    setTimeout(() => setFlash(null), 600);
  };

  const handleExtract = () => {
    if (!position || position.shares < shares) return;
    const pnl = (price - position.avgPrice) * shares;
    extractPosition(ticker.id, price, shares);
    addQuestToast(`Extracted ${shares} ${ticker.symbol} @ $${price.toFixed(2)} (${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)})`, "trade", ticker.districtId);
    setFlash("extract");
    setTimeout(() => setFlash(null), 600);
  };

  const canAcquire = price * shares <= paperBalance;
  const canExtract = position && position.shares >= shares;

  return (
    <div className={cn(
      "rounded-2xl border bg-slate-950/94 p-3 backdrop-blur-md transition-all duration-300",
      flash === "acquire" ? "border-neon-lime/60 shadow-[0_0_20px_rgba(183,255,60,0.3)]" :
      flash === "extract" ? "border-neon-magenta/60 shadow-[0_0_20px_rgba(255,61,242,0.3)]" :
      synergyBurst.active && Date.now() < synergyBurst.expiresAt ? "border-white/40 shadow-[0_0_24px_rgba(255,255,255,0.2)]" :
      "border-white/10"
    )}>
      {/* Synergy burst indicator */}
      {synergyBurst.active && Date.now() < synergyBurst.expiresAt ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-2 py-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white">Synergy Burst Active</span>
          <Badge variant="cyan">Data Boost</Badge>
        </div>
      ) : null}

      <div className="mb-2 text-[9px] uppercase tracking-[0.16em] text-slate-500">Paper Trade</div>

      {/* Balance */}
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] text-slate-400">Balance</span>
        <span className="text-xs font-semibold text-neon-lime">${paperBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      {/* Current position */}
      {position ? (
        <div className="mb-2 rounded-lg border border-white/5 bg-slate-900/40 px-2 py-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Position: {position.shares} shares</span>
            <span className={cn("font-semibold", (price - position.avgPrice) >= 0 ? "text-lime-400" : "text-rose-400")}>
              {((price - position.avgPrice) / position.avgPrice * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-[9px] text-slate-500">Avg: ${position.avgPrice.toFixed(2)}</div>
        </div>
      ) : null}

      {/* District dominance */}
      {districtStake > 0 && district ? (
        <div className="mb-2 flex items-center gap-2 text-[9px]">
          <span className="text-slate-500">District Stake:</span>
          <span style={{ color: district.accent }}>{districtStake} shares</span>
          {districtStake >= 50 ? <Badge variant="magenta">District Manager</Badge> : null}
        </div>
      ) : null}

      {/* Shares input */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Qty</span>
        <input
          type="number"
          min={1}
          max={1000}
          value={shares}
          onChange={(e) => setShares(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
          data-ignore-camera-keys="true"
          className="w-16 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-white outline-none focus:border-neon-cyan/50"
        />
        <span className="text-[9px] text-slate-500">= ${(price * shares).toFixed(2)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAcquire}
          disabled={!canAcquire}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition",
            canAcquire
              ? "border border-neon-lime/40 bg-neon-lime/10 text-neon-lime hover:bg-neon-lime/20"
              : "border border-slate-700 bg-slate-900/40 text-slate-600 cursor-not-allowed"
          )}
        >
          Acquire Uplink
        </button>
        <button
          type="button"
          onClick={handleExtract}
          disabled={!canExtract}
          className={cn(
            "flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition",
            canExtract
              ? "border border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta hover:bg-neon-magenta/20"
              : "border border-slate-700 bg-slate-900/40 text-slate-600 cursor-not-allowed"
          )}
        >
          Extract
        </button>
      </div>

      <div className="mt-1.5 text-center text-[8px] text-slate-600">Simulated \u2014 paper trade only</div>
    </div>
  );
}
