"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { useLiveNews } from "@/hooks/useLiveNews";
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
