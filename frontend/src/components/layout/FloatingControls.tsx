"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toggle } from "@/components/ui/Toggle";
import { useLiveData } from "@/components/LiveDataProvider";
import { avatarOptions } from "@/mock/cityWorld";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { cn } from "@/lib/cn";
import { clearStoredAuth } from "@/lib/mockAuth";
import { useNeonStore } from "@/store/useNeonStore";
import type { MockUser } from "@/types/auth";

type FloatingControlsProps = {
  user: MockUser;
  onReplayTutorial: () => void;
};

const trafficDotsStatic: Record<string, number> = {
  Low: 1,
  Med: 2,
  High: 3,
};

const trafficDotsLive: Record<string, number> = {
  low: 1,
  normal: 2,
  heavy: 3,
  gridlock: 3,
};

export function FloatingControls({ user, onReplayTutorial }: FloatingControlsProps) {
  const router = useRouter();
  const [districtPanelOpen, setDistrictPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const sound = useNeonStore((state) => state.sound);
  const dock = useNeonStore((state) => state.dock);
  const player = useNeonStore((state) => state.player);
  const showAlliances = useNeonStore((state) => state.showAlliances);
  const showStorms = useNeonStore((state) => state.showStorms);
  const showRumors = useNeonStore((state) => state.showRumors);

  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const focusHome = useNeonStore((state) => state.focusHome);
  const setSelectedTickerId = useNeonStore((state) => state.setSelectedTickerId);
  const setFilterToggle = useNeonStore((state) => state.setFilterToggle);
  const setSoundEnabled = useNeonStore((state) => state.setSoundEnabled);
  const setSoundVolume = useNeonStore((state) => state.setSoundVolume);
  const setSoundMode = useNeonStore((state) => state.setSoundMode);
  const setAudioNeedsGesture = useNeonStore((state) => state.setAudioNeedsGesture);
  const setAvatarId = useNeonStore((state) => state.setAvatarId);
  const setDistrictPopupId = useNeonStore((state) => state.setDistrictPopupId);
  const setPersona = useNeonStore((state) => state.setPersona);
  const toggleMic = useNeonStore((state) => state.toggleMic);

  const { tickers: liveTickers, connected: liveConnected, isLive, districtStates } = useLiveData();

  const avatar = avatarOptions.find((option) => option.id === user.avatarId) ?? avatarOptions[0];

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
    <div className="fixed left-4 top-4 z-30 flex items-start gap-2">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-label="Districts"
          data-tutorial-target="districts-button"
          onClick={() => {
            setDistrictPanelOpen(!districtPanelOpen);
            setSettingsPanelOpen(false);
          }}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl border bg-slate-950/88 text-lg transition",
            districtPanelOpen
              ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
              : "border-slate-700 text-slate-200 hover:border-neon-cyan/35 hover:text-cyan-100"
          )}
        >
          &#x25EB;
        </button>

        <button
          type="button"
          aria-label="Settings"
          onClick={() => {
            setSettingsPanelOpen(!settingsPanelOpen);
            setDistrictPanelOpen(false);
          }}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl border bg-slate-950/88 text-lg transition",
            settingsPanelOpen
              ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
              : "border-slate-700 text-slate-200 hover:border-neon-cyan/35 hover:text-cyan-100"
          )}
        >
          &#x2699;
        </button>
      </div>

      {districtPanelOpen ? (
        <div className="glass-panel panel-frame max-h-[70vh] w-[300px] overflow-y-auto overscroll-contain rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Districts</div>
            <button
              type="button"
              onClick={() => setDistrictPanelOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-200"
              aria-label="Close districts panel"
            >
              x
            </button>
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
                        {liveTickers?.[ticker.id] ? (
                          <span className={cn("block text-[11px] font-medium", liveTickers[ticker.id].changePct >= 0 ? "text-lime-400" : "text-rose-400")}>
                            ${liveTickers[ticker.id].price.toFixed(2)} {liveTickers[ticker.id].changePct >= 0 ? "+" : ""}{liveTickers[ticker.id].changePct.toFixed(2)}%
                          </span>
                        ) : null}
                      </span>
                      <Badge variant="slate">{liveTickers?.[ticker.id]?.mood ?? ticker.mood}</Badge>
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
                    onClick={() => {
                      focusDistrict(district.id);
                      setDistrictPopupId(district.id);
                    }}
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
                        {(() => {
                          const live = districtStates?.[district.id];
                          const weather = live?.weather ?? district.regime;
                          const traffic = live?.traffic ?? district.traffic.toLowerCase();
                          const dots = live ? trafficDotsLive[traffic] ?? 1 : trafficDotsStatic[district.traffic] ?? 1;
                          const weatherLabel = live ? weather : district.regime;
                          return (
                            <>
                              <Badge variant={weather === "storm" ? "magenta" : weather === "fog" || weather === "choppy" ? "amber" : "lime"}>
                                {weatherLabel}
                              </Badge>
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                                {Array.from({ length: 3 }, (_, index) => (
                                  <span
                                    key={`${district.id}-${index}`}
                                    className={cn(
                                      "h-1.5 w-4 rounded-full border",
                                      index < dots
                                        ? "border-neon-cyan/40 bg-neon-cyan/40"
                                        : "border-slate-800 bg-slate-900"
                                    )}
                                  />
                                ))}
                                {traffic}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      ) : null}

      {settingsPanelOpen ? (
        <div className="glass-panel panel-frame max-h-[70vh] w-[300px] overflow-y-auto overscroll-contain rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Settings</div>
            <button
              type="button"
              onClick={() => setSettingsPanelOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-200"
              aria-label="Close settings panel"
            >
              x
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="flex items-center gap-3">
                <span className="relative block h-9 w-9 rounded-full border border-slate-800 bg-slate-950/90">
                  <span className="absolute left-2 top-1.5 h-1.5 w-5 rounded-sm" style={{ backgroundColor: avatar.trim }} />
                  <span className="absolute left-1.5 top-3 h-2.5 w-6 rounded-sm" style={{ backgroundColor: avatar.body }} />
                  <span className="absolute left-2.5 top-4 h-1 w-4 rounded-sm" style={{ backgroundColor: avatar.visor }} />
                </span>
                <span className="min-w-0">
                  <span className="block max-w-[120px] truncate text-xs font-semibold uppercase tracking-[0.14em] text-white">{user.displayName}</span>
                  <span className="block max-w-[140px] truncate text-[11px] text-slate-400">{user.guest ? "Guest Session" : user.email}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearStoredAuth();
                  router.replace("/login");
                }}
                className="rounded-full border border-neon-magenta/35 bg-neon-magenta/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-100 transition hover:bg-neon-magenta/16"
              >
                Logout
              </button>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Controls</div>
                <button
                  type="button"
                  onClick={focusHome}
                  className="rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100"
                >
                  Home
                </button>
              </div>
              <div className="space-y-2">
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettingsPanelOpen(false);
                  onReplayTutorial();
                }}
                className="mt-2 w-full rounded-2xl border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-neon-cyan/16"
              >
                Replay Tutorial
              </button>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Sound</div>
              <div className="space-y-3">
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
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Persona & Connection</div>
              <div className="space-y-3">
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
                  <div className={cn("rounded-xl border px-2 py-2", liveConnected ? "border-lime-400/30 bg-lime-400/8 text-lime-300" : "border-slate-800 bg-slate-950/72")}>
                    {liveConnected ? (isLive ? "Live Data" : "Mock Data") : "Offline"}
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/72 px-2 py-2">{sound.trackName}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "showAlliances" as const, label: "Rails" },
                    { key: "showStorms" as const, label: "Storms" },
                    { key: "showRumors" as const, label: "Rumors" },
                  ] as const).map(({ key, label }) => {
                    const active = key === "showAlliances" ? showAlliances : key === "showStorms" ? showStorms : showRumors;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFilterToggle(key, !active)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                          active
                            ? "border-neon-cyan/40 bg-neon-cyan/12 text-cyan-100 shadow-neon-cyan"
                            : "border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-600"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/72 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-slate-500">Push-to-Talk</div>
              <button
                type="button"
                aria-pressed={dock.micActive}
                aria-label="Push to talk microphone"
                onClick={toggleMic}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border transition",
                  dock.micActive
                    ? "border-neon-magenta/40 bg-neon-magenta/14 text-fuchsia-100 shadow-neon-magenta"
                    : "border-neon-cyan/35 bg-neon-cyan/10 text-cyan-100 shadow-neon-cyan"
                )}
              >
                <span className="text-lg">{dock.micActive ? "STOP" : "MIC"}</span>
                <span className="text-[10px] uppercase tracking-[0.14em]">{dock.micActive ? "Recording..." : "Press Space"}</span>
              </button>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
