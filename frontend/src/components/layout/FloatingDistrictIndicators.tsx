"use client";

import { useMemo } from "react";
import { districts } from "@/mock/districts";
import { districtThemes } from "@/mock/cityThemes";
import { useNeonStore } from "@/store/useNeonStore";
import { computeIndicators } from "@/lib/edgeIndicators";

const DISTRICT_CENTERS = districts.map((d) => ({
  id: d.id,
  centerX: d.center.x,
  centerY: d.center.y,
}));

const ACCENT_MAP = Object.fromEntries(districts.map((d) => [d.id, d.accent]));
const NAME_MAP = Object.fromEntries(districts.map((d) => [d.id, d.name]));

/** Quantize to ~20px to reduce re-renders */
const q = (n: number) => Math.round(n / 20) * 20;

export function FloatingDistrictIndicators() {
  const cameraX = useNeonStore((s) => q(s.camera.x));
  const cameraY = useNeonStore((s) => q(s.camera.y));
  const zoom = useNeonStore((s) => Math.round(s.camera.zoom * 100) / 100);
  const vw = useNeonStore((s) => s.camera.viewportWidth);
  const vh = useNeonStore((s) => s.camera.viewportHeight);
  const focusDistrict = useNeonStore((s) => s.focusDistrict);

  const indicators = useMemo(
    () => computeIndicators(DISTRICT_CENTERS, cameraX, cameraY, zoom, vw, vh),
    [cameraX, cameraY, zoom, vw, vh]
  );

  if (indicators.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[25]">
      {indicators.map((ind) => {
        const accent = ACCENT_MAP[ind.districtId] ?? "#33F5FF";
        const theme = districtThemes[ind.districtId];
        const icon = theme?.icon ?? "?";
        const name = NAME_MAP[ind.districtId] ?? ind.districtId;

        // Fade with distance: closer = brighter
        const maxDist = 3000;
        const opacity = Math.max(0.4, Math.min(1.0, 1.0 - (ind.distance - 200) / maxDist));

        // Arrow rotation: point toward district
        const arrowDeg = (ind.angle * 180) / Math.PI;

        return (
          <button
            key={ind.districtId}
            type="button"
            className="pointer-events-auto absolute flex items-center gap-1.5 rounded-xl border bg-slate-950/80 px-2.5 py-1.5 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            style={{
              left: ind.screenX,
              top: ind.screenY,
              transform: "translate(-50%, -50%)",
              opacity,
              borderColor: `${accent}66`,
              boxShadow: `0 0 12px ${accent}33, 0 0 4px ${accent}22`,
            }}
            onClick={() => focusDistrict(ind.districtId)}
            title={name}
          >
            <span style={{ color: accent }} className="text-base leading-none">
              {icon}
            </span>
            <span
              className="text-[10px] leading-none"
              style={{
                display: "inline-block",
                transform: `rotate(${arrowDeg}deg)`,
                color: accent,
              }}
            >
              &rarr;
            </span>
          </button>
        );
      })}
    </div>
  );
}
