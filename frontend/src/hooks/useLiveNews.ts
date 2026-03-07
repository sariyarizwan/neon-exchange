"use client";

import { useEffect, useState } from "react";
import { fetchNews, type NewsItem } from "@/lib/api";

/**
 * Fetches live news from the backend and refreshes every 30 seconds.
 * Returns null until first fetch succeeds.
 */
export function useLiveNews() {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    const load = () => {
      fetchNews()
        .then((data) => {
          if (cancelled) return;
          setNews(data.news);
          setIsLive(data.isLive);
        })
        .catch(() => {
          // Backend not available
        });
    };

    load();
    interval = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { news, isLive };
}
