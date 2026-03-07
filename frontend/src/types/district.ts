import type { Point } from "@/lib/world";

export type RegimeTag = "calm" | "choppy" | "storm";
export type TrafficLevel = "Low" | "Med" | "High";

export type District = {
  id: string;
  name: string;
  sector: string;
  center: Point;
  polygon: Point[];
  regime: RegimeTag;
  traffic: TrafficLevel;
  accent: string;
  summary: string;
};
