export type TutorialStepDef = {
  title: string;
  body: string;
  spotlightTarget: string | null;
  cardPosition: "center" | "right" | "left";
};

export const TUTORIAL_STEPS: readonly TutorialStepDef[] = [
  {
    title: "WELCOME TO NEON EXCHANGE",
    body: "This city is alive with the stock market. Sectors are districts. Stocks are NPCs. Volatility is weather. Liquidity is traffic.\n\nLet's show you around.",
    spotlightTarget: null,
    cardPosition: "center",
  },
  {
    title: "MOVING AROUND",
    body: "Use WASD or Arrow Keys to walk through the city. Hold Shift to sprint.\n\nDrag the canvas to pan the camera. Use zoom buttons on the minimap.",
    spotlightTarget: null,
    cardPosition: "center",
  },
  {
    title: "DISTRICTS = MARKET SECTORS",
    body: "The city has 8 districts, each representing a market sector: Tech, Finance, Energy, Crypto, and more.\n\nOpen the Districts panel (top-left) to see them all and teleport.",
    spotlightTarget: "districts-button",
    cardPosition: "right",
  },
  {
    title: "STOCKS ARE NPCs",
    body: "Each character in the city represents a stock. Click on one to see its data.\n\nTheir mood shows sentiment: Confident = bullish, Nervous = bearish, Erratic = high volatility.",
    spotlightTarget: null,
    cardPosition: "center",
  },
  {
    title: "READ THE ENVIRONMENT",
    body: "Weather = Volatility: Clear (calm) \u2192 Rain (choppy) \u2192 Storm (high vol) \u2192 Fog (uncertain)\n\nTraffic = Liquidity: Empty streets (thin) \u2192 Gridlock (deep, tight spreads)",
    spotlightTarget: null,
    cardPosition: "center",
  },
  {
    title: "GATHER INTELLIGENCE",
    body: "The right panel has three tabs:\n\n\u2022 Scenarios \u2014 AI-generated market hypotheses\n\u2022 Alliances \u2014 Correlated stock pairs\n\u2022 Evidence \u2014 Timeline of notable events",
    spotlightTarget: "right-panel",
    cardPosition: "left",
  },
  {
    title: "YOUR TOOLKIT",
    body: "/ \u2014 Search for any ticker\nQ \u2014 Open quest log\nL \u2014 Legend (weather/traffic guide)\nEsc \u2014 Clear selection\n\nVisit newsstands for district news. Use chat to ask the AI about markets.",
    spotlightTarget: null,
    cardPosition: "center",
  },
] as const;
