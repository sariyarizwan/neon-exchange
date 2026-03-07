"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/ui/Logo";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toggle } from "@/components/ui/Toggle";
import { avatarOptions, districtZones } from "@/mock/cityWorld";
import { districtThemes } from "@/mock/cityThemes";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/world";
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
  const focusMode = useNeonStore((state) => state.focusMode);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const activeNewsstandDistrictId = useNeonStore((state) => state.activeNewsstandDistrictId);
  const pluginMode = useNeonStore((state) => state.pluginMode);
  const sound = useNeonStore((state) => state.sound);
  const dock = useNeonStore((state) => state.dock);
  const player = useNeonStore((state) => state.player);
  const camera = useNeonStore((state) => state.camera);
  const showPoiMarkers = useNeonStore((state) => state.showPoiMarkers);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const focusWorldPoint = useNeonStore((state) => state.focusWorldPoint);
  const focusHome = useNeonStore((state) => state.focusHome);
  const setSelectedTickerId = useNeonStore((state) => state.setSelectedTickerId);
  const setFilterToggle = useNeonStore((state) => state.setFilterToggle);
  const setSoundEnabled = useNeonStore((state) => state.setSoundEnabled);
  const setSoundVolume = useNeonStore((state) => state.setSoundVolume);
  const setSoundMode = useNeonStore((state) => state.setSoundMode);
  const setAudioNeedsGesture = useNeonStore((state) => state.setAudioNeedsGesture);
  const setPluginMode = useNeonStore((state) => state.setPluginMode);
  const setAvatarId = useNeonStore((state) => state.setAvatarId);
  const setShowPoiMarkers = useNeonStore((state) => state.setShowPoiMarkers);
  const setPersona = useNeonStore((state) => state.setPersona);
  const toggleFocusMode = useNeonStore((state) => state.toggleFocusMode);
  const showAlliances = useNeonStore((state) => state.showAlliances);
  const showStorms = useNeonStore((state) => state.showStorms);
  const showRumors = useNeonStore((state) => state.showRumors);

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

  const questHint = districtThemes[selectedDistrictId ?? "consumer-strip"]?.questHint ?? districtThemes["consumer-strip"].questHint;

  if (focusMode) {
    return (
      <aside
        className={cn(
          "glass-panel panel-frame flex h-full min-h-0 w-[56px] flex-col items-center justify-between overflow-hidden py-4 transition-opacity duration-300",
          overlaysDimmed && "pointer-events-none opacity-15"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            title="Districts"
            aria-label="Districts"
            onClick={focusHome}
            className="h-10 w-10 rounded-2xl border border-slate-800 bg-slate-950/76 text-sm text-slate-200 transition hover:border-neon-cyan/35 hover:text-cyan-100"
          >
            ◫
          </button>
          <button
            type="button"
            title="Sound"
            aria-label="Sound"
            onClick={() => {
              const next = !sound.enabled;
              setSoundEnabled(next);
              if (next && !sound.bootstrapped) {
                setAudioNeedsGesture(true);
              }
            }}
            className={cn(
              "h-10 w-10 rounded-2xl border bg-slate-950/76 text-sm transition",
              sound.enabled
                ? "border-neon-magenta/35 text-fuchsia-100 shadow-neon-magenta"
                : "border-slate-800 text-slate-200 hover:border-neon-cyan/35 hover:text-cyan-100"
            )}
          >
            ♪
          </button>
          <button
            type="button"
            title="POI Markers"
            aria-label="POI Markers"
            onClick={() => setShowPoiMarkers(!showPoiMarkers)}
            className="h-10 w-10 rounded-2xl border border-slate-800 bg-slate-950/76 text-sm text-slate-200 transition hover:border-neon-cyan/35 hover:text-cyan-100"
          >
            ◌
          </button>
          <button
            type="button"
            title="Avatar"
            aria-label="Avatar"
            onClick={() => setAvatarId(avatarOptions[(avatarOptions.findIndex((option) => option.id === player.avatarId) + 1) % avatarOptions.length].id)}
            className="h-10 w-10 rounded-2xl border border-slate-800 bg-slate-950/76 text-sm text-slate-200 transition hover:border-neon-cyan/35 hover:text-cyan-100"
          >
            ☺
          </button>
          <button
            type="button"
            title="Exit Focus"
            aria-label="Exit Focus"
            onClick={toggleFocusMode}
            className="h-10 w-10 rounded-2xl border border-slate-800 bg-slate-950/76 text-sm text-slate-200 transition hover:border-neon-cyan/35 hover:text-cyan-100"
          >
            ◎
          </button>
        </div>
        <div className="h-2.5 w-2.5 rounded-full bg-neon-cyan shadow-[0_0_12px_rgba(51,245,255,0.65)]" />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "glass-panel panel-frame h-full min-h-0 overflow-y-auto overscroll-contain scroll-smooth transition-opacity duration-300",
        overlaysDimmed && "pointer-events-none opacity-15"
      )}
    >
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(8,12,18,0.92))] px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <Logo variant="wordmark" className="gap-2.5" />
          <button
            type="button"
            onClick={toggleFocusMode}
            className="rounded-full border border-slate-700 bg-slate-950/78 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:border-slate-600"
          >
            Focus
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/62 p-4 shadow-panel">
          <div className="sticky top-0 z-10 -mx-1 mb-4 flex items-center justify-between rounded-2xl bg-slate-950/96 px-3 py-2 backdrop-blur-sm">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Districts</div>
            <Badge variant="slate">8 Zones</Badge>
          </div>

          <div className="space-y-3">
            <SearchInput
              id="ticker-search-input"
              aria-label="Find a ticker"
              placeholder="Find a ticker..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            {query ? (
              <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-950/70 p-2">
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
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{district.name}</div>
                        <div className="mt-1 text-[11px] text-slate-400">{district.summary}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={district.regime === "storm" ? "magenta" : district.regime === "choppy" ? "amber" : "lime"}>
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

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Game Menu</div>
                <button
                  type="button"
                  onClick={focusHome}
                  className="rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100"
                >
                  Home
                </button>
              </div>

              <div className="space-y-2">
                <Toggle checked={pluginMode} onChange={setPluginMode} label="Plugin Mode" hint="Opens mock stock page links" />
                <Toggle checked={showPoiMarkers} onChange={setShowPoiMarkers} label="POI Markers" hint="District discovery icons" />
                <Toggle checked={replayMode} onChange={setReplayMode} label="Replay Mode" hint="UI only" />
              </div>

              <details className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/72 p-3" open>
                <summary className="cursor-pointer list-none text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Settings
                </summary>
                <div className="mt-3 space-y-3">
                  <Toggle
                    checked={sound.enabled}
                    onChange={(checked) => {
                      setSoundEnabled(checked);
                      if (checked && !sound.bootstrapped) {
                        setAudioNeedsGesture(true);
                      }
                    }}
                    label="Sound"
                    hint={
                      sound.needsGesture
                        ? "Tap once to enable audio."
                        : sound.mode === "guide"
                          ? sound.playing
                            ? "Guide speaking"
                            : "Guide standing by"
                          : sound.playing
                            ? "Music live"
                            : "Music idle"
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {(["guide", "music"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSoundMode(mode)}
                        className={cn(
                          "rounded-2xl border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                          sound.mode === mode
                            ? "border-neon-magenta/40 bg-neon-magenta/12 text-fuchsia-100 shadow-neon-magenta"
                            : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-700"
                        )}
                      >
                        {mode === "guide" ? "Guide" : "Music"}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/72 px-3 py-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-500">
                      <span>Volume</span>
                      <span>{sound.volume}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sound.volume}
                      onChange={(event) => setSoundVolume(Number(event.target.value))}
                      className="w-full accent-cyan-300"
                    />
                  </div>
                  <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    Persona
                    <select
                      value={dock.persona}
                      onChange={(event) => setPersona(event.target.value as "Market Maker" | "Whale" | "News Desk")}
                      className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs font-semibold tracking-[0.12em] text-slate-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/70"
                    >
                      <option>Market Maker</option>
                      <option>Whale</option>
                      <option>News Desk</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/72 px-2 py-2">
                      {dock.connected ? "Live Connected" : "Offline"}
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950/72 px-2 py-2">{sound.trackName}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Toggle checked={showAlliances} onChange={(checked) => setFilterToggle("showAlliances", checked)} label="Rails" />
                    <Toggle checked={showStorms} onChange={(checked) => setFilterToggle("showStorms", checked)} label="Storms" />
                    <Toggle checked={showRumors} onChange={(checked) => setFilterToggle("showRumors", checked)} label="Rumors" />
                  </div>
                </div>
              </details>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Minimap</div>
              <button
                type="button"
                aria-label="Jump camera using minimap"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
                  const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
                  focusWorldPoint(x, y);
                }}
                className="w-full rounded-2xl border border-neon-cyan/20 bg-slate-950/84 p-2 text-left"
              >
                <svg viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} className="h-[150px] w-full rounded-xl bg-slate-950/80">
                  <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="#05060A" />
                  {districtZones.map((zone) => (
                    <rect
                      key={zone.districtId}
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      fill={`rgba(60,80,120,${zone.districtId === selectedDistrictId ? 0.42 : 0.18})`}
                      stroke={zone.accent}
                      strokeWidth={zone.districtId === selectedDistrictId ? 36 : 18}
                    />
                  ))}
                  <circle cx={player.x} cy={player.y} r="42" fill="#F8FBFF" />
                  <rect
                    x={camera.x}
                    y={camera.y}
                    width={camera.viewportWidth}
                    height={camera.viewportHeight}
                    fill="none"
                    stroke="#F8FBFF"
                    strokeWidth="48"
                    rx="32"
                  />
                </svg>
              </button>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] uppercase tracking-[0.14em] text-slate-400">
                {Object.values(districtThemes).map((theme) => (
                  <div key={theme.districtId} className="flex items-center gap-1">
                    <span className="text-neon-cyan">{theme.icon}</span>
                    <span>{districts.find((district) => district.id === theme.districtId)?.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Avatar Picker</div>
              <div className="grid grid-cols-2 gap-2">
                {avatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAvatarId(option.id)}
                    className={cn(
                      "rounded-2xl border px-2 py-2 text-left transition",
                      player.avatarId === option.id
                        ? "border-neon-cyan/40 bg-neon-cyan/10 shadow-neon-cyan"
                        : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="relative block h-8 w-8 rounded-md bg-slate-950/80">
                        <span className="absolute left-1.5 top-1 h-1.5 w-5 rounded-sm" style={{ backgroundColor: option.trim }} />
                        <span className="absolute left-1 top-2.5 h-3.5 w-6 rounded-sm" style={{ backgroundColor: option.body }} />
                        <span className="absolute left-2 top-3.5 h-1 w-4 rounded-sm" style={{ backgroundColor: option.visor }} />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white">{option.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-neon-cyan/20 bg-neon-cyan/8 p-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">Quest Hint</div>
              <div className="mt-2 text-sm text-white">{questHint}</div>
              {activeNewsstandDistrictId ? (
                <div className="mt-2 text-[11px] text-slate-300">Newsstand pulse active in {districts.find((district) => district.id === activeNewsstandDistrictId)?.name}.</div>
              ) : null}
            </div>

          </div>
        </div>
      </div>
    </aside>
  );
}
