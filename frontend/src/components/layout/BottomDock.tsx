"use client";

import { useLiveData } from "@/components/LiveDataProvider";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

export function BottomDock() {
  const dock = useNeonStore((state) => state.dock);
  const sound = useNeonStore((state) => state.sound);
  const guide = useNeonStore((state) => state.guide);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const toggleMic = useNeonStore((state) => state.toggleMic);
  const setSoundEnabled = useNeonStore((state) => state.setSoundEnabled);
  const { tickers: liveTickers, connected: liveConnected, isLive } = useLiveData();

  const ticker = tickers.find((entry) => entry.id === selectedTickerId) ?? null;
  const liveTicker = ticker && liveTickers ? liveTickers[ticker.id] : null;
  const district = districts.find((entry) => entry.id === (ticker?.districtId ?? selectedDistrictId ?? null)) ?? null;

  const priceTag = liveTicker ? `$${liveTicker.price.toFixed(2)} (${liveTicker.changePct >= 0 ? "+" : ""}${liveTicker.changePct.toFixed(2)}%)` : "";
  const hudLine = ticker
    ? `${ticker.symbol} selected.${priceTag ? ` ${priceTag}` : ""} ${ticker.fullName} is speaking through the street feed.`
    : guide.message ?? dock.transcriptLines[0] ?? "Roam the city and approach an NPC to hear the tape.";
  const personaCode = dock.persona === "Market Maker" ? "MM" : dock.persona === "Whale" ? "WH" : "ND";
  const isConnected = liveConnected || dock.connected;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto w-full max-w-[1880px]">
        <div className="glass-panel panel-frame flex h-[82px] items-center gap-3 rounded-[1.6rem] px-4 py-3">
          <button
            type="button"
            aria-pressed={dock.micActive}
            aria-label="Push to talk microphone"
            onClick={toggleMic}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70",
              dock.micActive
                ? "border-neon-magenta/40 bg-neon-magenta/14 text-fuchsia-100 shadow-neon-magenta"
                : "border-neon-cyan/35 bg-neon-cyan/10 text-cyan-100 shadow-neon-cyan"
            )}
          >
            <span className="text-lg">{dock.micActive ? "■" : "●"}</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              {guide.speaking ? "Now speaking" : ticker ? "Selected NPC" : district ? district.name : "City Feed"}
              {isLive ? <span className="ml-2 text-lime-400">LIVE</span> : null}
            </div>
            <div className="mt-1 truncate text-sm text-slate-100">{hudLine}</div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!sound.enabled)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm transition",
                sound.enabled
                  ? "border-neon-cyan/35 bg-neon-cyan/10 text-cyan-100"
                  : "border-slate-700 bg-slate-900/70 text-slate-400"
              )}
              aria-label={sound.enabled ? "Mute sound" : "Enable sound"}
              title={sound.enabled ? "Sound On" : "Sound Off"}
            >
              {sound.enabled ? "♪" : "×"}
            </button>
            <div
              className="flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200"
              title={dock.persona}
            >
              {personaCode}
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm",
                isConnected ? "border-lime-400/35 bg-lime-400/10 text-lime-100" : "border-amber-400/35 bg-amber-400/10 text-amber-100"
              )}
              title={isConnected ? (isLive ? "Live Market Data" : "Connected") : "Disconnected"}
            >
              {isConnected ? "•" : "!"}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
