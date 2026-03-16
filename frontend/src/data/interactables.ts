export type InteractableType =
  | "terminal"
  | "scanner"
  | "news-board"
  | "billboard-screen"
  | "vending-machine"
  | "power-node"
  | "control-console"
  | "data-kiosk"
  | "hologram-totem"
  | "transit-gate"
  | "cargo-gate"
  | "sentiment-screen"
  | "lab-scanner"
  | "reactor-console"
  | "route-map"
  | "machine-console";

export type InteractableClickEffect =
  | { type: "pulse"; color: string; radius: number }
  | { type: "panel"; title: string; lines: string[] }
  | { type: "district-activate"; effectName: string }
  | { type: "reveal"; message: string };

export type DistrictInteractable = {
  id: string;
  districtId: string;
  type: InteractableType;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
  label: string;
  hoverLabel: string;
  clickEffect: InteractableClickEffect;
  dialogueOnClick: string;
  glowRadius: number;
};

// --- Crypto Alley ---
// center (3670, 570), zone 980x740, streetInset 88
const cryptoAlleyInteractables: readonly DistrictInteractable[] = [
  {
    id: "crypto-hack-terminal",
    districtId: "crypto-alley",
    type: "terminal",
    x: 3620,
    y: 480,
    width: 44,
    height: 38,
    accent: "#f59e0b",
    label: "Hack Terminal",
    hoverLabel: "Inspect encrypted terminal",
    clickEffect: {
      type: "panel",
      title: "Crypto Hack Terminal",
      lines: [
        ">> Decryption in progress...",
        "BTC sentiment: VOLATILE",
        "On-chain whale transfers detected",
        "Hash rate trending upward +12%",
      ],
    },
    dialogueOnClick:
      "The terminal flickers with encrypted ledger data. Whale wallets are on the move.",
    glowRadius: 28,
  },
  {
    id: "crypto-rumor-vending",
    districtId: "crypto-alley",
    type: "vending-machine",
    x: 3720,
    y: 520,
    width: 36,
    height: 48,
    accent: "#f59e0b",
    label: "Rumor Vending Machine",
    hoverLabel: "Buy the latest crypto rumors",
    clickEffect: {
      type: "reveal",
      message:
        "RUMOR: A major exchange is about to delist three low-cap tokens. Smart money is exiting.",
    },
    dialogueOnClick:
      "A coin drops. The screen reads: 'One rumor dispensed. Verify before you trade.'",
    glowRadius: 22,
  },
  {
    id: "crypto-neon-billboard",
    districtId: "crypto-alley",
    type: "billboard-screen",
    x: 3680,
    y: 640,
    width: 56,
    height: 32,
    accent: "#f59e0b",
    label: "Neon Billboard",
    hoverLabel: "Read the district feed",
    clickEffect: {
      type: "panel",
      title: "Crypto Alley Bulletin",
      lines: [
        "LIVE: DeFi TVL surges past $180B",
        "Stablecoin peg wobble detected",
        "New governance vote: Protocol upgrade v4.2",
        "Miner revenue up 8% this cycle",
      ],
    },
    dialogueOnClick:
      "Neon headlines scroll across the billboard. The alley never sleeps.",
    glowRadius: 34,
  },
  {
    id: "crypto-unstable-node",
    districtId: "crypto-alley",
    type: "power-node",
    x: 3600,
    y: 600,
    width: 30,
    height: 30,
    accent: "#f59e0b",
    label: "Unstable Data Node",
    hoverLabel: "Scan unstable node",
    clickEffect: {
      type: "pulse",
      color: "#f59e0b",
      radius: 60,
    },
    dialogueOnClick:
      "The node sparks erratically. Blockchain fork risk is elevated in this sector.",
    glowRadius: 40,
  },
] as const;

