"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMarketSnapshot, type NeonMarketState, type OHLCCandle } from "@/lib/api";

type UseMarketDataResult = {
  snapshot: NeonMarketState | null;
  candles: Record<string, OHLCCandle[]>;
  loading: boolean;
  error: string | null;
};

const POLL_INTERVAL = 5000;
const MAX_CANDLES = 30;

export function useMarketData(districtId: string | null): UseMarketDataResult {
  const [snapshot, setSnapshot] = useState<NeonMarketState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const candleAccRef = useRef<Record<string, OHLCCandle[]>>({});
  const [candles, setCandles] = useState<Record<string, OHLCCandle[]>>({});

  const buildCandle = useCallback((tickerId: string, price: number) => {
    const now = Date.now();
    const existing = candleAccRef.current[tickerId] ?? [];
    const last = existing[existing.length - 1];

    if (last && now - last.timestamp < 4000) {
      // Update current candle
      const updated = {
        ...last,
        high: Math.max(last.high, price),
        low: Math.min(last.low, price),
        close: price,
      };
      candleAccRef.current[tickerId] = [...existing.slice(0, -1), updated];
    } else {
      // New candle
      candleAccRef.current[tickerId] = [
        ...existing.slice(-MAX_CANDLES + 1),
        { open: price, high: price, low: price, close: price, timestamp: now },
      ];
    }
  }, []);

  useEffect(() => {
    if (!districtId) return;

    let cancelled = false;

    const poll = async () => {
      setLoading(true);
      try {
        const data = await fetchMarketSnapshot(districtId);
        if (cancelled) return;
        setSnapshot(data);
        setError(null);

        // Accumulate candles from snapshot prices
        for (const [tickerId, ticker] of Object.entries(data.tickers)) {
          buildCandle(tickerId, ticker.price);
        }
        setCandles({ ...candleAccRef.current });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Connection failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [districtId, buildCandle]);

  return { snapshot, candles, loading, error };
}
