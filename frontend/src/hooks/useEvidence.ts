"use client";

import { useEffect, useRef } from "react";
import { fetchEvidence } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";

/**
 * Polls the backend evidence feed every 10 seconds and pushes
 * new items into the Zustand store's evidenceTimeline.
 */
export function useEvidence() {
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { evidence } = await fetchEvidence();
        if (cancelled) return;

        const store = useNeonStore.getState();
        const newItems = evidence.filter((item) => !seenRef.current.has(item.id));

        for (const item of newItems) {
          seenRef.current.add(item.id);
          store.addEvidence({
            text: item.text,
            districtId: item.districtId ?? undefined,
            tickerId: item.tickerId ?? undefined,
          });
        }
      } catch {
        // Backend unavailable
      }
    };

    load();
    const interval = setInterval(load, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
