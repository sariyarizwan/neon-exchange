import type { District } from "@/types/district";

const poly = (cx: number, cy: number, offsets: Array<[number, number]>) =>
  offsets.map(([dx, dy]) => ({ x: cx + dx, y: cy + dy }));

export const districts: District[] = [
  {
    id: "chip-docks",
    name: "CHIP DOCKS",
    sector: "Tech",
    center: { x: 630, y: 570 },
    polygon: poly(630, 570, [
      [-380, -180],
      [-180, -280],
      [120, -260],
      [360, -120],
      [300, 190],
      [-40, 250],
      [-320, 140]
    ]),
    regime: "calm",
    traffic: "Med",
    accent: "#33F5FF",
    summary: "Prototype fabs, silicon smugglers, and pre-open whispers."
  },
  {
    id: "bank-towers",
    name: "BANK TOWERS",
    sector: "Financials",
    center: { x: 1590, y: 570 },
    polygon: poly(1590, 570, [
      [-340, -200],
      [-100, -300],
      [220, -240],
      [380, -40],
      [300, 220],
      [40, 320],
      [-280, 150]
    ]),
    regime: "choppy",
    traffic: "High",
    accent: "#FFB84D",
    summary: "Dark pools glow under mirror glass and rate rumors."
  },
  {
    id: "energy-yard",
    name: "ENERGY YARD",
    sector: "Energy",
    center: { x: 2610, y: 570 },
    polygon: poly(2610, 570, [
      [-420, -140],
      [-180, -300],
      [120, -280],
      [360, -120],
      [420, 120],
      [160, 320],
      [-260, 220]
    ]),
    regime: "storm",
    traffic: "High",
    accent: "#B7FF3C",
    summary: "Pipeline heat, refinery haze, and volatile load forecasts."
  },
  {
    id: "industrials-foundry",
    name: "INDUSTRIALS FOUNDRY",
    sector: "Industrials",
    center: { x: 660, y: 1450 },
    polygon: poly(660, 1450, [
      [-440, -180],
      [-120, -340],
      [240, -260],
      [420, -30],
      [320, 240],
      [0, 320],
      [-340, 180]
    ]),
    regime: "calm",
    traffic: "Low",
    accent: "#7DD3FC",
    summary: "Robotic yards hammer out the city's slow-cycle moves."
  },
  {
    id: "consumer-strip",
    name: "CONSUMER STRIP",
    sector: "Consumer",
    center: { x: 1760, y: 1450 },
    polygon: poly(1760, 1450, [
      [-520, -220],
      [-180, -360],
      [220, -340],
      [540, -80],
      [460, 240],
      [120, 380],
      [-300, 300]
    ]),
    regime: "choppy",
    traffic: "High",
    accent: "#FF3DF2",
    summary: "The central hub. Retail buzz, luxury screens, and mass sentiment."
  },
  {
    id: "crypto-alley",
    name: "CRYPTO ALLEY",
    sector: "Crypto / FinTech",
    center: { x: 3670, y: 570 },
    polygon: poly(3670, 570, [
      [-380, -260],
      [-80, -340],
      [220, -240],
      [420, 10],
      [260, 300],
      [-40, 360],
      [-340, 140]
    ]),
    regime: "storm",
    traffic: "Med",
    accent: "#33F5FF",
    summary: "Token runners and payment rails under permanent neon rain."
  },
  {
    id: "bio-dome",
    name: "BIO DOME",
    sector: "Healthcare",
    center: { x: 2860, y: 1450 },
    polygon: poly(2860, 1450, [
      [-360, -240],
      [-80, -360],
      [220, -260],
      [380, -20],
      [300, 260],
      [-10, 360],
      [-300, 120]
    ]),
    regime: "calm",
    traffic: "Low",
    accent: "#B7FF3C",
    summary: "Gene vaults, med-device grids, and silent defensive flows."
  },
  {
    id: "comms-neon-ridge",
    name: "COMMS NEON RIDGE",
    sector: "Telecom / Comms",
    center: { x: 3920, y: 1450 },
    polygon: poly(3920, 1450, [
      [-480, -160],
      [-180, -320],
      [180, -300],
      [420, -80],
      [380, 220],
      [80, 360],
      [-320, 260]
    ]),
    regime: "choppy",
    traffic: "Med",
    accent: "#FF3DF2",
    summary: "Fiber spines, tower relays, and rumor latency races."
  }
];

export const districtConnections: Array<[string, string]> = [
  ["chip-docks", "bank-towers"],
  ["chip-docks", "industrials-foundry"],
  ["bank-towers", "consumer-strip"],
  ["bank-towers", "energy-yard"],
  ["consumer-strip", "bio-dome"],
  ["consumer-strip", "crypto-alley"],
  ["industrials-foundry", "bio-dome"],
  ["energy-yard", "crypto-alley"],
  ["crypto-alley", "comms-neon-ridge"],
  ["bio-dome", "comms-neon-ridge"],
  ["consumer-strip", "comms-neon-ridge"]
];
