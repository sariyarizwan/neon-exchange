// ---------------------------------------------------------------------------
// District activation effects and mini-mission definitions
// ---------------------------------------------------------------------------

export type DistrictEffectType =
  | "glitch-surge"
  | "factory-wakeup"
  | "reactor-pulse"
  | "market-briefing"
  | "research-reveal"
  | "route-activation"
  | "tech-overclock"
  | "consumer-frenzy";

export type DistrictActivation = {
  districtId: string;
  effectType: DistrictEffectType;
  name: string;
  description: string;
  duration: number; // ms
  color: string; // primary effect color
  secondaryColor: string;
};

export type MissionStep = {
  instruction: string;
  targetType: "npc" | "object";
  targetRole?: string; // NPC role to find
  targetObjectType?: string; // object type to find
  onCompleteMessage: string;
};

export type DistrictMission = {
  id: string;
  districtId: string;
  title: string;
  description: string;
  steps: [MissionStep, MissionStep, MissionStep]; // exactly 3 steps
  completionReward: string;
  completionEffect: DistrictEffectType;
};

// ---------------------------------------------------------------------------
// Activations — one per district
// ---------------------------------------------------------------------------

export const districtActivations: Record<string, DistrictActivation> = {
  "crypto-alley": {
    districtId: "crypto-alley",
    effectType: "glitch-surge",
    name: "Glitch Surge",
    description:
      "Lights stutter across every storefront, tickers flash erratically, and NPCs freeze mid-step before snapping back to life.",
    duration: 2000,
    color: "#33F5FF",
    secondaryColor: "#FF3DF2",
  },

  "industrials-foundry": {
    districtId: "industrials-foundry",
    effectType: "factory-wakeup",
    name: "Factory Wake-Up",
    description:
      "Dormant machinery rumbles to life as indicator lights pulse outward from the foundry core in expanding rings.",
    duration: 2500,
    color: "#7DD3FC",
    secondaryColor: "#FF875C",
  },

  "energy-yard": {
    districtId: "energy-yard",
    effectType: "reactor-pulse",
    name: "Reactor Pulse",
    description:
      "A deep blue pulse radiates from the reactor, overhead lights brighten district-wide, and the reactor status console opens.",
    duration: 2000,
    color: "#B7FF3C",
    secondaryColor: "#33F5FF",
  },

  "bank-towers": {
    districtId: "bank-towers",
    effectType: "market-briefing",
    name: "Market Briefing",
    description:
      "Every screen in the towers blazes to life displaying real-time summaries, sector heat-maps, and scrolling alerts.",
    duration: 3000,
    color: "#FFB84D",
    secondaryColor: "#F6D780",
  },

  "bio-dome": {
    districtId: "bio-dome",
    effectType: "research-reveal",
    name: "Research Reveal",
    description:
      "Holographic overlays shimmer into existence above lab benches, projecting molecular models and trial readouts.",
    duration: 2500,
    color: "#B7FF3C",
    secondaryColor: "#7DFFB7",
  },

  "comms-neon-ridge": {
    districtId: "comms-neon-ridge",
    effectType: "route-activation",
    name: "Route Activation",
    description:
      "Animated neon lines trace active cargo and data routes between relay towers, revealing real-time movement across the ridge.",
    duration: 3000,
    color: "#FF3DF2",
    secondaryColor: "#FF69E7",
  },

  "chip-docks": {
    districtId: "chip-docks",
    effectType: "tech-overclock",
    name: "Tech Overclock",
    description:
      "Server rack LEDs cascade in rapid succession as visible data streams pour between terminals in bright cyan trails.",
    duration: 2000,
    color: "#33F5FF",
    secondaryColor: "#D8F7FF",
  },

  "consumer-strip": {
    districtId: "consumer-strip",
    effectType: "consumer-frenzy",
    name: "Consumer Frenzy",
    description:
      "Neon signs flash at double speed, holographic sale banners unfurl, and crowd density visibly increases along the strip.",
    duration: 2500,
    color: "#FF3DF2",
    secondaryColor: "#FFE6FB",
  },
};

// ---------------------------------------------------------------------------
// Mini-missions — one per district, each with exactly 3 steps
// ---------------------------------------------------------------------------

