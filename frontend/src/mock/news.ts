import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import type { DistrictNewsBoard, TickerNewsEntry } from "@/types/news";

export const tickerNews: Record<string, TickerNewsEntry> = Object.fromEntries(
  tickers.map((ticker, index) => [
    ticker.id,
    {
      tickerId: ticker.id,
      summary: `${ticker.symbol} is pulsing through ${ticker.fullName} with ${ticker.mood} tape and ${ticker.trend} bias.`,
      lines: [
        {
          id: `${ticker.id}-line-1`,
          text: `${ticker.symbol} sees fresh order clustering around the ${ticker.archetype.toLowerCase()} setup.`,
          source: "Mock Wire"
        },
        {
          id: `${ticker.id}-line-2`,
          text: `${ticker.mood} sentiment is spreading into linked names across ${ticker.districtId.replaceAll("-", " ")}.`,
          source: "Street Scope"
        },
        {
          id: `${ticker.id}-line-3`,
          text: `Scenario desk flags ${ticker.trend === "up" ? "continuation pressure" : ticker.trend === "down" ? "mean-revert stress" : "range compression"} for the next cycle.`,
          source: "Scene Desk"
        }
      ]
    } satisfies TickerNewsEntry
  ])
) as Record<string, TickerNewsEntry>;

export const districtNewsBoards: Record<string, DistrictNewsBoard> = Object.fromEntries(
  districts.map((district, index) => {
    const districtTickers = tickers.filter((ticker) => ticker.districtId === district.id).slice(0, 3);
    return [
      district.id,
      {
        districtId: district.id,
        lines: [
          {
            id: `${district.id}-headline-1`,
            text: `${district.name} traffic brightens as ${districtTickers[0]?.symbol ?? district.sector} draws late-session attention.`,
            source: "District Bulletin"
          },
          {
            id: `${district.id}-headline-2`,
            text: `${district.sector} rails show ${district.regime} conditions with ${district.traffic.toLowerCase()} crowd flow tonight.`,
            source: "Mock Wire"
          },
          {
            id: `${district.id}-headline-3`,
            text: `${districtTickers[1]?.symbol ?? "Watchlist"} alliances ripple into nearby blocks under the neon canopy.`,
            source: "Night Desk"
          },
          {
            id: `${district.id}-headline-4`,
            text: `${districtTickers[2]?.symbol ?? district.name} is on rumor watch for the next scene cycle.`,
            source: "Street Scope"
          }
        ]
      } satisfies DistrictNewsBoard
    ];
  })
) as Record<string, DistrictNewsBoard>;

// TODO: replace this mock feed with live Gemini/market news events keyed by ticker and district.