// --- Industrials Foundry ---
// center (660, 1450), zone 920x700, streetInset 86
const industrialsFoundryInteractables: readonly DistrictInteractable[] = [
  {
    id: "industrial-machine-console",
    districtId: "industrials-foundry",
    type: "machine-console",
    x: 600,
    y: 1380,
    width: 46,
    height: 40,
    accent: "#64748b",
    label: "Machine Console",
    hoverLabel: "Check machine status",
    clickEffect: {
      type: "panel",
      title: "Foundry Machine Console",
      lines: [
        "Production line A: OPERATIONAL",
        "Defect rate: 0.3% (nominal)",
        "Steel output: 14,200 tons/day",
        "Maintenance due in 48 hours",
      ],
    },
    dialogueOnClick:
      "Gears grind steadily. The foundry machines report nominal output across all lines.",
    glowRadius: 24,
  },
  {
    id: "industrial-conveyor-monitor",
    districtId: "industrials-foundry",
    type: "control-console",
    x: 720,
    y: 1420,
    width: 40,
    height: 36,
    accent: "#64748b",
    label: "Conveyor Monitor",
    hoverLabel: "Inspect conveyor throughput",
    clickEffect: {
      type: "panel",
      title: "Conveyor Throughput",
      lines: [
        "Belt speed: 2.4 m/s",
        "Throughput: 98.7% capacity",
        "Bottleneck: Assembly Stage 3",
        "Estimated daily yield: +3.1%",
      ],
    },
    dialogueOnClick:
      "The conveyor hums. A slight bottleneck at Stage 3, but yields are climbing.",
    glowRadius: 20,
  },
  {
    id: "industrial-warehouse-terminal",
    districtId: "industrials-foundry",
    type: "terminal",
    x: 680,
    y: 1520,
    width: 42,
    height: 38,
    accent: "#64748b",
    label: "Warehouse Terminal",
    hoverLabel: "Access warehouse inventory",
    clickEffect: {
      type: "reveal",
      message:
        "ALERT: Raw material stockpile at 82% capacity. Supply chain delays expected from upstream vendors.",
    },
    dialogueOnClick:
      "Inventory logs scroll past. Stockpiles are high, but upstream delays loom.",
    glowRadius: 22,
  },
  {
    id: "industrial-production-board",
    districtId: "industrials-foundry",
    type: "news-board",
    x: 580,
    y: 1480,
    width: 50,
    height: 34,
    accent: "#64748b",
    label: "Production Status Board",
    hoverLabel: "Read production updates",
    clickEffect: {
      type: "panel",
      title: "Foundry Production Report",
      lines: [
        "Shift output: +4.8% vs target",
        "Safety incidents: 0 this week",
        "Order backlog: 12 days",
        "New contract signed: aerospace alloy",
      ],
    },
    dialogueOnClick:
      "The board flashes green. Production is ahead of schedule with zero safety incidents.",
    glowRadius: 26,
  },
] as const;

// --- Energy Yard ---
// center (2610, 570), zone 980x700, streetInset 86
const energyYardInteractables: readonly DistrictInteractable[] = [
  {
    id: "energy-reactor-console",
    districtId: "energy-yard",
    type: "reactor-console",
    x: 2560,
    y: 480,
    width: 48,
    height: 42,
    accent: "#22c55e",
    label: "Reactor Console",
    hoverLabel: "Monitor reactor output",
    clickEffect: {
      type: "panel",
      title: "Reactor Status",
      lines: [
        "Core temp: 3,420K (stable)",
        "Power output: 1.21 GW",
        "Coolant pressure: NOMINAL",
        "Next fuel cycle: 18 days",
      ],
    },
    dialogueOnClick:
      "The reactor hums with contained fury. Output is steady at 1.21 gigawatts.",
    glowRadius: 32,
  },
  {
    id: "energy-grid-monitor",
    districtId: "energy-yard",
    type: "control-console",
    x: 2660,
    y: 520,
    width: 42,
    height: 36,
    accent: "#22c55e",
    label: "Grid Monitor",
    hoverLabel: "Check grid distribution",
    clickEffect: {
      type: "panel",
      title: "Energy Grid Status",
      lines: [
        "Grid load: 78% capacity",
        "Peak demand forecast: 6PM",
        "Renewable mix: 34%",
        "Spot price: $42.10/MWh",
      ],
    },
    dialogueOnClick:
      "Energy prices are moderate. Renewables are contributing a third of the grid load today.",
    glowRadius: 24,
  },
  {
    id: "energy-pressure-valve",
    districtId: "energy-yard",
    type: "power-node",
    x: 2620,
    y: 640,
    width: 28,
    height: 28,
    accent: "#22c55e",
    label: "Pressure Valve",
    hoverLabel: "Inspect pressure valve",
    clickEffect: {
      type: "pulse",
      color: "#22c55e",
      radius: 50,
    },
    dialogueOnClick:
      "Steam hisses from the valve. Pressure readings are within safe parameters.",
    glowRadius: 20,
  },
  {
    id: "energy-display-tower",
    districtId: "energy-yard",
    type: "billboard-screen",
    x: 2540,
    y: 580,
    width: 36,
    height: 52,
    accent: "#22c55e",
    label: "Energy Display Tower",
    hoverLabel: "View energy market data",
    clickEffect: {
      type: "panel",
      title: "Energy Market Dashboard",
      lines: [
        "Crude oil: $78.40 (+1.2%)",
        "Natural gas: $3.18 (-0.8%)",
        "Solar index: 142.6 (+5.3%)",
        "Carbon credits: $28.50/ton",
      ],
    },
    dialogueOnClick:
      "The tower displays live commodity prices. Oil is up, but solar is surging.",
    glowRadius: 30,
  },
  {
    id: "energy-hazard-alarm",
    districtId: "energy-yard",
    type: "control-console",
    x: 2680,
    y: 610,
    width: 34,
    height: 30,
    accent: "#ef4444",
    label: "Hazard Alarm Panel",
    hoverLabel: "Check hazard warnings",
    clickEffect: {
      type: "district-activate",
      effectName: "hazard-sweep",
    },
    dialogueOnClick:
      "The alarm panel scans the yard. All systems green, but methane sensors are on high alert.",
    glowRadius: 26,
  },
] as const;

