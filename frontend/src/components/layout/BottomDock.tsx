"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

export function BottomDock() {
  const dock = useNeonStore((state) => state.dock);
  const sound = useNeonStore((state) => state.sound);
  const toggleMic = useNeonStore((state) => state.toggleMic);
  const interruptMic = useNeonStore((state) => state.interruptMic);
  const setPersona = useNeonStore((state) => state.setPersona);

  return (
    <footer className="px-4 pb-4">
      <div className="glass-panel panel-frame grid grid-cols-[260px_minmax(0,1fr)_320px] items-center gap-4 px-4 py-3 max-[980px]:grid-cols-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-pressed={dock.micActive}
            aria-label="Push to talk microphone"
            onClick={toggleMic}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70",
              dock.micActive
                ? "border-neon-magenta/40 bg-neon-magenta/14 shadow-neon-magenta"
                : "border-neon-cyan/35 bg-neon-cyan/10 shadow-neon-cyan"
            )}
          >
            <span className="text-xl">{dock.micActive ? "■" : "●"}</span>
          </button>

          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Push to Talk</div>
            <div className="flex h-8 items-end gap-1">
              {Array.from({ length: 9 }, (_, index) => (
                <span
                  key={index}
                  className={cn("wave-bar w-1.5 rounded-full bg-neon-cyan/80", dock.micActive ? "opacity-100" : "opacity-35")}
                  style={{
                    height: `${10 + ((index % 4) + 1) * 5}px`,
                    animationDelay: `${index * 90}ms`
                  }}
                />
              ))}
            </div>
            <div className="text-[11px] text-slate-400">`Space` toggles the mock voice bar.</div>
          </div>
        </div>

        <div className="min-w-0 rounded-[1.4rem] border border-slate-800 bg-slate-950/70 px-3 py-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Transcript</div>
          <div className="mt-2 max-h-[92px] space-y-2 overflow-y-auto pr-1" aria-live="polite">
            {dock.transcriptLines.map((line, index) => (
              <div key={`${line}-${index}`} className="rounded-xl border border-slate-800/80 bg-slate-900/55 px-3 py-2 text-sm text-slate-200">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 max-[980px]:justify-start">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/72 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">
            Sound {sound.enabled ? "On" : "Off"} · Vol {sound.volume} · {sound.trackName} · Playing {String(sound.playing)}
          </div>
          <label className="flex min-w-[150px] flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            Agent Persona
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

          <Button variant="ghost" onClick={interruptMic}>
            Interrupt
          </Button>
          <Badge variant={dock.connected ? "lime" : "amber"}>{dock.connected ? "Live Connected (Mock)" : "Disconnected"}</Badge>
        </div>
      </div>
    </footer>
  );
}
