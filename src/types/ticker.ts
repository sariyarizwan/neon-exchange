import type { Point } from "@/lib/world";
import type { RegimeTag } from "@/types/district";

export type TickerMood = "confident" | "nervous" | "erratic";
export type TrendDirection = "up" | "down" | "flat";
export type AllianceStrength = "Link" | "Strong" | "Core";

export type TickerAlliance = {
  tickerId: string;
  strength: AllianceStrength;
};

export type Ticker = {
  id: string;
  symbol: string;
  fullName: string;
  districtId: string;
  archetype: string;
  mood: TickerMood;
  regimeTags: RegimeTag[];
  position: Point;
  trend: TrendDirection;
  alliances: TickerAlliance[];
};
