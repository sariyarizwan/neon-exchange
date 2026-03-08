"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import { useLiveData } from "@/components/LiveDataProvider";
import { useMarketData } from "@/hooks/useMarketData";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { useNeonStore } from "@/store/useNeonStore";

export function DistrictPopup() {
  const districtPopupId = useNeonStore((state) => state.districtPopupId);
  const closeDistrictPopup = useNeonStore((state) => state.closeDistrictPopup);
  const { tickers: liveTickers, news: liveNews, districtStates } = useLiveData();
  const { snapshot, candles, loading, error } = useMarketData(districtPopupId);

  const district = useMemo(
    () => districts.find((d) => d.id === districtPopupId) ?? null,
    [districtPopupId]
  );

  const districtTickers = useMemo(
    () => (districtPopupId ? tickers.filter((t) => t.districtId === districtPopupId) : []),
    [districtPopupId]
  );

  const districtNews = useMemo(
    () =>
      liveNews
        ? liveNews.filter(
            (n) =>
              n.district_id === districtPopupId ||
              n.sector?.toLowerCase() === district?.sector?.toLowerCase()
          )
        : [],
    [liveNews, districtPopupId, district?.sector]
  );

  // Pick the first ticker with candle data for chart
  const chartTickerId = districtTickers[0]?.id ?? null;
  const chartCandles = chartTickerId ? candles[chartTickerId] ?? [] : [];

  if (!district || !districtPopupId) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto">
        <ResizablePanel
          initialWidth={360}
          initialHeight={480}
          minWidth={280}
          minHeight={320}
          storageKey={`district-popup-${districtPopupId}`}
          className="flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: district.accent }}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {district.name}
              </span>
              {(() => {
                const live = districtStates?.[district.id];
                const weather = live?.weather ?? district.regime;
                const mood = live?.mood ?? "calm";
                return (
                  <>
                    <Badge variant={weather === "storm" ? "magenta" : weather === "fog" || weather === "rain" ? "amber" : "lime"}>
                      {weather}
                    </Badge>
                    <Badge variant={mood === "panic" ? "magenta" : mood === "tense" ? "amber" : mood === "euphoric" ? "cyan" : "lime"}>
                      {mood}
                    </Badge>
                  </>
                );
              })()}
            </div>
            <button
              type="button"
              onClick={closeDistrictPopup}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white"
            >
              x
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
            {/* Candlestick Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2">
              <div className="mb-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                {chartTickerId ? `${districtTickers[0]?.symbol} Price` : "Market Chart"}
              </div>
              {error ? (
                <div className="flex h-[120px] items-center justify-center text-[11px] text-amber-400/70">
                  Connecting to market feed...
                </div>
              ) : chartCandles.length > 1 ? (
                <CandlestickChart candles={chartCandles} width={280} height={140} />
              ) : (
                <div className="flex h-[120px] items-center justify-center text-[11px] text-slate-500">
                  {loading ? "Loading candles..." : "Accumulating market data..."}
                </div>
              )}
            </div>

            {/* Investment Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                Tickers in District
              </div>
              <div className="space-y-1.5">
                {districtTickers.map((t) => {
                  const live = liveTickers?.[t.id];
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="font-semibold uppercase tracking-[0.12em] text-white">
                        {t.symbol}
                      </span>
                      {live ? (
                        <span
                          className={
                            live.changePct >= 0 ? "text-lime-400" : "text-rose-400"
                          }
                        >
                          ${live.price.toFixed(2)}{" "}
                          <span className="text-[9px]">
                            {live.changePct >= 0 ? "+" : ""}
                            {live.changePct.toFixed(2)}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500">{t.mood}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent News */}
            {districtNews.length > 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  Recent News
                </div>
                <div className="space-y-1.5">
                  {districtNews.slice(0, 3).map((n, i) => (
                    <div
                      key={`news-${i}`}
                      className="text-[11px] text-slate-300"
                    >
                      <span className="text-[9px] text-lime-400/70">
                        {n.source}
                      </span>{" "}
                      {n.headline}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* District Stats */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">
                District Stats
              </div>
              {(() => {
                const live = districtStates?.[district.id];
                return (
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500">Sector: </span>
                      <span className="text-slate-200">{district.sector}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Traffic: </span>
                      <span className="text-slate-200">{live?.traffic ?? district.traffic}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Tickers: </span>
                      <span className="text-slate-200">{districtTickers.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Weather: </span>
                      <span className="text-slate-200">{live?.weather ?? district.regime}</span>
                    </div>
                    {live ? (
                      <div>
                        <span className="text-slate-500">Glow: </span>
                        <span className="text-slate-200">{(live.glow_intensity * 100).toFixed(0)}%</span>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          </div>
        </ResizablePanel>
      </div>
    </div>
  );
}
