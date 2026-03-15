"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import { useNeonStore } from "@/store/useNeonStore";
import type { NewsItem } from "@/lib/api";
import { cn } from "@/lib/cn";

type Alert = {
  id: string;
  headline: string;
  districtId?: string | null;
  expiresAt: number;
};

export function BreakingNewsAlert() {
  const { news } = useLiveData();
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const seenRef = useRef(new Set<string>());
  const triggerDistrictPulse = useNeonStore((s) => s.triggerDistrictPulse);

  const showAlert = useCallback(
    (item: NewsItem) => {
      const id = `${item.headline}-${item.timestamp}`;
      if (seenRef.current.has(id)) return;
      seenRef.current.add(id);

      setActiveAlert({
        id,
        headline: item.headline,
        districtId: item.district_id,
        expiresAt: Date.now() + 4000,
      });

      if (item.district_id) {
        triggerDistrictPulse(item.district_id, "scene", 4000);
      }
    },
    [triggerDistrictPulse]
  );

  // Watch for high-severity news
  useEffect(() => {
    if (!news) return;
    const highSeverity = news.find(
      (item) => item.severity === "high" && !seenRef.current.has(`${item.headline}-${item.timestamp}`)
    );
    if (highSeverity) {
      showAlert(highSeverity);
    }
  }, [news, showAlert]);

  // Auto-dismiss
  useEffect(() => {
    if (!activeAlert) return;
    const remaining = activeAlert.expiresAt - Date.now();
    if (remaining <= 0) {
      setActiveAlert(null);
      return;
    }
    const timeout = window.setTimeout(() => setActiveAlert(null), remaining);
    return () => window.clearTimeout(timeout);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-16">
      {/* Flash overlay */}
      <div className="absolute inset-0 animate-[flash-fade_0.6s_ease-out] bg-neon-magenta/8" />

      {/* Banner */}
      <div className={cn(
        "pointer-events-auto mx-4 max-w-xl animate-[slide-down_0.3s_ease-out]",
        "rounded-xl border border-neon-magenta/40 bg-base-950/95 px-5 py-3",
        "shadow-[0_0_40px_rgba(255,0,128,0.3)] backdrop-blur-md"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded bg-neon-magenta/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon-magenta animate-pulse">
            Breaking
          </span>
          {activeAlert.districtId ? (
            <span className="text-[9px] uppercase tracking-wider text-slate-500">
              {activeAlert.districtId.replace(/-/g, " ")}
            </span>
          ) : null}
        </div>
        <div className="text-[13px] font-medium leading-snug text-slate-100">
          {activeAlert.headline}
        </div>
      </div>
    </div>
  );
}