export const districtMissions: Record<string, DistrictMission> = {
  "crypto-alley": {
    id: "mission-crypto-false-pump",
    districtId: "crypto-alley",
    title: "Trace the False Pump",
    description:
      "A suspicious price spike is rippling through Crypto Alley. Track the source before the smart money exits.",
    steps: [
      {
        instruction: "Click the Token Broker to get a lead on the spike.",
        targetType: "npc",
        targetRole: "token-broker",
        onCompleteMessage:
          "The broker points to a data board near the eastern wall. Something doesn't add up with the volume.",
      },
      {
        instruction: "Inspect the unstable data node flagged by the broker.",
        targetType: "object",
        targetObjectType: "power-node",
        onCompleteMessage:
          "Hidden signal detected — wash-trade patterns embedded in the order flow.",
      },
      {
        instruction: "Activate the hack terminal to expose the scheme.",
        targetType: "object",
        targetObjectType: "terminal",
        onCompleteMessage:
          "Correlation exposed! The pump was synthetic. Alert broadcast to the district.",
      },
    ],
    completionReward: "Unlocks the Glitch Surge district effect.",
    completionEffect: "glitch-surge",
  },

  "energy-yard": {
    id: "mission-energy-reactor",
    districtId: "energy-yard",
    title: "Stabilize the Reactor",
    description:
      "Core pressure is climbing past safe thresholds. Find the engineer, diagnose the fault, and bring the grid back online.",
    steps: [
      {
        instruction: "Click the Reactor Engineer for a status report.",
        targetType: "npc",
        targetRole: "reactor-engineer",
        onCompleteMessage:
          "Core pressure critical — the main coolant loop is starved. Check the pressure valve on level 2.",
      },
      {
        instruction: "Inspect the pressure valve to diagnose the fault.",
        targetType: "object",
        targetObjectType: "control-console",
        onCompleteMessage:
          "Valve reading normalized after manual bypass. Coolant flow resuming.",
      },
      {
        instruction: "Activate the reactor console to confirm grid stability.",
        targetType: "object",
        targetObjectType: "reactor-console",
        onCompleteMessage:
          "Grid stabilized. District power output optimal. All sectors green.",
      },
    ],
    completionReward: "Unlocks the Reactor Pulse district effect.",
    completionEffect: "reactor-pulse",
  },

  "industrials-foundry": {
    id: "mission-industrials-bottleneck",
    districtId: "industrials-foundry",
    title: "Find the Bottleneck",
    description:
      "Production has ground to a halt since 0400. Locate the stall, diagnose the jam, and restore throughput.",
    steps: [
      {
        instruction: "Talk to the Factory Worker on the main floor.",
        targetType: "npc",
        targetRole: "factory-worker",
        onCompleteMessage:
          "Transport line stalled since 0400. The conveyor monitor near junction 7 should show the fault.",
      },
      {
        instruction: "Inspect the conveyor monitor for diagnostics.",
        targetType: "object",
        targetObjectType: "control-console",
        onCompleteMessage:
          "Bottleneck identified at junction 7 — a misaligned pallet triggered the safety lock.",
      },
      {
        instruction: "Use the machine console to clear the jam.",
        targetType: "object",
        targetObjectType: "machine-console",
        onCompleteMessage:
          "Throughput restored. Production line back online at full capacity.",
      },
    ],
    completionReward: "Unlocks the Factory Wake-Up district effect.",
    completionEffect: "factory-wakeup",
  },

  "bank-towers": {
    id: "mission-bank-rotation",
    districtId: "bank-towers",
    title: "Read the Rotation",
    description:
      "Capital is shifting between sectors. Piece together the rotation before the street catches on.",
    steps: [
      {
        instruction: "Talk to the Floor Analyst near the trading desks.",
        targetType: "npc",
        targetRole: "floor-analyst",
        onCompleteMessage:
          "Capital is rotating out of growth into defensive names. Check the sentiment screen for confirmation.",
      },
      {
        instruction: "Inspect the sentiment screen on the mezzanine.",
        targetType: "object",
        targetObjectType: "sentiment-screen",
        onCompleteMessage:
          "Sector sentiment shifting to value — utilities and staples leading inflows.",
      },
      {
        instruction: "Check the earnings board for the final signal.",
        targetType: "object",
        targetObjectType: "news-board",
        onCompleteMessage:
          "Rotation confirmed. Defensive sectors leading. Advisory issued to all tower desks.",
      },
    ],
    completionReward: "Unlocks the Market Briefing district effect.",
    completionEffect: "market-briefing",
  },

  "comms-neon-ridge": {
    id: "mission-comms-shipment",
    districtId: "comms-neon-ridge",
    title: "Follow the Missing Shipment",
    description:
      "Cargo 7X-Alpha dropped off the grid at relay 3. Trace its signal and restore the route.",
    steps: [
      {
        instruction: "Click the Dispatcher at the ridge control hub.",
        targetType: "npc",
        targetRole: "dispatcher",
        onCompleteMessage:
          "Cargo 7X-Alpha went dark at relay 3. Pull up the route map — the last ping came from Ridge Link.",
      },
      {
        instruction: "Check the route map for the signal trace.",
        targetType: "object",
        targetObjectType: "route-map",
        onCompleteMessage:
          "Signal trace shows an unauthorized detour through Ridge Link sector 9.",
      },
      {
        instruction: "Scan the transit scanner to locate the shipment.",
        targetType: "object",
        targetObjectType: "scanner",
        onCompleteMessage:
          "Shipment located and rerouted. Cargo 7X-Alpha back on track. Route restored.",
      },
    ],
    completionReward: "Unlocks the Route Activation district effect.",
    completionEffect: "route-activation",
  },

  "bio-dome": {
    id: "mission-bio-trial",
    districtId: "bio-dome",
    title: "Unlock the Trial Data",
    description:
      "Phase 3 results are locked behind a compliance gate. Navigate the process to release the breakthrough.",
    steps: [
      {
        instruction: "Talk to the Lab Researcher near the specimen wing.",
        targetType: "npc",
        targetRole: "lab-researcher",
        onCompleteMessage:
          "Phase 3 data is locked behind compliance review. The specimen chamber has the latest biomarker readings.",
      },
      {
        instruction: "Inspect the specimen chamber for biomarker data.",
        targetType: "object",
        targetObjectType: "scanner",
        onCompleteMessage:
          "Biomarkers within target range — efficacy confirmed across all cohorts.",
      },
      {
        instruction: "Access the trial terminal to release the data.",
        targetType: "object",
        targetObjectType: "terminal",
        onCompleteMessage:
          "Trial data unlocked. Breakthrough confirmed. Publication queue initiated.",
      },
    ],
    completionReward: "Unlocks the Research Reveal district effect.",
    completionEffect: "research-reveal",
  },

  "chip-docks": {
    id: "mission-chip-prototype",
    districtId: "chip-docks",
    title: "Debug the Prototype",
    description:
      "The next-gen prototype is crashing under load. Diagnose the fault and deploy a hot-fix before the demo.",
    steps: [
      {
        instruction: "Talk to a tech NPC on the dock floor.",
        targetType: "npc",
        targetRole: "sleepless-coder",
        onCompleteMessage:
          "The prototype is throwing kernel panics under stress test. Server diagnostics might show the root cause.",
      },
      {
        instruction: "Inspect the server diagnostics panel.",
        targetType: "object",
        targetObjectType: "control-console",
        onCompleteMessage:
          "Memory leak in sector 4 — an unbounded buffer is consuming all available heap.",
      },
      {
        instruction: "Use the data terminal to deploy the patch.",
        targetType: "object",
        targetObjectType: "terminal",
        onCompleteMessage:
          "Patch deployed. Prototype stable under full load. Demo greenlit.",
      },
    ],
    completionReward: "Unlocks the Tech Overclock district effect.",
    completionEffect: "tech-overclock",
  },

  "consumer-strip": {
    id: "mission-consumer-trend",
    districtId: "consumer-strip",
    title: "Track the Trend",
    description:
      "Something is trending across the strip but nobody can pin it down. Chase the signal through the noise.",
    steps: [
      {
        instruction: "Talk to a consumer NPC browsing the storefronts.",
        targetType: "npc",
        targetRole: "investor-tourist",
        onCompleteMessage:
          "Something's trending but nobody knows what. The trend display near the plaza might have data.",
      },
      {
        instruction: "Check the trend display for social sentiment.",
        targetType: "object",
        targetObjectType: "billboard-screen",
        onCompleteMessage:
          "Social sentiment spiking on retail — a viral product drop is driving foot traffic.",
      },
      {
        instruction: "Use the sentiment poll terminal to confirm the trend.",
        targetType: "object",
        targetObjectType: "sentiment-screen",
        onCompleteMessage:
          "Trend identified. Consumer confidence surging. Strip merchants alerted.",
      },
    ],
    completionReward: "Unlocks the Consumer Frenzy district effect.",
    completionEffect: "consumer-frenzy",
  },
};
