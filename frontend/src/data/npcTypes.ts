// ─── NPC Role & Action Types ───────────────────────────────────────────────

export type NpcRole =
  | "token-broker"
  | "glitch-dealer"
  | "street-hacker"
  | "whisper-trader"
  | "courier-bot"
  | "factory-worker"
  | "shift-supervisor"
  | "mechanic"
  | "supply-chain-op"
  | "inspection-drone"
  | "reactor-engineer"
  | "grid-analyst"
  | "safety-bot"
  | "cable-tech"
  | "emergency-runner"
  | "floor-analyst"
  | "portfolio-manager"
  | "banker"
  | "economic-commentator"
  | "security-drone"
  | "lab-researcher"
  | "bioengineer"
  | "clinical-observer"
  | "compliance-officer"
  | "med-drone"
  | "freight-handler"
  | "route-planner"
  | "cargo-drone"
  | "dispatcher"
  | "dock-supervisor"
  | "street-trader"
  | "analyst"
  | "guide-bot"
  | "citizen"
  | "investor-tourist"
  | "sleepless-coder"
  | "barista"
  | "watcher";

export type NpcClickAction =
  | { type: "speak"; line: string }
  | { type: "reveal-rumor"; rumor: string }
  | { type: "trigger-pulse"; districtId: string }
  | { type: "highlight-npc"; targetNpcId: string }
  | { type: "open-panel"; panel: string }
  | { type: "start-mission"; missionId: string }
  | { type: "point-to-building"; direction: string };

export type DistrictNpcDef = {
  role: NpcRole;
  style: "walker" | "vendor" | "broker" | "runner";
  dialogues: [string, string, string];
  hoverPrompt: string;
  clickAction: NpcClickAction;
  bodyColor: string;
  trimColor: string;
};

// ─── District NPC Definitions ──────────────────────────────────────────────

