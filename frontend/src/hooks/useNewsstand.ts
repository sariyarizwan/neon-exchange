"use client";

import { useMemo } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import type { NewsItem } from "@/lib/api";

/**
 * Returns live news filtered by district, falling back to all news
 * if no district-specific news is available.
 */
export function useNewsstand(districtId: string | null): NewsItem[] {
  const { news } = useLiveData();

  return useMemo(() => {
    if (!news || news.length === 0) return [];

    if (districtId) {
      const districtNews = news.filter(
        (item) => item.district_id === districtId
      );
      if (districtNews.length > 0) return districtNews.slice(0, 5);
    }

    return news.slice(0, 5);
  }, [news, districtId]);
}
