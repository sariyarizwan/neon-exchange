const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchNeonState(): Promise<NeonMarketState> {
  const res = await fetch(`${API_URL}/api/market/neon-state`);
  if (!res.ok) throw new Error(`Market fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchNews(): Promise<{ news: NewsItem[]; isLive: boolean }> {
  const res = await fetch(`${API_URL}/api/world/news`);
  if (!res.ok) throw new Error(`News fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchBootstrap() {
  const res = await fetch(`${API_URL}/api/agents/bootstrap`);
  if (!res.ok) throw new Error(`Bootstrap fetch failed: ${res.status}`);
  return res.json();
}

export async function triggerAnalysis() {
  const res = await fetch(`${API_URL}/api/agents/analyze`, { method: "POST" });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

export function createNeonStream(onUpdate: (data: NeonStreamEvent) => void): () => void {
  const source = new EventSource(`${API_URL}/api/world/neon-stream`);

  source.addEventListener("neon_update", (e) => {
    try {
      const data = JSON.parse(e.data) as NeonStreamEvent;
      onUpdate(data);
    } catch {
      // ignore parse errors
    }
  });

  source.onerror = () => {
    // EventSource auto-reconnects
  };

  return () => source.close();
}

export function getVoiceWebSocketUrl(): string {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}/api/voice`;
}

export async function fetchMarketSnapshot(districtId?: string): Promise<NeonMarketState> {
  const url = districtId
    ? `${API_URL}/api/market/snapshot?district=${encodeURIComponent(districtId)}`
    : `${API_URL}/api/market/snapshot`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchTickerHistory(tickerId: string): Promise<OHLCCandle[]> {
  const res = await fetch(`${API_URL}/api/market/history/${encodeURIComponent(tickerId)}`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(
  message: string,
  context?: { districtId?: string | null; tickerId?: string | null }
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/world/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

// --- Types ---

export type OHLCCandle = {
  open: number;
  high: number;
  low: number;
  close: number;
  timestamp: number;
};

export type ChatResponse = {
  reply: string;
  context?: Record<string, unknown>;
};

export type NeonTickerData = {
  neonId: string;
  neonSymbol: string;
  realSymbol?: string;
  name?: string;
  price: number;
  changePct: number;
  trend: "up" | "down" | "flat";
  mood: "confident" | "nervous" | "erratic";
  regime: "calm" | "choppy" | "storm";
  momentum: number;
  volume?: number;
  volatilityRegime?: string;
  districtId?: string;
  sector?: string;
};

export type NeonMarketState = {
  tickers: Record<string, NeonTickerData>;
  marketMood: string;
  isLive: boolean;
};

export type NewsItem = {
  headline: string;
  sector: string;
  tickers: string[];
  severity: string;
  source: string;
  timestamp: number;
  url?: string;
  district_id?: string | null;
};

export type NeonStreamEvent = {
  tickers: Record<string, NeonTickerData>;
  news: NewsItem[];
  tick: number;
  district_states?: Record<string, DistrictLiveState>;
  signals?: LiveSignals;
};

export type DistrictLiveState = {
  weather: "clear" | "rain" | "storm" | "fog";
  traffic: "low" | "normal" | "heavy" | "gridlock";
  mood: "calm" | "tense" | "euphoric" | "panic";
  glow_intensity: number;
};

export type CorrelationPair = {
  a: string;
  b: string;
  r: number;
};

export type LiveSignals = {
  correlations: {
    top_positive: CorrelationPair[];
    top_negative: CorrelationPair[];
  };
  sector_strength: Record<string, { strength: number; rank: number; trend: string }>;
  breadth: { advancers: number; decliners: number; signal: string };
  regimes: {
    tickers: Record<string, string>;
    districts: Record<string, string>;
  };
};
