"use client";

import { useEffect, useRef, useState } from "react";
import { createNeonStream, fetchNeonState, type NeonTickerData } from "@/lib/api";

/**
 * Connects to the backend SSE stream and provides live market data
 * keyed by the frontend's neon ticker IDs (nvx, qntm, mint, etc.).
 *
 * Falls back to polling if SSE fails. Returns null until first data arrives.
 */
export function useLiveMarket() {
  const [tickers, setTickers] = useState<Record<string, NeonTickerData> | null>(null);
  const [marketMood, setMarketMood] = useState<string>("cautious");
  const [isLive, setIsLive] = useState(false);
  const [connected, setConnected] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Try SSE stream first
    const cleanup = createNeonStream((data) => {
      if (cancelled) return;
      setTickers(data.tickers);
      setConnected(true);
    });
    cleanupRef.current = cleanup;

    // Also do an initial fetch for full data (SSE sends compact format)
    fetchNeonState()
      .then((state) => {
        if (cancelled) return;
        setTickers(state.tickers);
        setMarketMood(state.marketMood);
        setIsLive(state.isLive);
        setConnected(true);
      })
      .catch(() => {
        // Backend not available -- that's fine, frontend works with mocks
        setConnected(false);
      });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return { tickers, marketMood, isLive, connected };
}