// --- Bank Towers ---
// center (1590, 570), zone 900x660, streetInset 76
const bankTowersInteractables: readonly DistrictInteractable[] = [
  {
    id: "bank-earnings-board",
    districtId: "bank-towers",
    type: "news-board",
    x: 1540,
    y: 490,
    width: 52,
    height: 36,
    accent: "#06b6d4",
    label: "Earnings Board",
    hoverLabel: "Read latest earnings reports",
    clickEffect: {
      type: "panel",
      title: "Bank Towers Earnings Feed",
      lines: [
        "JPM Q4: EPS $3.97 (beat by $0.22)",
        "GS revenue: $12.4B (+8% YoY)",
        "Regional bank index: -1.4%",
        "Fed funds rate hold expected",
      ],
    },
    dialogueOnClick:
      "Earnings are rolling in. The big banks are beating estimates, but regionals are lagging.",
    glowRadius: 28,
  },
  {
    id: "bank-sentiment-screen",
    districtId: "bank-towers",
    type: "sentiment-screen",
    x: 1640,
    y: 530,
    width: 40,
    height: 44,
    accent: "#06b6d4",
    label: "Sentiment Screen",
    hoverLabel: "Scan market sentiment",
    clickEffect: {
      type: "panel",
      title: "Financial Sentiment Index",
      lines: [
        "Bull/Bear ratio: 1.8 (bullish)",
        "VIX: 16.2 (low fear)",
        "Put/Call ratio: 0.72",
        "Institutional flow: NET BUYER",
      ],
    },
    dialogueOnClick:
      "The sentiment screen glows cyan. Institutions are buying and fear is low.",
    glowRadius: 26,
  },
  {
    id: "bank-terminal",
    districtId: "bank-towers",
    type: "terminal",
    x: 1600,
    y: 640,
    width: 44,
    height: 38,
    accent: "#06b6d4",
    label: "Bank Terminal",
    hoverLabel: "Access bank terminal",
    clickEffect: {
      type: "reveal",
      message:
        "INSIDER SIGNAL: Unusual options activity detected on a major bank stock. Large block trades incoming.",
    },
    dialogueOnClick:
      "The terminal beeps softly. Someone is placing very large options bets in this district.",
    glowRadius: 24,
  },
  {
    id: "bank-market-clock",
    districtId: "bank-towers",
    type: "hologram-totem",
    x: 1520,
    y: 570,
    width: 32,
    height: 50,
    accent: "#06b6d4",
    label: "Market Clock",
    hoverLabel: "View global market hours",
    clickEffect: {
      type: "panel",
      title: "Global Market Clock",
      lines: [
        "NYSE: OPEN (3h 22m remaining)",
        "LSE: CLOSED (next: 03:00 ET)",
        "TSE: CLOSED (next: 19:00 ET)",
        "ASX: PRE-MARKET (opens 18:00 ET)",
      ],
    },
    dialogueOnClick:
      "A holographic clock projects global exchange hours. New York is still trading.",
    glowRadius: 36,
  },
  {
    id: "bank-investment-kiosk",
    districtId: "bank-towers",
    type: "data-kiosk",
    x: 1660,
    y: 600,
    width: 38,
    height: 40,
    accent: "#06b6d4",
    label: "Investment Kiosk",
    hoverLabel: "Browse investment insights",
    clickEffect: {
      type: "panel",
      title: "Investment Research Kiosk",
      lines: [
        "Top pick: Financials (overweight)",
        "Yield curve: normalizing",
        "Credit spreads: tightening",
        "Analyst consensus: cautiously bullish",
      ],
    },
    dialogueOnClick:
      "The kiosk serves up analyst picks. Financials are the favored sector this quarter.",
    glowRadius: 22,
  },
] as const;

