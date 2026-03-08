"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { useLiveData } from "@/components/LiveDataProvider";
import { districts } from "@/mock/districts";
import { rumors } from "@/mock/rumors";
import { getScenariosForTicker } from "@/mock/scenarios";
import { tickers } from "@/mock/tickers";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";
import type { RightPanelTab } from "@/types/store";

const detailTabs: Array<{ value: RightPanelTab; label: string }> = [
  { value: "scenes", label: "Scenes" },
  { value: "alliances", label: "Links" },
  { value: "evidence", label: "Feed" }
];

export function RightPanel() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const activeRightPanelTab = useNeonStore((state) => state.activeRightPanelTab);
  const evidenceTimeline = useNeonStore((state) => state.evidenceTimeline);
  const setActiveRightPanelTab = useNeonStore((state) => state.setActiveRightPanelTab);
  const triggerDistrictPulse = useNeonStore((state) => state.triggerDistrictPulse);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const addEvidence = useNeonStore((state) => state.addEvidence);
  const setSelectedDistrictId = useNeonStore((state) => state.setSelectedDistrictId);
  const clearSelection = useNeonStore((state) => state.clearSelection);

  const { tickers: liveTickers, news: liveNews } = useLiveData();

  const ticker = tickers.find((entry) => entry.id === selectedTickerId) ?? null;
  const liveTicker = ticker && liveTickers ? liveTickers[ticker.id] : null;
  const district = districts.find((entry) => entry.id === ticker?.districtId) ?? null;
  const scenarios = getScenariosForTicker(ticker);
  const activeScenario = scenarios[0] ?? null;
  const relatedTickers = ticker
    ? ticker.alliances
        .map((alliance) => ({
          strength: alliance.strength,
          ticker: tickers.find((entry) => entry.id === alliance.tickerId) ?? null
        }))
        .filter((entry): entry is { strength: "Link" | "Strong" | "Core"; ticker: NonNullable<typeof entry.ticker> } => Boolean(entry.ticker))
    : [];

  const hasTicker = Boolean(ticker);

  if (!hasTicker && !panelOpen) {
    return (
      <button
        type="button"
        aria-label="Open ticker panel"
        onClick={() => setPanelOpen(true)}
        className="fixed right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/88 text-lg text-slate-200 transition hover:border-neon-cyan/35 hover:text-cyan-100"
      >
        &#x25A8;
      </button>
    );
  }

  if (!hasTicker) {
    return (
      <button
        type="button"
        aria-label="Open ticker panel"
        onClick={() => setPanelOpen(true)}
        className="fixed right-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/88 text-lg text-slate-400 transition hover:border-neon-cyan/35 hover:text-cyan-100"
        title="Select an NPC to open intel panel"
      >
        &#x25A8;
      </button>
    );
  }

  if (!panelOpen) {
    return (
      <button
        type="button"
        aria-label="Open ticker panel"
        onClick={() => setPanelOpen(true)}
        className="fixed right-4 top-4 z-30 flex h-11 items-center gap-2 rounded-2xl border border-neon-cyan/40 bg-slate-950/88 px-3 text-sm text-cyan-100 shadow-neon-cyan transition hover:bg-neon-cyan/10"
      >
        <span className="text-lg">&#x25A8;</span>
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{ticker!.symbol}</span>
      </button>
    );
  }

  return (
    <aside
      className="fixed right-4 top-4 z-30 flex max-h-[calc(100vh-7rem)] w-[340px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/94 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md max-[600px]:left-4 max-[600px]:w-auto"
    >
      <div className="border-b border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.92))] px-4 py-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Street Contact</div>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="truncate text-xl font-semibold text-white">{ticker!.symbol}</span>
              {liveTicker ? (
                <span className={cn("text-sm font-medium", liveTicker.changePct >= 0 ? "text-lime-400" : "text-rose-400")}>
                  ${liveTicker.price.toFixed(2)} <span className="text-xs">{liveTicker.changePct >= 0 ? "+" : ""}{liveTicker.changePct.toFixed(2)}%</span>
                </span>
              ) : null}
            </div>
            <div className="mt-1 truncate text-xs text-slate-300">{ticker!.fullName}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={(liveTicker?.mood ?? ticker!.mood) === "confident" ? "lime" : (liveTicker?.mood ?? ticker!.mood) === "nervous" ? "amber" : "magenta"}>
                {liveTicker?.mood ?? ticker!.mood}
              </Badge>
              {liveTicker ? (
                <Badge variant={liveTicker.regime === "storm" ? "magenta" : liveTicker.regime === "choppy" ? "amber" : "lime"}>
                  {liveTicker.regime}
                </Badge>
              ) : null}
              {district ? <Badge variant="cyan">{district.name}</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200"
              title="Minimize panel"
            >
              _
            </button>
            <button
              type="button"
              onClick={() => {
                clearSelection();
                setPanelOpen(true);
              }}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4">
        <Card className="rounded-[1.4rem] p-4">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Dialogue</div>
          <div className="mt-2 text-sm leading-6 text-slate-100">
            {activeScenario?.summary ?? `${ticker!.symbol} is active in the block. Walk closer to hear fresh street commentary.`}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                focusDistrict(ticker!.districtId);
                triggerDistrictPulse(ticker!.districtId, "scene");
              }}
            >
              Ping District
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDetailsOpen((value) => !value)}>
              {detailsOpen ? "Hide Details" : "Details"}
            </Button>
          </div>
        </Card>

        {detailsOpen ? (
          <div className="space-y-3">
            <div className="sticky top-0 z-10 bg-slate-950/92 py-1 backdrop-blur-sm">
              <Tabs tabs={detailTabs} value={activeRightPanelTab} onChange={setActiveRightPanelTab} />
            </div>

            {activeRightPanelTab === "scenes" && activeScenario ? (
              <Card className="rounded-[1.4rem] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{activeScenario.title}</div>
                    <p className="mt-2 text-sm text-slate-300">{activeScenario.summary}</p>
                  </div>
                  <Badge variant={activeScenario.probability === "High" ? "magenta" : activeScenario.probability === "Med" ? "amber" : "lime"}>
                    {activeScenario.probability}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeScenario.rippleChips.map((chip) => (
                    <Badge key={chip} variant="slate">
                      {chip}
                    </Badge>
                  ))}
                </div>
              </Card>
            ) : null}

            {activeRightPanelTab === "alliances" ? (
              <Card className="rounded-[1.4rem] p-4">
                <div className="space-y-2">
                  {relatedTickers.length > 0 ? (
                    relatedTickers.map((entry) => (
                      <div key={entry.ticker.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{entry.ticker.symbol}</div>
                          <div className="text-[11px] text-slate-400">{entry.ticker.fullName}</div>
                        </div>
                        <Badge variant={entry.strength === "Core" ? "magenta" : entry.strength === "Strong" ? "cyan" : "lime"}>
                          {entry.strength}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">No street links loaded.</div>
                  )}
                </div>
              </Card>
            ) : null}

            {activeRightPanelTab === "evidence" ? (
              <Card className="rounded-[1.4rem] p-4">
                <div className="space-y-2">
                  {liveNews && liveNews.length > 0 ? (
                    <>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-lime-400">Live News</div>
                      {liveNews.slice(0, 3).map((item, i) => (
                        <div key={`news-${i}`} className="rounded-2xl border border-lime-400/20 bg-slate-950/70 px-3 py-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-lime-400">{item.source} - {item.sector}</div>
                          <div className="mt-1 text-sm text-slate-200">{item.headline}</div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {evidenceTimeline.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{entry.timestamp}</div>
                      <div className="mt-1 text-sm text-slate-200">{entry.text}</div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <details className="rounded-[1.4rem] border border-slate-800 bg-slate-950/70 p-4">
              <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                District Rumors
              </summary>
              <div className="mt-3 grid gap-2">
                {rumors.slice(0, 3).map((poster) => (
                  <button
                    key={poster.id}
                    type="button"
                    onClick={() => {
                      focusDistrict(poster.districtId);
                      setSelectedDistrictId(poster.districtId);
                      setActiveRightPanelTab("evidence");
                      triggerDistrictPulse(poster.districtId, "rumor", 2600);
                      addEvidence({
                        districtId: poster.districtId,
                        text: `Rumor pulse activated: ${poster.headline}`
                      });
                    }}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-neon-magenta/35"
                  >
                    {poster.headline}
                  </button>
                ))}
              </div>
            </details>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