export const districtNpcDefs: Record<string, DistrictNpcDef[]> = {
  // ── Crypto Alley ───────────────────────────────────────────────────────
  "crypto-alley": [
    {
      role: "token-broker",
      style: "broker",
      dialogues: [
        "Momentum's fake until it isn't.",
        "This district moves before the headlines do.",
        "Something is pumping beneath the surface.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: { type: "speak", line: "Momentum's fake until it isn't." },
      bodyColor: "#0A1A2F",
      trimColor: "#33F5FF",
    },
    {
      role: "glitch-dealer",
      style: "vendor",
      dialogues: [
        "I deal in broken fragments. Some still hold value.",
        "Every glitch leaves a trace. Want to see?",
        "Artifacts don't lie. People do.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A corrupted token fragment is cycling through three wallets — might be a wash-trade signal.",
      },
      bodyColor: "#0D0D2B",
      trimColor: "#33F5FF",
    },
    {
      role: "street-hacker",
      style: "runner",
      dialogues: [
        "The terminal's warm. Someone was here first.",
        "I crack signals, not safes.",
        "Latency is the new insider info.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: {
        type: "trigger-pulse",
        districtId: "crypto-alley",
      },
      bodyColor: "#111133",
      trimColor: "#33F5FF",
    },
    {
      role: "whisper-trader",
      style: "walker",
      dialogues: [
        "Correlations hide in plain sight.",
        "Two tokens moved in sync last night. Coincidence?",
        "The pattern breaks before the news drops.",
      ],
      hoverPrompt: "Ask about hidden correlations",
      clickAction: {
        type: "highlight-npc",
        targetNpcId: "token-broker-crypto",
      },
      bodyColor: "#0A0F24",
      trimColor: "#33F5FF",
    },
    {
      role: "courier-bot",
      style: "runner",
      dialogues: [
        "Signal relayed from Chip Docks. Standby.",
        "Cross-district traffic is up 40%.",
        "I carry data, not opinions.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "point-to-building",
        direction: "east toward Chip Docks",
      },
      bodyColor: "#0E1A30",
      trimColor: "#33F5FF",
    },
  ],

  // ── Industrials Foundry ────────────────────────────────────────────────
  "industrials-foundry": [
    {
      role: "factory-worker",
      style: "walker",
      dialogues: [
        "Output's stable, but transport's lagging.",
        "One broken link and the whole chain shakes.",
        "You can hear the pressure before you see it.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: {
        type: "speak",
        line: "Output's stable, but transport's lagging.",
      },
      bodyColor: "#0F1A2A",
      trimColor: "#7DD3FC",
    },
    {
      role: "shift-supervisor",
      style: "vendor",
      dialogues: [
        "Third shift ran hot. We're cooling down.",
        "Throughput numbers don't match the sentiment.",
        "If the furnace stalls, you'll know it district-wide.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: { type: "open-panel", panel: "scenarios" },
      bodyColor: "#12203A",
      trimColor: "#7DD3FC",
    },
    {
      role: "mechanic",
      style: "walker",
      dialogues: [
        "Gears grind before they break.",
        "Maintenance cycles predict downturns better than charts.",
        "Rust is just risk you can see.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A major assembly line paused overnight — parts backlog from Energy Yard.",
      },
      bodyColor: "#0D1828",
      trimColor: "#7DD3FC",
    },
    {
      role: "supply-chain-op",
      style: "broker",
      dialogues: [
        "Lead times just stretched another week.",
        "Inventory buffers are thinner than they look.",
        "When transport costs spike, margins vanish.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "trigger-pulse",
        districtId: "industrials-foundry",
      },
      bodyColor: "#101C30",
      trimColor: "#7DD3FC",
    },
    {
      role: "inspection-drone",
      style: "runner",
      dialogues: [
        "Scan complete. Two anomalies flagged.",
        "Quality variance is within tolerance — barely.",
        "Defect rate trending upward since last cycle.",
      ],
      hoverPrompt: "Request scan report",
      clickAction: {
        type: "point-to-building",
        direction: "north toward the main assembly hall",
      },
      bodyColor: "#0A1525",
      trimColor: "#7DD3FC",
    },
  ],

  // ── Energy Yard ────────────────────────────────────────────────────────
  "energy-yard": [
    {
      role: "reactor-engineer",
      style: "vendor",
      dialogues: [
        "Core pressure is rising.",
        "The next storm will test the grid.",
        "Power moves first. Markets follow.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: {
        type: "speak",
        line: "Core pressure is rising.",
      },
      bodyColor: "#0D1F0A",
      trimColor: "#B7FF3C",
    },
    {
      role: "grid-analyst",
      style: "broker",
      dialogues: [
        "Load distribution is uneven tonight.",
        "Peak demand forecasts keep climbing.",
        "The grid remembers every blackout.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: { type: "open-panel", panel: "scenarios" },
      bodyColor: "#112A0E",
      trimColor: "#B7FF3C",
    },
    {
      role: "safety-bot",
      style: "runner",
      dialogues: [
        "All sectors nominal. For now.",
        "Containment integrity at 97%. Watch the edges.",
        "Safety margins shrink when nobody's looking.",
      ],
      hoverPrompt: "Request status",
      clickAction: {
        type: "trigger-pulse",
        districtId: "energy-yard",
      },
      bodyColor: "#0A1A08",
      trimColor: "#B7FF3C",
    },
    {
      role: "cable-tech",
      style: "walker",
      dialogues: [
        "Conduit 7 is running hot.",
        "Voltage drops tell you more than dashboards.",
        "Patch the line now or lose the block later.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "Underground cable near sector 4 is degrading — could trigger rolling brownouts.",
      },
      bodyColor: "#0F2510",
      trimColor: "#B7FF3C",
    },
    {
      role: "emergency-runner",
      style: "runner",
      dialogues: [
        "Backup generators are on standby.",
        "When the alarm sounds, I move. So should you.",
        "Last surge took out two relay stations.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "point-to-building",
        direction: "south toward the backup reactor",
      },
      bodyColor: "#0B1D0A",
      trimColor: "#B7FF3C",
    },
  ],

  // ── Bank Towers (Finance Plaza) ────────────────────────────────────────
  "bank-towers": [
    {
      role: "floor-analyst",
      style: "broker",
      dialogues: [
        "The market rewards confidence until it doesn't.",
        "Watch capital rotation, not just headlines.",
        "Sentiment is changing faster than price.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: {
        type: "speak",
        line: "The market rewards confidence until it doesn't.",
      },
      bodyColor: "#1A1505",
      trimColor: "#FFB84D",
    },
    {
      role: "portfolio-manager",
      style: "vendor",
      dialogues: [
        "Rebalancing is not retreat. It's positioning.",
        "Risk-off doesn't mean risk-gone.",
        "The next allocation shift starts here.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: { type: "open-panel", panel: "alliances" },
      bodyColor: "#201A08",
      trimColor: "#FFB84D",
    },
    {
      role: "banker",
      style: "walker",
      dialogues: [
        "Credit lines are tightening across the board.",
        "Liquidity looks fine until you need it.",
        "Rates whisper before they shout.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A major fund is quietly unwinding positions in three sectors — rotation incoming.",
      },
      bodyColor: "#1C1608",
      trimColor: "#FFB84D",
    },
    {
      role: "economic-commentator",
      style: "broker",
      dialogues: [
        "Inflation expectations are drifting again.",
        "The yield curve has a story to tell.",
        "Consensus is a lagging indicator.",
      ],
      hoverPrompt: "Ask about macro outlook",
      clickAction: {
        type: "trigger-pulse",
        districtId: "bank-towers",
      },
      bodyColor: "#18130A",
      trimColor: "#FFB84D",
    },
    {
      role: "security-drone",
      style: "runner",
      dialogues: [
        "Perimeter secure. High-value transfers in progress.",
        "Unusual access pattern detected on floor 12.",
        "Vault integrity nominal. Next audit in 4 hours.",
      ],
      hoverPrompt: "Request status",
      clickAction: {
        type: "point-to-building",
        direction: "upward toward the executive floors",
      },
      bodyColor: "#151005",
      trimColor: "#FFB84D",
    },
  ],

  // ── Bio Dome (Biotech Quarter) ─────────────────────────────────────────
  "bio-dome": [
    {
      role: "lab-researcher",
      style: "vendor",
      dialogues: [
        "Promise and risk live side by side here.",
        "One quarter can change everything.",
        "Breakthroughs are expensive. Failures are louder.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: {
        type: "speak",
        line: "Promise and risk live side by side here.",
      },
      bodyColor: "#0A1F12",
      trimColor: "#B7FF3C",
    },
    {
      role: "bioengineer",
      style: "broker",
      dialogues: [
        "Phase 3 data drops next week. Brace yourself.",
        "Gene therapies move slow until they don't.",
        "The pipeline is the product.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: { type: "open-panel", panel: "evidence" },
      bodyColor: "#0D2515",
      trimColor: "#B7FF3C",
    },
    {
      role: "clinical-observer",
      style: "walker",
      dialogues: [
        "Trial enrollment is ahead of schedule.",
        "Endpoints look promising, but the sample is small.",
        "Regulatory timelines have their own physics.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "An unnamed biotech just hit primary endpoints in a rare-disease trial — filing expected within weeks.",
      },
      bodyColor: "#0B2214",
      trimColor: "#B7FF3C",
    },
    {
      role: "compliance-officer",
      style: "walker",
      dialogues: [
        "Every claim needs evidence. Every shortcut leaves a trail.",
        "Approval odds shifted after the last advisory meeting.",
        "Compliance isn't the enemy. Hubris is.",
      ],
      hoverPrompt: "Ask about regulations",
      clickAction: {
        type: "trigger-pulse",
        districtId: "bio-dome",
      },
      bodyColor: "#081C10",
      trimColor: "#B7FF3C",
    },
    {
      role: "med-drone",
      style: "runner",
      dialogues: [
        "Sample transport in progress. Handle with care.",
        "Cold-chain integrity verified.",
        "Delivery manifest updated. Three labs pending.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "point-to-building",
        direction: "east toward the clinical wing",
      },
      bodyColor: "#0A1E11",
      trimColor: "#B7FF3C",
    },
  ],

  // ── Comms Neon Ridge (Telecom / Logistics Row) ─────────────────────────
  "comms-neon-ridge": [
    {
      role: "freight-handler",
      style: "walker",
      dialogues: [
        "Delays never stay local.",
        "Everything arrives late somewhere first.",
        "Supply lines whisper before they break.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: {
        type: "speak",
        line: "Delays never stay local.",
      },
      bodyColor: "#1A0A1F",
      trimColor: "#FF3DF2",
    },
    {
      role: "route-planner",
      style: "broker",
      dialogues: [
        "Optimal paths change hourly in this district.",
        "Bandwidth is the new bottleneck.",
        "Re-routing around the congestion. Stand by.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: { type: "open-panel", panel: "scenarios" },
      bodyColor: "#200D24",
      trimColor: "#FF3DF2",
    },
    {
      role: "cargo-drone",
      style: "runner",
      dialogues: [
        "Payload delivered. Return flight queued.",
        "Signal interference on corridor 9.",
        "Throughput is down 12% since last night.",
      ],
      hoverPrompt: "Request status",
      clickAction: {
        type: "trigger-pulse",
        districtId: "comms-neon-ridge",
      },
      bodyColor: "#180A1C",
      trimColor: "#FF3DF2",
    },
    {
      role: "dispatcher",
      style: "vendor",
      dialogues: [
        "Three shipments rerouted in the last hour.",
        "When comms lag, logistics collapse.",
        "Priority queue is backed up. Expect ripple effects.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A fiber trunk between Neon Ridge and Chip Docks went dark for 90 seconds — data integrity unknown.",
      },
      bodyColor: "#1C0B20",
      trimColor: "#FF3DF2",
    },
    {
      role: "dock-supervisor",
      style: "walker",
      dialogues: [
        "Manifest discrepancies are piling up.",
        "The docks are busier than the numbers suggest.",
        "Night shift always finds the real problems.",
      ],
      hoverPrompt: "Ask about operations",
      clickAction: {
        type: "point-to-building",
        direction: "west toward the freight terminals",
      },
      bodyColor: "#190A1E",
      trimColor: "#FF3DF2",
    },
  ],

  // ── Chip Docks (Tech) ──────────────────────────────────────────────────
  "chip-docks": [
    {
      role: "sleepless-coder",
      style: "walker",
      dialogues: [
        "Shipped at 3 AM. Broke at 4. Fixed by 5.",
        "The compiler doesn't care about your deadline.",
        "Every deploy is a bet against entropy.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: {
        type: "speak",
        line: "Shipped at 3 AM. Broke at 4. Fixed by 5.",
      },
      bodyColor: "#0A1525",
      trimColor: "#33F5FF",
    },
    {
      role: "analyst",
      style: "broker",
      dialogues: [
        "Chip demand curves are diverging from guidance.",
        "Fab utilization is the number that matters.",
        "When semis move, everything downstream follows.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: { type: "open-panel", panel: "evidence" },
      bodyColor: "#0D1A30",
      trimColor: "#33F5FF",
    },
    {
      role: "street-trader",
      style: "vendor",
      dialogues: [
        "Got refurb GPUs. No questions asked.",
        "Silicon shortage? I've got a guy.",
        "Trade volume spiked on the prototype announcement.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A next-gen chip prototype leaked from a fab — yields are better than anyone expected.",
      },
      bodyColor: "#0E1828",
      trimColor: "#33F5FF",
    },
    {
      role: "guide-bot",
      style: "runner",
      dialogues: [
        "Welcome to Chip Docks. Mind the voltage.",
        "Nearest newsstand is 40 meters east.",
        "This district never sleeps. Neither do I.",
      ],
      hoverPrompt: "Ask for directions",
      clickAction: {
        type: "point-to-building",
        direction: "east toward the fabrication labs",
      },
      bodyColor: "#0B1422",
      trimColor: "#33F5FF",
    },
    {
      role: "watcher",
      style: "walker",
      dialogues: [
        "I watch the data flows. Something shifted.",
        "Latency spikes always precede the moves.",
        "The docks have eyes. Most of them are mine.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "trigger-pulse",
        districtId: "chip-docks",
      },
      bodyColor: "#091320",
      trimColor: "#33F5FF",
    },
  ],

  // ── Consumer Strip ─────────────────────────────────────────────────────
  "consumer-strip": [
    {
      role: "barista",
      style: "vendor",
      dialogues: [
        "Foot traffic tells you more than earnings calls.",
        "The regulars are spending less. I notice.",
        "Caffeine and confidence — both wear off.",
      ],
      hoverPrompt: "Click to talk",
      clickAction: {
        type: "speak",
        line: "Foot traffic tells you more than earnings calls.",
      },
      bodyColor: "#1A0A1C",
      trimColor: "#FF3DF2",
    },
    {
      role: "investor-tourist",
      style: "walker",
      dialogues: [
        "First time in Neon City. Where's the alpha?",
        "Everyone says buy the dip. Nobody says which dip.",
        "I came for the hype. Staying for the data.",
      ],
      hoverPrompt: "Ask for directions",
      clickAction: {
        type: "point-to-building",
        direction: "north toward the main plaza",
      },
      bodyColor: "#1C0D1E",
      trimColor: "#FF3DF2",
    },
    {
      role: "street-trader",
      style: "broker",
      dialogues: [
        "Retail sentiment is a leading indicator if you know where to look.",
        "Brand loyalty is thinner than it used to be.",
        "Discount season came early. That's not bullish.",
      ],
      hoverPrompt: "Ask for insight",
      clickAction: { type: "open-panel", panel: "scenarios" },
      bodyColor: "#200E22",
      trimColor: "#FF3DF2",
    },
    {
      role: "citizen",
      style: "walker",
      dialogues: [
        "Prices keep climbing but paychecks don't.",
        "The Strip used to feel busier.",
        "Something's off this quarter. Can't place it yet.",
      ],
      hoverPrompt: "Hear a rumor",
      clickAction: {
        type: "reveal-rumor",
        rumor: "A major retailer is quietly closing stores in three districts — earnings guidance revision imminent.",
      },
      bodyColor: "#180B1A",
      trimColor: "#FF3DF2",
    },
    {
      role: "guide-bot",
      style: "runner",
      dialogues: [
        "Welcome to Consumer Strip. Shop smart.",
        "Trending now: defensive staples outpacing discretionary.",
        "Need directions? The newsstand has the latest.",
      ],
      hoverPrompt: "Request update",
      clickAction: {
        type: "trigger-pulse",
        districtId: "consumer-strip",
      },
      bodyColor: "#150A18",
      trimColor: "#FF3DF2",
    },
  ],
};
