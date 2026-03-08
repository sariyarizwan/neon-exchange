/**
 * Fallback news generators when backend is unavailable.
 * These produce generic placeholder text — live data from the SSE stream
 * replaces these when the backend is connected.
 */

import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import type { DistrictNewsBoard, TickerNewsEntry } from "@/types/news";

export const tickerNews: Record<string, TickerNewsEntry> = Object.fromEntries(
  tickers.map((ticker) => [
    ticker.id,
    {
      tickerId: ticker.id,
      summary: `${ticker.symbol} — ${ticker.fullName}. Waiting for live market feed.`,
      lines: [
        {
          id: `${ticker.id}-line-1`,
          text: `${ticker.symbol} is active in ${ticker.districtId.replaceAll("-", " ")}.`,
          source: "Awaiting Feed"
        },
      ]
    } satisfies TickerNewsEntry
  ])
) as Record<string, TickerNewsEntry>;

export const districtNewsBoards: Record<string, DistrictNewsBoard> = Object.fromEntries(
  districts.map((district) => [
    district.id,
    {
      districtId: district.id,
      lines: [
        {
          id: `${district.id}-headline-1`,
          text: `${district.name} — ${district.sector} district. Connecting to live feed...`,
          source: "System"
        },
      ]
    } satisfies DistrictNewsBoard
  ])
) as Record<string, DistrictNewsBoard>;