// --- Bio Dome ---
// center (2860, 1450), zone 920x700, streetInset 80
const bioDomeInteractables: readonly DistrictInteractable[] = [
  {
    id: "bio-lab-scanner",
    districtId: "bio-dome",
    type: "lab-scanner",
    x: 2810,
    y: 1380,
    width: 40,
    height: 40,
    accent: "#a855f7",
    label: "Lab Scanner",
    hoverLabel: "Scan biotech samples",
    clickEffect: {
      type: "pulse",
      color: "#a855f7",
      radius: 55,
    },
    dialogueOnClick:
      "The scanner whirs to life. Molecular analysis shows promising compound stability.",
    glowRadius: 30,
  },
  {
    id: "bio-trial-terminal",
    districtId: "bio-dome",
    type: "terminal",
    x: 2910,
    y: 1420,
    width: 44,
    height: 38,
    accent: "#a855f7",
    label: "Trial Terminal",
    hoverLabel: "Access clinical trial data",
    clickEffect: {
      type: "panel",
      title: "Clinical Trials Dashboard",
      lines: [
        "Phase III trial ONCO-447: ENROLLED",
        "Endpoint data due: 14 days",
        "Adverse events: within threshold",
        "FDA fast-track designation: PENDING",
      ],
    },
    dialogueOnClick:
      "Trial data streams across the screen. Phase III enrollment is complete. The market waits.",
    glowRadius: 24,
  },
  {
    id: "bio-specimen-chamber",
    districtId: "bio-dome",
    type: "scanner",
    x: 2870,
    y: 1520,
    width: 36,
    height: 46,
    accent: "#a855f7",
    label: "Specimen Chamber",
    hoverLabel: "Examine specimen chamber",
    clickEffect: {
      type: "reveal",
      message:
        "BREAKTHROUGH: Gene therapy vector shows 94% transfection efficiency in latest batch. Stock implications: significant.",
    },
    dialogueOnClick:
      "Through the glass, luminescent cultures pulse with engineered precision.",
    glowRadius: 28,
  },
  {
    id: "bio-research-display",
    districtId: "bio-dome",
    type: "billboard-screen",
    x: 2790,
    y: 1460,
    width: 48,
    height: 34,
    accent: "#a855f7",
    label: "Research Display",
    hoverLabel: "View research pipeline",
    clickEffect: {
      type: "panel",
      title: "Bio Dome Research Pipeline",
      lines: [
        "Active programs: 12",
        "Pre-clinical: 5 | Phase I: 3 | Phase II: 2 | Phase III: 2",
        "Patent filings this quarter: 8",
        "Collaboration deals: 3 new",
      ],
    },
    dialogueOnClick:
      "The pipeline display shows a healthy spread across all trial phases.",
    glowRadius: 26,
  },
  {
    id: "bio-ethics-console",
    districtId: "bio-dome",
    type: "control-console",
    x: 2920,
    y: 1490,
    width: 38,
    height: 36,
    accent: "#a855f7",
    label: "Ethics Console",
    hoverLabel: "Review ethics board status",
    clickEffect: {
      type: "district-activate",
      effectName: "ethics-review-pulse",
    },
    dialogueOnClick:
      "The ethics board console blinks. All current trials have cleared regulatory review.",
    glowRadius: 22,
  },
] as const;

