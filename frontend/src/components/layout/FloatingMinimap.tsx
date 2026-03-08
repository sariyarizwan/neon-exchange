"use client";

import { useState } from "react";
import { districtZones } from "@/mock/cityWorld";
import { districtThemes } from "@/mock/cityThemes";
import { districts } from "@/mock/districts";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/world";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";
import { FloatingChatPanel } from "./FloatingChat";

export function FloatingMinimap() {
  const [legendOpen, setLegendOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const player = useNeonStore((state) => state.player);
  const camera = useNeonStore((state) => state.camera);
  const focusWorldPoint = useNeonStore((state) => state.focusWorldPoint);
  const questLogOpen = useNeonStore((state) => state.questLogOpen);
  const toggleQuestLog = useNeonStore((state) => state.toggleQuestLog);
  const toggleLegendOverlay = useNeonStore((state) => state.toggleLegendOverlay);
  const legendOverlayOpen = useNeonStore((state) => state.legendOverlayOpen);
  const questLogCount = useNeonStore((state) => state.questLog.filter((e) => e.active).length);

  return (
    <div className="fixed bottom-4 right-4 z-30 flex items-end gap-2">
      {/* Legend panel */}
      {legendOpen ? (
        <div className="mb-1 w-[220px] rounded-2xl border border-white/10 bg-slate-950/94 p-3 shadow-[0_0_28px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Legend</div>
            <button
              type="button"
              onClick={() => setLegendOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-200"
            >
              x
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">Districts</div>
              <div className="grid grid-cols-1 gap-1">
                {Object.values(districtThemes).map((theme) => {
                  const dist = districts.find((d) => d.id === theme.districtId);
                  return (
                    <div key={theme.districtId} className="flex items-center gap-2 text-[10px] text-slate-300">
                      <span className="text-sm">{theme.icon}</span>
                      <span>{dist?.name}</span>
                      <span className="ml-auto text-[9px] text-slate-500">{dist?.sector}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">Controls</div>
              <div className="grid gap-1 text-[10px] text-slate-400">
                <div>WASD / Arrows - Move</div>
                <div>Shift - Sprint</div>
                <div>Click NPC - Select ticker</div>
                <div>Buttons - Zoom</div>
                <div>Drag - Pan camera</div>
                <div>Space - Push-to-talk</div>
                <div>/ - Search tickers</div>
                <div>Esc - Clear selection</div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">NPC Types</div>
              <div className="grid gap-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-neon-cyan" />
                  <span className="text-slate-400">Stock NPC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-4 rounded-sm bg-purple-400/60" />
                  <span className="text-slate-400">Newsstand Vendor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500" />
                  <span className="text-slate-400">Citizen</span>
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-slate-500">Regimes</div>
              <div className="grid gap-1 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                  <span className="text-slate-400">Calm - Low volatility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-slate-400">Choppy - Medium volatility</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
                  <span className="text-slate-400">Storm - High volatility</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Buttons column + minimap */}
      <div className="flex flex-col items-end gap-2">
        {/* Chat panel floats above buttons when open */}
        <FloatingChatPanel open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />

        {/* Button row: quest log + chat + legend + metaphor guide */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Quest Log (Q)"
            onClick={toggleQuestLog}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950/88 text-sm font-bold transition",
              questLogOpen
                ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
                : "border-slate-700 text-slate-400 hover:border-neon-cyan/35 hover:text-cyan-100"
            )}
            title="Quest Log (Q)"
          >
            &#x1F4DC;
            {questLogCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neon-magenta text-[8px] font-bold text-white">
                {questLogCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            aria-label="Market Intel Chat"
            onClick={() => setChatOpen(!chatOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950/88 text-sm font-bold transition",
              chatOpen
                ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
                : "border-slate-700 text-slate-400 hover:border-neon-cyan/35 hover:text-cyan-100"
            )}
            title="Market Intel Chat"
          >
            &#x25A4;
          </button>
          <button
            type="button"
            aria-label="Legend"
            onClick={() => setLegendOpen(!legendOpen)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950/88 text-sm font-bold transition",
              legendOpen
                ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
                : "border-slate-700 text-slate-400 hover:border-neon-cyan/35 hover:text-cyan-100"
            )}
          >
            ?
          </button>
          <button
            type="button"
            aria-label="Metaphor Guide (L)"
            onClick={toggleLegendOverlay}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950/88 text-sm font-bold transition",
              legendOverlayOpen
                ? "border-amber-400/50 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                : "border-slate-700 text-slate-400 hover:border-amber-400/35 hover:text-amber-100"
            )}
            title="How to Read the Market (L)"
          >
            &#x1F4D6;
          </button>
        </div>

        {/* Minimap */}
        <div className="w-[200px] rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
          <button
            type="button"
            aria-label="Jump camera using minimap"
            className="w-full text-left"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
              const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
              focusWorldPoint(x, y);
            }}
          >
            <svg viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} className="h-[100px] w-full rounded-xl bg-slate-950/80">
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
        </div>
      </div>
    </div>
  );
}
