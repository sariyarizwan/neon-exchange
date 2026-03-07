import { tickers } from "@/mock/tickers";
import type { Scenario } from "@/types/scenario";
import type { Ticker } from "@/types/ticker";

const createScenarios = (ticker: Ticker): Scenario[] => [
  {
    id: `${ticker.id}-continuation`,
    title: "Continuation",
    probability: ticker.mood === "confident" ? "High" : "Med",
    summary: `${ticker.symbol} keeps its current tape rhythm as ${ticker.archetype.toLowerCase()} flow pulls neighbors in the same direction.`,
    confirmSignals: [
      "District traffic expands through the second watch",
      "Related tickers print aligned glow pulses",
      "Rumor velocity stays beneath panic threshold"
    ],
    invalidateSignals: [
      "Cross-district spread widens without follow-through",
      "Volume spikes vanish at the district boundary",
      "Mood tag flips from confident to nervous"
    ],
    rippleChips: [ticker.symbol, ticker.districtId.replaceAll("-", " ").toUpperCase(), "Order Flow"]
  },
  {
    id: `${ticker.id}-mean-reversion`,
    title: "Mean Reversion",
    probability: ticker.mood === "erratic" ? "High" : "Med",
    summary: `${ticker.symbol} exhausts a hot move and rotates back toward the district baseline while allied names absorb the overextension.`,
    confirmSignals: [
      "Node glow compresses while labels stay active",
      "District status slips from storm to choppy",
      "Two allied tickers fail to confirm the breakout"
    ],
    invalidateSignals: [
      "Fresh rumor poster intensifies the district tint",
      "Minimap corridor brightens toward another hub",
      "Institutional lane dashes accelerate instead of cool"
    ],
    rippleChips: ["Rebalance", ticker.symbol, "Cooling Tape"]
  },
  {
    id: `${ticker.id}-shock-event`,
    title: "Shock Event",
    probability: ticker.regimeTags.includes("storm") ? "High" : "Low",
    summary: `${ticker.symbol} catches an external catalyst and throws a fast citywide pulse through connected districts.`,
    confirmSignals: [
      "Storm overlay ignites inside the district perimeter",
      "Evidence timeline adds clustered alerts",
      "Road traffic streaks intensify across two or more rails"
    ],
    invalidateSignals: [
      "Home hub liquidity stabilizes within one cycle",
      "Alliance lines fade instead of brighten",
      "Volume imbalance resolves without secondary breakout"
    ],
    rippleChips: ["Shock", ticker.symbol, "District Spillover"]
  }
];

export const scenariosByTicker = Object.fromEntries(tickers.map((ticker) => [ticker.id, createScenarios(ticker)])) as Record<
  string,
  Scenario[]
>;

export const getScenariosForTicker = (ticker: Ticker | null | undefined) => (ticker ? scenariosByTicker[ticker.id] ?? [] : []);
