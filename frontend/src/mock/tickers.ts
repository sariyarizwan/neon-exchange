import type { Ticker } from "@/types/ticker";

export const tickers: Ticker[] = [
  {
    id: "nvx",
    symbol: "NVX",
    fullName: "Nova Vect Systems",
    districtId: "chip-docks",
    archetype: "The Inventor",
    mood: "confident",
    regimeTags: ["calm", "choppy"],
    position: { x: 760, y: 880 },
    trend: "up",
    alliances: [
      { tickerId: "qntm", strength: "Core" },
      { tickerId: "flux", strength: "Strong" },
      { tickerId: "forge", strength: "Link" }
    ]
  },
  {
    id: "qntm",
    symbol: "QNTM",
    fullName: "Quantum Harbor Logic",
    districtId: "chip-docks",
    archetype: "The Architect",
    mood: "nervous",
    regimeTags: ["choppy"],
    position: { x: 980, y: 700 },
    trend: "flat",
    alliances: [
      { tickerId: "nvx", strength: "Core" },
      { tickerId: "mint", strength: "Strong" }
    ]
  },
  {
    id: "sphr",
    symbol: "SPHR",
    fullName: "Sphere Optics Grid",
    districtId: "chip-docks",
    archetype: "The Watcher",
    mood: "erratic",
    regimeTags: ["storm"],
    position: { x: 1110, y: 1010 },
    trend: "down",
    alliances: [
      { tickerId: "beam", strength: "Strong" },
      { tickerId: "qntm", strength: "Link" }
    ]
  },
  {
    id: "mint",
    symbol: "MINT",
    fullName: "Mintline Capital",
    districtId: "bank-towers",
    archetype: "The Broker",
    mood: "confident",
    regimeTags: ["choppy", "storm"],
    position: { x: 2510, y: 680 },
    trend: "up",
    alliances: [
      { tickerId: "vault", strength: "Core" },
      { tickerId: "qntm", strength: "Strong" }
    ]
  },
  {
    id: "vault",
    symbol: "VLT",
    fullName: "Vault Meridian Bank",
    districtId: "bank-towers",
    archetype: "The Titan",
    mood: "nervous",
    regimeTags: ["calm", "choppy"],
    position: { x: 2800, y: 860 },
    trend: "flat",
    alliances: [
      { tickerId: "mint", strength: "Core" },
      { tickerId: "shld", strength: "Strong" }
    ]
  },
  {
    id: "shld",
    symbol: "SHLD",
    fullName: "Shield Underwrite",
    districtId: "bank-towers",
    archetype: "The Insurer",
    mood: "erratic",
    regimeTags: ["storm"],
    position: { x: 2920, y: 540 },
    trend: "down",
    alliances: [
      { tickerId: "vault", strength: "Strong" },
      { tickerId: "pulse", strength: "Link" }
    ]
  },
  {
    id: "flux",
    symbol: "FLUX",
    fullName: "Flux Barrel Works",
    districtId: "energy-yard",
    archetype: "The Refiner",
    mood: "confident",
    regimeTags: ["storm", "choppy"],
    position: { x: 5660, y: 840 },
    trend: "up",
    alliances: [
      { tickerId: "grid", strength: "Core" },
      { tickerId: "nvx", strength: "Strong" }
    ]
  },
  {
    id: "grid",
    symbol: "GRID",
    fullName: "Gridline Utilities",
    districtId: "energy-yard",
    archetype: "The Stabilizer",
    mood: "nervous",
    regimeTags: ["calm", "storm"],
    position: { x: 5990, y: 730 },
    trend: "flat",
    alliances: [
      { tickerId: "flux", strength: "Core" },
      { tickerId: "spark", strength: "Strong" }
    ]
  },
  {
    id: "spark",
    symbol: "SPRK",
    fullName: "Spark Freight Fuel",
    districtId: "energy-yard",
    archetype: "The Runner",
    mood: "erratic",
    regimeTags: ["storm"],
    position: { x: 6090, y: 1080 },
    trend: "up",
    alliances: [
      { tickerId: "grid", strength: "Strong" },
      { tickerId: "forge", strength: "Link" }
    ]
  },
  {
    id: "forge",
    symbol: "FRGE",
    fullName: "Forge Atlas Robotics",
    districtId: "industrials-foundry",
    archetype: "The Builder",
    mood: "confident",
    regimeTags: ["calm"],
    position: { x: 1140, y: 2790 },
    trend: "up",
    alliances: [
      { tickerId: "haul", strength: "Core" },
      { tickerId: "nvx", strength: "Link" }
    ]
  },
  {
    id: "haul",
    symbol: "HAUL",
    fullName: "Haulstone Logistics",
    districtId: "industrials-foundry",
    archetype: "The Carrier",
    mood: "nervous",
    regimeTags: ["choppy"],
    position: { x: 1400, y: 3010 },
    trend: "flat",
    alliances: [
      { tickerId: "forge", strength: "Core" },
      { tickerId: "cart", strength: "Strong" }
    ]
  },
  {
    id: "bolt",
    symbol: "BOLT",
    fullName: "Boltline Machine Co.",
    districtId: "industrials-foundry",
    archetype: "The Mechanic",
    mood: "erratic",
    regimeTags: ["storm", "choppy"],
    position: { x: 1520, y: 2670 },
    trend: "down",
    alliances: [
      { tickerId: "forge", strength: "Strong" },
      { tickerId: "wave", strength: "Link" }
    ]
  },
  {
    id: "cart",
    symbol: "CART",
    fullName: "Cartel Retail Loop",
    districtId: "consumer-strip",
    archetype: "The Crowd",
    mood: "confident",
    regimeTags: ["calm", "choppy"],
    position: { x: 3340, y: 2470 },
    trend: "up",
    alliances: [
      { tickerId: "luxe", strength: "Strong" },
      { tickerId: "haul", strength: "Strong" }
    ]
  },
  {
    id: "luxe",
    symbol: "LUXE",
    fullName: "Luxe District Goods",
    districtId: "consumer-strip",
    archetype: "The Influencer",
    mood: "nervous",
    regimeTags: ["choppy"],
    position: { x: 3590, y: 2370 },
    trend: "flat",
    alliances: [
      { tickerId: "cart", strength: "Strong" },
      { tickerId: "beam", strength: "Link" }
    ]
  },
  {
    id: "bite",
    symbol: "BITE",
    fullName: "Biteshift Hospitality",
    districtId: "consumer-strip",
    archetype: "The Host",
    mood: "erratic",
    regimeTags: ["storm"],
    position: { x: 3750, y: 2740 },
    trend: "down",
    alliances: [
      { tickerId: "cart", strength: "Link" },
      { tickerId: "coin", strength: "Strong" }
    ]
  },
  {
    id: "coin",
    symbol: "COIN",
    fullName: "Coin Circuit Holdings",
    districtId: "crypto-alley",
    archetype: "The Smuggler",
    mood: "confident",
    regimeTags: ["storm", "choppy"],
    position: { x: 6070, y: 2420 },
    trend: "up",
    alliances: [
      { tickerId: "hash", strength: "Core" },
      { tickerId: "bite", strength: "Strong" }
    ]
  },
  {
    id: "hash",
    symbol: "HASH",
    fullName: "Hashrail Networks",
    districtId: "crypto-alley",
    archetype: "The Validator",
    mood: "nervous",
    regimeTags: ["storm"],
    position: { x: 6320, y: 2300 },
    trend: "flat",
    alliances: [
      { tickerId: "coin", strength: "Core" },
      { tickerId: "beam", strength: "Strong" }
    ]
  },
  {
    id: "mintx",
    symbol: "MNTX",
    fullName: "MintX Transfer Lab",
    districtId: "crypto-alley",
    archetype: "The Router",
    mood: "erratic",
    regimeTags: ["choppy", "storm"],
    position: { x: 6400, y: 2620 },
    trend: "down",
    alliances: [
      { tickerId: "coin", strength: "Strong" },
      { tickerId: "pulse", strength: "Link" }
    ]
  },
  {
    id: "helx",
    symbol: "HELX",
    fullName: "Helix Bioware",
    districtId: "bio-dome",
    archetype: "The Gene Weaver",
    mood: "confident",
    regimeTags: ["calm"],
    position: { x: 2590, y: 3840 },
    trend: "up",
    alliances: [
      { tickerId: "pulse", strength: "Core" },
      { tickerId: "vault", strength: "Link" }
    ]
  },
  {
    id: "pulse",
    symbol: "PLS",
    fullName: "Pulse Device Array",
    districtId: "bio-dome",
    archetype: "The Healer",
    mood: "nervous",
    regimeTags: ["calm", "choppy"],
    position: { x: 2860, y: 3730 },
    trend: "flat",
    alliances: [
      { tickerId: "helx", strength: "Core" },
      { tickerId: "shld", strength: "Link" }
    ]
  },
  {
    id: "viva",
    symbol: "VIVA",
    fullName: "Viva Culture Labs",
    districtId: "bio-dome",
    archetype: "The Synthesist",
    mood: "erratic",
    regimeTags: ["storm", "choppy"],
    position: { x: 2920, y: 4050 },
    trend: "down",
    alliances: [
      { tickerId: "helx", strength: "Strong" },
      { tickerId: "wave", strength: "Link" }
    ]
  },
  {
    id: "beam",
    symbol: "BEAM",
    fullName: "Beamline Media Grid",
    districtId: "comms-neon-ridge",
    archetype: "The Broadcaster",
    mood: "confident",
    regimeTags: ["choppy"],
    position: { x: 5730, y: 3790 },
    trend: "up",
    alliances: [
      { tickerId: "wave", strength: "Core" },
      { tickerId: "hash", strength: "Strong" }
    ]
  },
  {
    id: "wave",
    symbol: "WAVE",
    fullName: "Wavefront Telecom",
    districtId: "comms-neon-ridge",
    archetype: "The Relay",
    mood: "nervous",
    regimeTags: ["calm", "choppy"],
    position: { x: 5980, y: 3950 },
    trend: "flat",
    alliances: [
      { tickerId: "beam", strength: "Core" },
      { tickerId: "bolt", strength: "Link" }
    ]
  }
];
