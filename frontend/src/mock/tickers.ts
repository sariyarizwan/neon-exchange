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
    position: { x: 490, y: 510 },
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
    position: { x: 710, y: 330 },
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
    position: { x: 840, y: 640 },
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
    position: { x: 1420, y: 490 },
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
    position: { x: 1710, y: 670 },
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
    position: { x: 1830, y: 350 },
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
    position: { x: 2400, y: 470 },
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
    position: { x: 2730, y: 360 },
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
    position: { x: 2830, y: 710 },
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
    position: { x: 480, y: 1380 },
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
    position: { x: 740, y: 1600 },
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
    position: { x: 860, y: 1260 },
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
    position: { x: 1600, y: 1370 },
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
    position: { x: 1850, y: 1270 },
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
    position: { x: 2010, y: 1640 },
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
    position: { x: 3500, y: 520 },
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
    position: { x: 3750, y: 400 },
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
    position: { x: 3830, y: 720 },
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
    position: { x: 2710, y: 1380 },
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
    position: { x: 2980, y: 1270 },
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
    position: { x: 3040, y: 1590 },
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
    position: { x: 3750, y: 1340 },
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
    position: { x: 4000, y: 1500 },
    trend: "flat",
    alliances: [
      { tickerId: "beam", strength: "Core" },
      { tickerId: "bolt", strength: "Link" }
    ]
  }
];
