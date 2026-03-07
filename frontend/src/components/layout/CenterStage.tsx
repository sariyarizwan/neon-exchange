"use client";

import { CityCanvas } from "@/components/city/CityCanvas";
import { cn } from "@/lib/cn";
import { districts } from "@/mock/districts";
import { useNeonStore } from "@/store/useNeonStore";

export function CenterStage() {
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);

  const district = districts.find((entry) => entry.id === selectedDistrictId) ?? null;

  return (
    <section className="glass-panel panel-frame relative min-h-0 overflow-hidden">
      {district ? (
        <div
          className={cn(
            "pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-white/10 bg-slate-950/68 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-200 backdrop-blur-sm transition-opacity duration-300",
            overlaysDimmed && "opacity-15"
          )}
        >
          {district.name}
        </div>
      ) : null}

      <div className="relative h-full">
        <CityCanvas />
      </div>
    </section>
  );
}
