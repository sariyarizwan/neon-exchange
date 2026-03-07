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

export type Citizen = {
  id: string;
  districtId: string;
  x: number;
  y: number;
  style: "walker" | "vendor" | "broker" | "runner";
  color: string;
  patrolRadius: number;
  dialogues: string[];
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
