import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuestTriggers } from "@/hooks/useQuestTriggers";
import { useNeonStore } from "@/store/useNeonStore";
import type { DistrictLiveState, LiveSignals, NeonTickerData, NewsItem } from "@/lib/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockLiveData: {
  districtStates: Record<string, DistrictLiveState> | null;
  signals: LiveSignals | null;
  news: NewsItem[] | null;
  tickers: Record<string, NeonTickerData> | null;
} = {
  districtStates: null,
  signals: null,
  news: null,
  tickers: null,
};

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => mockLiveData,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDistrictState(weather: DistrictLiveState["weather"]): DistrictLiveState {
  return { weather, traffic: "normal", mood: "calm", glow_intensity: 0.5 };
}

function makeTicker(id: string, momentum: number, neonSymbol = id.toUpperCase()): Record<string, NeonTickerData> {
  return {
    [id]: {
      neonId: id,
      neonSymbol,
      price: 100,
      changePct: 0,
      trend: "flat",
      mood: "confident",
      regime: "calm",
      momentum,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useQuestTriggers", () => {
  let questToastSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLiveData = { districtStates: null, signals: null, news: null, tickers: null };
    // Spy on the real addQuestToast action in the store
    questToastSpy = vi.spyOn(useNeonStore.getState(), "addQuestToast");
    useNeonStore.setState({ questToasts: [], questLog: [] });
  });

  afterEach(() => {
    questToastSpy.mockRestore();
  });

  it("fires storm toast when a district has weather=storm", () => {
    mockLiveData = {
      districtStates: { "chip-docks": makeDistrictState("storm") },
      signals: null,
      news: null,
      tickers: null,
    };

    renderHook(() => useQuestTriggers());

    const storeCalls = useNeonStore.getState().questToasts;
    expect(storeCalls.some((t) => t.text.includes("Storm detected") && t.type === "storm")).toBe(true);
  });

  it("does not add any quest toast when districtStates is null", () => {
    mockLiveData = { districtStates: null, signals: null, news: null, tickers: null };

    renderHook(() => useQuestTriggers());

    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });

  it("fires crowd surge toast when ticker momentum > 0.6", () => {
    mockLiveData = {
      districtStates: null,
      signals: null,
      news: null,
      tickers: makeTicker("nvx", 0.8),
    };

    renderHook(() => useQuestTriggers());

    const toasts = useNeonStore.getState().questToasts;
    expect(toasts.some((t) => t.text.includes("Crowd surge") && t.type === "crowd")).toBe(true);
  });

  it("does not fire crowd surge toast when momentum is exactly 0.6 (boundary, not > 0.6)", () => {
    mockLiveData = {
      districtStates: null,
      signals: null,
      news: null,
      tickers: makeTicker("nvx", 0.6),
    };

    renderHook(() => useQuestTriggers());

    const toasts = useNeonStore.getState().questToasts;
    const crowdToasts = toasts.filter((t) => t.type === "crowd");
    expect(crowdToasts).toHaveLength(0);
  });

  it("fires alliance toast when correlation pair r >= 0.7", () => {
    mockLiveData = {
      districtStates: null,
      signals: {
        correlations: {
          top_positive: [{ a: "nvx", b: "qntm", r: 0.85 }],
          top_negative: [],
        },
        sector_strength: {},
        breadth: { advancers: 10, decliners: 5, signal: "bullish" },
        regimes: { tickers: {}, districts: {} },
      },
      news: null,
      tickers: null,
    };

    renderHook(() => useQuestTriggers());

    const toasts = useNeonStore.getState().questToasts;
    expect(toasts.some((t) => t.text.includes("Alliance formed") && t.type === "alliance")).toBe(true);
  });

  it("does not fire alliance toast when correlation r < 0.7", () => {
    mockLiveData = {
      districtStates: null,
      signals: {
        correlations: {
          top_positive: [{ a: "nvx", b: "qntm", r: 0.65 }],
          top_negative: [],
        },
        sector_strength: {},
        breadth: { advancers: 5, decliners: 5, signal: "neutral" },
        regimes: { tickers: {}, districts: {} },
      },
      news: null,
      tickers: null,
    };

    renderHook(() => useQuestTriggers());

    const toasts = useNeonStore.getState().questToasts;
    const allianceToasts = toasts.filter((t) => t.type === "alliance");
    expect(allianceToasts).toHaveLength(0);
  });

  it("does not fire duplicate storm toast on re-render with same state", () => {
    mockLiveData = {
      districtStates: { "chip-docks": makeDistrictState("storm") },
      signals: null,
      news: null,
      tickers: null,
    };

    const { rerender } = renderHook(() => useQuestTriggers());

    const countAfterFirst = useNeonStore.getState().questToasts.filter(
      (t) => t.type === "storm"
    ).length;

    // Re-render with same data — should not fire again
    rerender();

    const countAfterSecond = useNeonStore.getState().questToasts.filter(
      (t) => t.type === "storm"
    ).length;

    expect(countAfterSecond).toBe(countAfterFirst);
  });
});
