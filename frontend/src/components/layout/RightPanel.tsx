"use client";

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

const tabItems: Array<{ value: RightPanelTab; label: string }> = [
  { value: "scenes", label: "Scenes" },
  { value: "alliances", label: "Alliances" },
  { value: "evidence", label: "Evidence" }
];

export function RightPanel() {
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

  const ticker = tickers.find((entry) => entry.id === selectedTickerId) ?? null;
  const district = districts.find((entry) => entry.id === ticker?.districtId) ?? null;
  const scenarios = getScenariosForTicker(ticker);
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
        focusMode && !focusRightPanelOpen && "w-0 translate-x-6 border-0 opacity-0 shadow-none"
      )}
    >
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.92))] px-5 py-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Ticker Detail</div>
        {ticker ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <h2 className="text-3xl font-semibold text-white">{ticker.symbol}</h2>
              <div className="text-sm text-slate-300">{ticker.fullName}</div>
            </div>
            <div className="mt-2 text-sm text-slate-400">{ticker.archetype}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={ticker.mood === "confident" ? "lime" : ticker.mood === "nervous" ? "amber" : "magenta"}>
                {ticker.mood}
              </Badge>
              {district ? <Badge variant="cyan">{district.name}</Badge> : null}
            </div>
          </>
        ) : (
          <div className="mt-3 text-sm text-slate-400">Select a ticker node on the city map to inspect scenes, alliances, and evidence.</div>
        )}
          </div>
          {focusMode ? (
            <button
              type="button"
              onClick={() => setFocusRightPanelOpen(false)}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-200"
            >
              Hide
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain scroll-smooth px-4 py-4">
        <div className="sticky top-0 z-10 bg-slate-950/92 py-1 backdrop-blur-sm">
          <Tabs tabs={tabItems} value={activeRightPanelTab} onChange={setActiveRightPanelTab} />
        </div>

        {activeRightPanelTab === "scenes" ? (
          <div className="space-y-3">
            {ticker ? (
              scenarios.map((scenario) => (
                <Card key={scenario.id} className="space-y-4 rounded-[1.6rem]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{scenario.title}</div>
                      <p className="mt-2 text-sm text-slate-300">{scenario.summary}</p>
                    </div>
                    <Badge variant={scenario.probability === "High" ? "magenta" : scenario.probability === "Med" ? "amber" : "lime"}>
                      {scenario.probability}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm max-[1120px]:grid-cols-1">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Confirm Signals</div>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {scenario.confirmSignals.map((signal) => (
                          <li key={signal} className="rounded-xl border border-lime-400/15 bg-lime-400/5 px-3 py-2 text-[13px]">
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Invalidate Signals</div>
                      <ul className="mt-2 space-y-1 text-slate-300">
                        {scenario.invalidateSignals.map((signal) => (
                          <li key={signal} className="rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/5 px-3 py-2 text-[13px]">
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {scenario.rippleChips.map((chip) => (
                      <Badge key={chip} variant="slate">
                        {chip}
                      </Badge>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      if (!ticker) {
                        return;
                      }
                      focusDistrict(ticker.districtId);
                      triggerDistrictPulse(ticker.districtId, "scene");
                    }}
                    aria-label={`Play ${scenario.title} for ${ticker.symbol}`}
                  >
                    Play Scene
                  </Button>
                </Card>
              ))
            ) : (
              <Card className="rounded-[1.6rem]">
                <div className="text-sm text-slate-400">Scenario cards will populate once a ticker is selected.</div>
              </Card>
            )}
          </div>
        ) : null}

        {activeRightPanelTab === "alliances" ? (
          <div className="space-y-3">
            {ticker ? (
              relatedTickers.map((entry) => (
                <Card key={entry.ticker.id} className="rounded-[1.6rem]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">
                        {entry.ticker.symbol} · {entry.ticker.fullName}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">{entry.ticker.archetype}</div>
                    </div>
                    <Badge variant={entry.strength === "Core" ? "magenta" : entry.strength === "Strong" ? "cyan" : "lime"}>
                      {entry.strength}
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-950/90">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r",
                        entry.strength === "Core"
                          ? "from-fuchsia-400 via-neon-magenta to-slate-950"
                          : entry.strength === "Strong"
                            ? "from-cyan-300 via-neon-cyan to-slate-950"
                            : "from-lime-300 via-neon-lime to-slate-950"
                      )}
                      style={{ width: entry.strength === "Core" ? "88%" : entry.strength === "Strong" ? "68%" : "44%" }}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="rounded-[1.6rem]">
                <div className="text-sm text-slate-400">Alliances will appear after ticker selection.</div>
              </Card>
            )}
          </div>
        ) : null}

        {activeRightPanelTab === "evidence" ? (
          <Card className="space-y-3 rounded-[1.6rem]">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Evidence Timeline</div>
            <div className="space-y-2">
              {evidenceTimeline.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{entry.timestamp}</div>
                  <div className="mt-1 text-sm text-slate-200">{entry.text}</div>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <section className="space-y-3">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-2xl bg-slate-950/92 px-2 py-2 backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Rumor Posters</div>
            <Badge variant="magenta">Creative Placeholder</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {rumors.map((poster) => {
              const posterDistrict = districts.find((entry) => entry.id === poster.districtId);
              return (
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
                      text: `Rumor poster activated: ${poster.headline}`
                    });
                    // TODO: poster trigger should come from NewsDesk agent event.
                  }}
                  className="rounded-[1.4rem] border border-slate-800 bg-slate-950/80 p-3 text-left transition hover:border-neon-magenta/35 hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-magenta/70"
                >
                  <div className="mb-3 h-24 rounded-2xl bg-[linear-gradient(135deg,rgba(51,245,255,0.24),rgba(255,61,242,0.18),rgba(183,255,60,0.14))]" />
                  {/* TODO: replace poster placeholder with Gemini-generated image. */}
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{poster.headline}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {posterDistrict ? <Badge variant="cyan">{posterDistrict.name}</Badge> : null}
                    <Badge variant={poster.severity === "Critical" ? "magenta" : poster.severity === "Elevated" ? "amber" : "lime"}>
                      {poster.severity}
                    </Badge>
                  </div>
                  <div className="mt-2 text-[12px] text-slate-400">{poster.teaser}</div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
