export type RightPanelTab = "scenes" | "alliances" | "evidence";
export type AgentPersona = "Market Maker" | "Whale" | "News Desk";
export type FacingDirection = "up" | "down" | "left" | "right";

export type SoundState = {
  enabled: boolean;
  volume: number;
  bootstrapped: boolean;
  needsGesture: boolean;
  playing: boolean;
  trackName: string;
};

export type EvidenceItem = {
  id: string;
  timestamp: string;
  text: string;
  districtId?: string;
  tickerId?: string;
};

export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: FacingDirection;
  avatarId: string;
};
