"use client";

import { CityCanvas } from "@/components/city/CityCanvas";
import { cn } from "@/lib/cn";
import { districtZones } from "@/mock/cityWorld";
import { districts } from "@/mock/districts";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/world";
import { useNeonStore } from "@/store/useNeonStore";

export function CenterStage() {
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);
  const player = useNeonStore((state) => state.player);
  const camera = useNeonStore((state) => state.camera);
  const focusWorldPoint = useNeonStore((state) => state.focusWorldPoint);
  const focusHome = useNeonStore((state) => state.focusHome);

  const district = districts.find((entry) => entry.id === selectedDistrictId) ?? null;

  return (
    <section className="glass-panel panel-frame relative min-h-0 overflow-hidden">
      <div className="relative h-full">
        <CityCanvas />
      </div>

      <div
        className={cn(
          "absolute right-4 top-4 z-20 flex w-[190px] flex-col gap-2 transition-opacity duration-300",
          overlaysDimmed && "pointer-events-none opacity-15"
        )}
      >
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/72 px-3 py-2 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">World View</div>
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-100">
              {district?.name ?? "Open City"}
            </div>
          </div>
          <button
            type="button"
            onClick={focusHome}
            className="rounded-full border border-neon-cyan/35 bg-neon-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100"
          >
            Home
          </button>
        </div>

        <button
          type="button"
          aria-label="Jump camera using minimap"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
            const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
            focusWorldPoint(x, y);
          }}
          className="rounded-[1.3rem] border border-neon-cyan/20 bg-slate-950/82 p-2 text-left shadow-panel backdrop-blur-sm"
        >
          <svg viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} className="h-[124px] w-full rounded-xl bg-slate-950/90">
            <rect x="0" y="0" width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="#05060A" />
            {districtZones.map((zone) => (
              <rect
                key={zone.districtId}
                x={zone.x}
                y={zone.y}
                width={zone.width}
                height={zone.height}
                fill={zone.districtId === selectedDistrictId ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)"}
                stroke={zone.accent}
                strokeWidth={zone.districtId === selectedDistrictId ? 30 : 16}
              />
            ))}
            <circle cx={player.x} cy={player.y} r="34" fill="#F8FBFF" />
            <rect
              x={camera.x}
              y={camera.y}
              width={camera.viewportWidth}
              height={camera.viewportHeight}
              fill="none"
              stroke="#F8FBFF"
              strokeWidth="42"
              rx="28"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
