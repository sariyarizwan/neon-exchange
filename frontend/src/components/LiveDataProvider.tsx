"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { useLiveNews } from "@/hooks/useLiveNews";
import { fetchBootstrap } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";
import type { DistrictLiveState, LiveSignals, NeonTickerData, NewsItem } from "@/lib/api";

type LiveDataContextType = {
  /** Live ticker data keyed by neon ID (nvx, qntm, etc.), null if backend unavailable */
  tickers: Record<string, NeonTickerData> | null;
  /** Live news items, null if backend unavailable */
  news: NewsItem[] | null;
  /** Live district states (weather, traffic, mood, glow), null if backend unavailable */
  districtStates: Record<string, DistrictLiveState> | null;
  /** Live signals (correlations, sector strength, breadth), null if backend unavailable */
  signals: LiveSignals | null;
  /** Overall market mood from backend */
  marketMood: string;
  /** Whether we're connected to the backend */
  connected: boolean;
  /** Whether backend is serving live (Finnhub) vs mock data */
  isLive: boolean;
};

const LiveDataContext = createContext<LiveDataContextType>({
  tickers: null,
  news: null,
  districtStates: null,
  signals: null,
  marketMood: "cautious",
  connected: false,
  isLive: false,
});

export function useLiveData() {
  return useContext(LiveDataContext);
}

/**
 * Provides live market data, news, district states, and signals to all child components.
 * When the backend is unavailable, fields remain null and
 * components fall back to their existing mock data.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const market = useLiveMarket();
  const newsData = useLiveNews();
  const bootstrappedRef = useRef(false);

  // Bootstrap: seed initial scenarios from the agent system
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    fetchBootstrap()
      .then((data) => {
        const store = useNeonStore.getState();
        if (data.scenarios && Array.isArray(data.scenarios)) {
          for (const scenario of data.scenarios.slice(0, 5)) {
            const text = scenario.title ?? scenario.description ?? "";
            if (text) {
              store.addEvidence({
                text: `[scenario] ${text}`.slice(0, 200),
                districtId: scenario.affected_districts?.[0] ?? undefined,
                tickerId: scenario.affected_tickers?.[0] ?? undefined,
              });
            }
          }
        }
      })
      .catch(() => {
        // Backend not available
      });
  }, []);

  // Auto-trigger district storm pulses from live weather data
  useEffect(() => {
    if (!market.districtStates) return;
    const store = useNeonStore.getState();
    for (const [districtId, state] of Object.entries(market.districtStates)) {
      if (state.weather === "storm") {
        store.triggerDistrictPulse(districtId, "scene", 8000);
      }
    }
  }, [market.districtStates]);

  const value: LiveDataContextType = {
    tickers: market.tickers,
    news: market.news ?? newsData.news,
    districtStates: market.districtStates,
    signals: market.signals,
    marketMood: market.marketMood,
    connected: market.connected,
    isLive: market.isLive || newsData.isLive,
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
}
