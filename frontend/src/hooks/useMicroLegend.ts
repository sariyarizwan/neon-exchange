"use client";

import { useEffect, useRef } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import { useNeonStore } from "@/store/useNeonStore";

/** 1-line translator tips when city state changes, piggybacking on quest toasts */
const translations: Record<string, string> = {
  storm: "Storm = volatility spiking (big swings).",
  rain: "Rain = choppy market, moderate risk.",
  fog: "Fog = low visibility, uncertain outlook.",
  low: "Empty streets = thin liquidity, wide spreads.",
  gridlock: "Gridlock = deep liquidity, tight spreads.",
  panic: "Panic mood = market fear, potential selloff.",
  euphoric: "Euphoria = market greed, possible top.",
};

export function useMicroLegend() {
  const { districtStates } = useLiveData();
  const addQuestToast = useNeonStore((state) => state.addQuestToast);
  const legendSeenOnce = useNeonStore((state) => state.legendSeenOnce);
  const prevWeathers = useRef<Record<string, string>>({});
  const prevTraffics = useRef<Record<string, string>>({});

  useEffect(() => {
    // Only show micro-legends after user has seen the main legend
    if (!districtStates || !legendSeenOnce) return;

    for (const [districtId, state] of Object.entries(districtStates)) {
      const prevW = prevWeathers.current[districtId];
      const prevT = prevTraffics.current[districtId];

      // Weather change
      if (prevW && prevW !== state.weather && translations[state.weather]) {
        addQuestToast(translations[state.weather], "mood", districtId);
      }
      // Traffic change
      if (prevT && prevT !== state.traffic && translations[state.traffic]) {
        addQuestToast(translations[state.traffic], "mood", districtId);
      }

      prevWeathers.current[districtId] = state.weather;
      prevTraffics.current[districtId] = state.traffic;
    }
  }, [districtStates, addQuestToast, legendSeenOnce]);
}