// --- Comms Neon Ridge ---
// center (3920, 1450), zone 1040x760, streetInset 92
const commsNeonRidgeInteractables: readonly DistrictInteractable[] = [
  {
    id: "comms-shipment-board",
    districtId: "comms-neon-ridge",
    type: "news-board",
    x: 3870,
    y: 1380,
    width: 50,
    height: 34,
    accent: "#ec4899",
    label: "Shipment Board",
    hoverLabel: "Check shipment manifests",
    clickEffect: {
      type: "panel",
      title: "Comms Shipment Tracker",
      lines: [
        "Outbound signals: 2.4M packets/sec",
        "Satellite uplink: ACTIVE",
        "5G tower rollout: 78% complete",
        "Fiber expansion: on schedule",
      ],
    },
    dialogueOnClick:
      "Data shipments flow through the ridge. The comms backbone is holding strong.",
    glowRadius: 26,
  },
  {
    id: "comms-loading-terminal",
    districtId: "comms-neon-ridge",
    type: "terminal",
    x: 3970,
    y: 1420,
    width: 44,
    height: 38,
    accent: "#ec4899",
    label: "Loading Terminal",
    hoverLabel: "Access data loading bay",
    clickEffect: {
      type: "panel",
      title: "Data Loading Bay",
      lines: [
        "Queue depth: 142 jobs",
        "Avg latency: 12ms",
        "Bandwidth utilization: 67%",
        "Error rate: 0.02%",
      ],
    },
    dialogueOnClick:
      "The loading terminal processes data at blazing speed. Latency is impressively low.",
    glowRadius: 22,
  },
  {
    id: "comms-route-map",
    districtId: "comms-neon-ridge",
    type: "route-map",
    x: 3930,
    y: 1520,
    width: 46,
    height: 42,
    accent: "#ec4899",
    label: "Route Map",
    hoverLabel: "Trace signal routes",
    clickEffect: {
      type: "panel",
      title: "Signal Route Map",
      lines: [
        "Primary backbone: US-East <-> EU-West",
        "Latency: 68ms (optimal)",
        "Redundant paths: 3 active",
        "Congestion hotspot: Asia-Pacific node",
      ],
    },
    dialogueOnClick:
      "A holographic map traces signal routes across continents. One hotspot glows red.",
    glowRadius: 30,
  },
  {
    id: "comms-transit-scanner",
    districtId: "comms-neon-ridge",
    type: "scanner",
    x: 3850,
    y: 1470,
    width: 36,
    height: 36,
    accent: "#ec4899",
    label: "Transit Scanner",
    hoverLabel: "Scan data transit logs",
    clickEffect: {
      type: "reveal",
      message:
        "INTERCEPT: Anomalous traffic pattern detected — possible data exfiltration from a telecom subsidiary.",
    },
    dialogueOnClick:
      "The scanner flags an anomaly. Someone is routing unusual traffic through this node.",
    glowRadius: 24,
  },
  {
    id: "comms-cargo-gate",
    districtId: "comms-neon-ridge",
    type: "cargo-gate",
    x: 3990,
    y: 1490,
    width: 42,
    height: 48,
    accent: "#ec4899",
    label: "Cargo Gate",
    hoverLabel: "Inspect cargo gate access",
    clickEffect: {
      type: "district-activate",
      effectName: "cargo-scan-sweep",
    },
    dialogueOnClick:
      "The cargo gate scans incoming hardware shipments. New tower equipment cleared for deployment.",
    glowRadius: 28,
  },
] as const;

// --- Chip Docks ---
// center (630, 570), zone 860x620, streetInset 72
const chipDocksInteractables: readonly DistrictInteractable[] = [
  {
    id: "chip-data-terminal",
    districtId: "chip-docks",
    type: "terminal",
    x: 580,
    y: 490,
    width: 44,
    height: 38,
    accent: "#3b82f6",
    label: "Data Terminal",
    hoverLabel: "Inspect data terminal",
    clickEffect: {
      type: "panel",
      title: "Chip Docks Data Terminal",
      lines: [
        "Semiconductor index: +2.1%",
        "Fab utilization: 92%",
        "Chip backlog: 6 weeks",
        "AI accelerator demand: surging",
      ],
    },
    dialogueOnClick:
      "The terminal glows blue. Fab utilization is near max and AI chip orders keep climbing.",
    glowRadius: 26,
  },
  {
    id: "chip-server-diagnostics",
    districtId: "chip-docks",
    type: "control-console",
    x: 680,
    y: 530,
    width: 40,
    height: 36,
    accent: "#3b82f6",
    label: "Server Diagnostics",
    hoverLabel: "Run server diagnostics",
    clickEffect: {
      type: "panel",
      title: "Server Health Report",
      lines: [
        "Cluster uptime: 99.97%",
        "CPU temp avg: 62°C",
        "Memory utilization: 74%",
        "Disk I/O: nominal",
      ],
    },
    dialogueOnClick:
      "Diagnostics return green across the board. The docks' server clusters are humming.",
    glowRadius: 22,
  },
  {
    id: "chip-prototype-scanner",
    districtId: "chip-docks",
    type: "scanner",
    x: 640,
    y: 640,
    width: 36,
    height: 36,
    accent: "#3b82f6",
    label: "Prototype Scanner",
    hoverLabel: "Scan prototype chip",
    clickEffect: {
      type: "pulse",
      color: "#3b82f6",
      radius: 48,
    },
    dialogueOnClick:
      "The scanner reads a next-gen wafer. 3nm process yields are improving rapidly.",
    glowRadius: 24,
  },
  {
    id: "chip-analyzer",
    districtId: "chip-docks",
    type: "data-kiosk",
    x: 560,
    y: 570,
    width: 38,
    height: 40,
    accent: "#3b82f6",
    label: "Chip Analyzer",
    hoverLabel: "Analyze chip market trends",
    clickEffect: {
      type: "reveal",
      message:
        "MARKET INTEL: Major foundry announcing capacity expansion next week. Supply relief expected in Q3.",
    },
    dialogueOnClick:
      "The analyzer crunches supply chain data. A capacity announcement is imminent.",
    glowRadius: 20,
  },
] as const;

