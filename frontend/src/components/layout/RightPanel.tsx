"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
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
  const focusMode = useNeonStore((state) => state.focusMode);
  const focusRightPanelOpen = useNeonStore((state) => state.focusRightPanelOpen);
  const setFocusRightPanelOpen = useNeonStore((state) => state.setFocusRightPanelOpen);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const activeRightPanelTab = useNeonStore((state) => state.activeRightPanelTab);
  const evidenceTimeline = useNeonStore((state) => state.evidenceTimeline);
  const setActiveRightPanelTab = useNeonStore((state) => state.setActiveRightPanelTab);
  const triggerDistrictPulse = useNeonStore((state) => state.triggerDistrictPulse);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const addEvidence = useNeonStore((state) => state.addEvidence);
  const setSelectedDistrictId = useNeonStore((state) => state.setSelectedDistrictId);
  const clearSelection = useNeonStore((state) => state.clearSelection);

  const ticker = tickers.find((entry) => entry.id === selectedTickerId) ?? null;
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

  return (
    <aside
      className={cn(
        "glass-panel panel-frame flex h-full min-h-0 max-h-full flex-col overflow-hidden transition-[opacity,width,transform] duration-300 max-[980px]:col-span-2",
        overlaysDimmed && "pointer-events-none opacity-15",
        (!ticker || (focusMode && !focusRightPanelOpen)) && "w-0 translate-x-6 border-0 opacity-0 shadow-none"
      )}
    >
      {ticker ? (
        <>
          <div className="sticky top-0 z-20 border-b border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.92))] px-4 py-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Street Contact</div>
                <div className="mt-2 truncate text-xl font-semibold text-white">{ticker.symbol}</div>
                <div className="mt-1 truncate text-xs text-slate-300">{ticker.fullName}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={ticker.mood === "confident" ? "lime" : ticker.mood === "nervous" ? "amber" : "magenta"}>
                    {ticker.mood}
                  </Badge>
                  {district ? <Badge variant="cyan">{district.name}</Badge> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {focusMode ? (
                  <button
                    type="button"
                    onClick={() => setFocusRightPanelOpen(false)}
                    className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200"
                  >
                    Hide
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={clearSelection}
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
                {activeScenario?.summary ?? `${ticker.symbol} is active in the block. Walk closer to hear fresh street commentary.`}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    focusDistrict(ticker.districtId);
                    triggerDistrictPulse(ticker.districtId, "scene");
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
        </>
      ) : null}
    </aside>
  );
}
