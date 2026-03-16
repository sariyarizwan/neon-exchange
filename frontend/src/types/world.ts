export type AvatarOption = {
  id: string;
  name: string;
  body: string;
  trim: string;
  visor: string;
};

export type NewsHeadline = {
  id: string;
  title: string;
  source: string;
  summary: string;
};

export type NewsstandData = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  tickerFocus: string;
  headlines: NewsHeadline[];
};

export type WorldPropType =
  | "vending-machine"
  | "neon-terminal"
  | "billboard"
  | "holo-sign"
  | "bench"
  | "crate"
  | "taxi"
  | "doorway"
  | "stairs"
  | "palm-tree"
  | "newsstand"
  | "street-lamp"
  | "drone-dock"
  | "manhole"
  | "pipe-rack"
  | "ac-unit"
  | "neon-arrow"
  | "server-stack"
  | "vault-sign"
  | "reactor-core"
  | "qr-wall";

export type InteractionBehavior = "vending" | "terminal" | "billboard" | "lamp" | "crate" | "landmark" | "newsstand" | "none";

export type WorldProp = {
  id: string;
  districtId: string;
  type: WorldPropType;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
  label: string;
  interactive: boolean;
  collidable?: boolean;
  behavior?: InteractionBehavior;
  lightRadius?: number;
  poi?: boolean;
  adFrames?: string[];
  landmarkTitle?: string;
  landmarkText?: string;
};

export type NpcRole =
  | "token-broker" | "glitch-dealer" | "street-hacker" | "whisper-trader" | "courier-bot"
  | "factory-worker" | "shift-supervisor" | "mechanic" | "supply-chain-op" | "inspection-drone"
  | "reactor-engineer" | "grid-analyst" | "safety-bot" | "cable-tech" | "emergency-runner"
  | "floor-analyst" | "portfolio-manager" | "banker" | "economic-commentator" | "security-drone"
  | "lab-researcher" | "bioengineer" | "clinical-observer" | "compliance-officer" | "med-drone"
  | "freight-handler" | "route-planner" | "cargo-drone" | "dispatcher" | "dock-supervisor"
  | "street-trader" | "analyst" | "guide-bot" | "citizen" | "investor-tourist" | "sleepless-coder"
  | "barista" | "watcher" | "tech-lead" | "chip-runner" | "prototype-tester" | "data-miner" | "signal-scout"
  | "shopkeeper" | "trend-spotter" | "brand-rep" | "deal-hunter" | "influencer";

export type NpcClickAction =
  | { type: "speak"; line: string }
  | { type: "reveal-rumor"; rumor: string }
  | { type: "trigger-pulse"; districtId: string }
  | { type: "highlight-npc"; targetNpcId: string }
  | { type: "open-panel"; panel: string }
  | { type: "start-mission"; missionId: string }
  | { type: "point-to-building"; direction: string };

export type Citizen = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  style: "walker" | "vendor" | "broker" | "runner";
  color: string;
  patrolRadius: number;
  dialogues: string[];
  role?: NpcRole;
  hoverPrompt?: string;
  clickAction?: NpcClickAction;
  bodyColor?: string;
  trimColor?: string;
};

export type MissionStepState = "locked" | "active" | "completed";

export type ActiveMission = {
  missionId: string;
  districtId: string;
  currentStep: number;
  stepStates: MissionStepState[];
};

export type DistrictActivationState = {
  districtId: string;
  effectType: string;
  startedAt: number;
  duration: number;
  primaryColor: string;
  secondaryColor: string;
};

export type DistrictZone = {
  districtId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  streetInset: number;
  accent: string;
  tileVariant: "tech" | "finance" | "energy" | "industrial" | "consumer" | "crypto" | "bio" | "comms";
};

export type DistrictTheme = {
  districtId: string;
  icon: string;
  questHint: string;
  ambientDust: number;
  stormRain: number;
  landmarkId: string;
  landmarkLabel: string;
};

export type WorldSurfaceKind = "road" | "sidewalk" | "crosswalk" | "alley" | "tunnel" | "hazard";

export type WorldSurface = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: WorldSurfaceKind;
  accent: string;
  label?: string;
  direction?: "north" | "south" | "east" | "west";
};

export type WorldStructureKind = "building" | "fence" | "gate" | "railing" | "tunnel-mouth" | "bridge" | "metro-entrance" | "shopfront";

export type WorldStructure = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: WorldStructureKind;
  accent: string;
  label?: string;
  collidable?: boolean;
  elevated?: boolean;
};

export type WorldCollider = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type StockNpcProfile = {
  tickerId: string;
  patrolRadius: number;
  dialogues: string[];
};