// --- Consumer Strip ---
// center (1760, 1450), zone 1120x860, streetInset 96
const consumerStripInteractables: readonly DistrictInteractable[] = [
  {
    id: "consumer-shopping-kiosk",
    districtId: "consumer-strip",
    type: "data-kiosk",
    x: 1710,
    y: 1380,
    width: 40,
    height: 44,
    accent: "#f97316",
    label: "Shopping Kiosk",
    hoverLabel: "Browse consumer trends",
    clickEffect: {
      type: "panel",
      title: "Consumer Trends Kiosk",
      lines: [
        "Retail sales: +3.4% MoM",
        "E-commerce share: 28.1%",
        "Consumer confidence: 102.4",
        "Top category: electronics (+7.2%)",
      ],
    },
    dialogueOnClick:
      "The kiosk lights up with shopping data. Electronics are leading consumer spending.",
    glowRadius: 24,
  },
  {
    id: "consumer-trend-display",
    districtId: "consumer-strip",
    type: "billboard-screen",
    x: 1810,
    y: 1420,
    width: 52,
    height: 34,
    accent: "#f97316",
    label: "Trend Display",
    hoverLabel: "View trending products",
    clickEffect: {
      type: "panel",
      title: "Consumer Strip Trends",
      lines: [
        "Trending: AI wearables (+340% search)",
        "Declining: fast fashion (-12% YoY)",
        "Breakout: sustainable goods",
        "Brand sentiment leader: NeonTech",
      ],
    },
    dialogueOnClick:
      "The display cycles through trending categories. AI wearables are the breakout hit.",
    glowRadius: 28,
  },
  {
    id: "consumer-sentiment-poll",
    districtId: "consumer-strip",
    type: "sentiment-screen",
    x: 1770,
    y: 1530,
    width: 42,
    height: 40,
    accent: "#f97316",
    label: "Sentiment Poll",
    hoverLabel: "Check consumer sentiment",
    clickEffect: {
      type: "reveal",
      message:
        "POLL RESULT: 64% of consumers plan to increase discretionary spending next quarter. Bullish for retail sector.",
    },
    dialogueOnClick:
      "The poll results flash on screen. Consumer optimism is running higher than expected.",
    glowRadius: 26,
  },
  {
    id: "consumer-retail-scanner",
    districtId: "consumer-strip",
    type: "scanner",
    x: 1690,
    y: 1460,
    width: 36,
    height: 36,
    accent: "#f97316",
    label: "Retail Scanner",
    hoverLabel: "Scan retail activity",
    clickEffect: {
      type: "pulse",
      color: "#f97316",
      radius: 52,
    },
    dialogueOnClick:
      "The scanner reads foot traffic patterns. The strip is busier than usual today.",
    glowRadius: 22,
  },
] as const;

// --- Combined flat array ---
export const districtInteractables: DistrictInteractable[] = [
  ...cryptoAlleyInteractables,
  ...industrialsFoundryInteractables,
  ...energyYardInteractables,
  ...bankTowersInteractables,
  ...bioDomeInteractables,
  ...commsNeonRidgeInteractables,
  ...chipDocksInteractables,
  ...consumerStripInteractables,
];
