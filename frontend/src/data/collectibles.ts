export type DataChip = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  label: string;
  insight: string;
  collected: boolean; // runtime state, starts false
};

export const dataChips: DataChip[] = [
  // --- Chip Docks (center 630, 570) ---
  {
    id: "chip-cd-1", districtId: "chip-docks", x: 480, y: 460,
    label: "Silicon Whisper",
    insight: "Sector rotation often starts in Tech before reaching Energy.",
    collected: false,
  },
  {
    id: "chip-cd-2", districtId: "chip-docks", x: 750, y: 680,
    label: "Fab Node Log",
    insight: "Chip supply constraints lead semiconductor price moves by 3 weeks.",
    collected: false,
  },
  {
    id: "chip-cd-3", districtId: "chip-docks", x: 560, y: 380,
    label: "Pre-Open Signal",
    insight: "Pre-market volume spikes in Tech predict intraday volatility with 72% accuracy.",
    collected: false,
  },

  // --- Bank Towers (center 1590, 570) ---
  {
    id: "chip-bt-1", districtId: "bank-towers", x: 1450, y: 470,
    label: "Dark Pool Trace",
    insight: "Large block trades in Financials often precede index rebalancing events.",
    collected: false,
  },
  {
    id: "chip-bt-2", districtId: "bank-towers", x: 1700, y: 650,
    label: "Rate Rumor",
    insight: "Interest rate expectations drive bank stock correlations more than earnings.",
    collected: false,
  },
  {
    id: "chip-bt-3", districtId: "bank-towers", x: 1550, y: 380,
    label: "Mirror Glass Intel",
    insight: "Financial sector drawdowns often signal broader market corrections within 5 days.",
    collected: false,
  },

  // --- Energy Yard (center 2610, 570) ---
  {
    id: "chip-ey-1", districtId: "energy-yard", x: 2480, y: 460,
    label: "Pipeline Heat",
    insight: "Energy stocks lead inflation expectations by one quarter.",
    collected: false,
  },
  {
    id: "chip-ey-2", districtId: "energy-yard", x: 2750, y: 700,
    label: "Refinery Memo",
    insight: "Crude inventory reports move Energy more than earnings surprises.",
    collected: false,
  },
  {
    id: "chip-ey-3", districtId: "energy-yard", x: 2600, y: 380,
    label: "Load Forecast",
    insight: "Seasonal demand patterns in Energy repeat with 80% fidelity year over year.",
    collected: false,
  },

  // --- Crypto Alley (center 3670, 570) ---
  {
    id: "chip-ca-1", districtId: "crypto-alley", x: 3540, y: 450,
    label: "Token Runner",
    insight: "High volatility in Crypto often correlates with low volume in Healthcare.",
    collected: false,
  },
  {
    id: "chip-ca-2", districtId: "crypto-alley", x: 3800, y: 680,
    label: "Neon Rain Log",
    insight: "Crypto weekend volume predicts Monday open direction for tech equities.",
    collected: false,
  },
  {
    id: "chip-ca-3", districtId: "crypto-alley", x: 3650, y: 360,
    label: "Payment Rail",
    insight: "Stablecoin flows into exchanges precede altcoin rallies by 48 hours.",
    collected: false,
  },

  // --- Industrials Foundry (center 660, 1450) ---
  {
    id: "chip-if-1", districtId: "industrials-foundry", x: 520, y: 1360,
    label: "Robotic Yard Key",
    insight: "Consumer sentiment leads industrial output by 2 quarters.",
    collected: false,
  },
  {
    id: "chip-if-2", districtId: "industrials-foundry", x: 780, y: 1550,
    label: "Conveyor Data",
    insight: "PMI readings above 55 historically correlate with industrial stock outperformance.",
    collected: false,
  },
  {
    id: "chip-if-3", districtId: "industrials-foundry", x: 640, y: 1280,
    label: "Forge Blueprint",
    insight: "Capex announcements in Industrials lag consumer spending trends by 6 months.",
    collected: false,
  },

  // --- Consumer Strip (center 1760, 1450) ---
  {
    id: "chip-cs-1", districtId: "consumer-strip", x: 1600, y: 1340,
    label: "Retail Buzz",
    insight: "Retail foot traffic data predicts consumer earnings surprises with 65% hit rate.",
    collected: false,
  },
  {
    id: "chip-cs-2", districtId: "consumer-strip", x: 1900, y: 1560,
    label: "Luxury Screen",
    insight: "Luxury goods stocks diverge from mass-market consumer stocks during rate hikes.",
    collected: false,
  },
  {
    id: "chip-cs-3", districtId: "consumer-strip", x: 1740, y: 1250,
    label: "Sentiment Pulse",
    insight: "Social media sentiment shifts in Consumer lead price action by 2 trading days.",
    collected: false,
  },

  // --- Bio Dome (center 2860, 1450) ---
  {
    id: "chip-bd-1", districtId: "bio-dome", x: 2740, y: 1360,
    label: "Gene Vault Key",
    insight: "FDA approval cycles create predictable volatility windows in Healthcare.",
    collected: false,
  },
  {
    id: "chip-bd-2", districtId: "bio-dome", x: 2980, y: 1560,
    label: "Med-Device Grid",
    insight: "Biotech-pharma M&A activity clusters around patent expiry timelines.",
    collected: false,
  },
  {
    id: "chip-bd-3", districtId: "bio-dome", x: 2850, y: 1280,
    label: "Defensive Flow",
    insight: "Healthcare outperforms during late-cycle markets as a classic defensive rotation.",
    collected: false,
  },

  // --- Comms Neon Ridge (center 3920, 1450) ---
  {
    id: "chip-cnr-1", districtId: "comms-neon-ridge", x: 3780, y: 1360,
    label: "Fiber Spine",
    insight: "Telecom capex cycles predict infrastructure stock moves 2 quarters ahead.",
    collected: false,
  },
  {
    id: "chip-cnr-2", districtId: "comms-neon-ridge", x: 4060, y: 1560,
    label: "Tower Relay",
    insight: "Spectrum auction results create multi-month trends in carrier stocks.",
    collected: false,
  },
  {
    id: "chip-cnr-3", districtId: "comms-neon-ridge", x: 3900, y: 1280,
    label: "Latency Racer",
    insight: "Cross-sector correlation between Telecom and Tech rises during market stress.",
    collected: false,
  },
];
