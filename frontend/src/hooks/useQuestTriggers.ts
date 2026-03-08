"use client";

import { useEffect, useRef } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import { districts } from "@/mock/districts";
import { useNeonStore } from "@/store/useNeonStore";

/**
 * Watches live data streams and fires quest toasts when notable events occur:
 * - Storm detected in a district
 * - High momentum ticker (crowd surge)
 * - New alliance formed (high correlation)
 * - Breaking news arrives
 */
export function useQuestTriggers() {
  const { districtStates, signals, news, tickers: liveTickers } = useLiveData();
  const addQuestToast = useNeonStore((state) => state.addQuestToast);

  // Track previously seen states to detect changes (not just repeat)
  const prevStormDistricts = useRef<Set<string>>(new Set());
  const prevHighMomentum = useRef<Set<string>>(new Set());
  const prevNewsCount = useRef(0);
  const prevAllianceKeys = useRef<Set<string>>(new Set());

  // Storm detection
  useEffect(() => {
    if (!districtStates) return;
    const currentStorms = new Set<string>();
    for (const [districtId, state] of Object.entries(districtStates)) {
      if (state.weather === "storm") currentStorms.add(districtId);
    }
    // Fire toast for newly stormy districts
    for (const id of currentStorms) {
      if (!prevStormDistricts.current.has(id)) {
        const name = districts.find((d) => d.id === id)?.name ?? id;
        addQuestToast(`Storm detected in ${name}! High volatility zone.`, "storm");
      }
    }
    prevStormDistricts.current = currentStorms;
  }, [districtStates, addQuestToast]);

  // High momentum tickers (crowd surge)
  useEffect(() => {
    if (!liveTickers) return;
    const currentHigh = new Set<string>();
    for (const [id, data] of Object.entries(liveTickers)) {
      if (Math.abs(data.momentum ?? 0) > 0.6) currentHigh.add(id);
    }
    for (const id of currentHigh) {
      if (!prevHighMomentum.current.has(id)) {
        const symbol = liveTickers[id]?.neonSymbol ?? id.toUpperCase();
        addQuestToast(`Crowd surge near ${symbol}! Momentum spike.`, "crowd");
      }
    }
    prevHighMomentum.current = currentHigh;
  }, [liveTickers, addQuestToast]);

  // New alliance detection (high correlation appearing)
  useEffect(() => {
    if (!signals?.correlations?.top_positive) return;
    const currentKeys = new Set<string>();
    for (const pair of signals.correlations.top_positive) {
      if (pair.r >= 0.7) {
        const key = [pair.a, pair.b].sort().join("-");
        currentKeys.add(key);
      }
    }
    for (const key of currentKeys) {
      if (!prevAllianceKeys.current.has(key)) {
        const [a, b] = key.split("-");
        addQuestToast(`Alliance formed: ${a?.toUpperCase()} \u2194 ${b?.toUpperCase()}`, "alliance");
      }
    }
    prevAllianceKeys.current = currentKeys;
  }, [signals, addQuestToast]);

  // Breaking news
  useEffect(() => {
    if (!news || news.length === 0) return;
    if (news.length > prevNewsCount.current && prevNewsCount.current > 0) {
      const latest = news[0];
      if (latest) {
        const truncated = latest.headline.length > 40 ? latest.headline.slice(0, 38) + ".." : latest.headline;
        addQuestToast(truncated, "news");
      }
    }
    prevNewsCount.current = news.length;
  }, [news, addQuestToast]);
}
