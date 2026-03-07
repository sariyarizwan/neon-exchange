"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { useLiveNews } from "@/hooks/useLiveNews";
import type { NeonTickerData, NewsItem } from "@/lib/api";

type LiveDataContextType = {
  /** Live ticker data keyed by neon ID (nvx, qntm, etc.), null if backend unavailable */
  tickers: Record<string, NeonTickerData> | null;
  /** Live news items, null if backend unavailable */
  news: NewsItem[] | null;
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
  marketMood: "cautious",
  connected: false,
  isLive: false,
});

export function useLiveData() {
  return useContext(LiveDataContext);
}

/**
 * Provides live market data and news to all child components.
 * When the backend is unavailable, tickers/news remain null and
 * components fall back to their existing mock data.
 */
export function LiveDataProvider({ children }: { children: ReactNode }) {
  const market = useLiveMarket();
  const newsData = useLiveNews();

  const value: LiveDataContextType = {
    tickers: market.tickers,
    news: newsData.news,
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
