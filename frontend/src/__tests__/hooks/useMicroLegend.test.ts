import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMicroLegend } from "@/hooks/useMicroLegend";
import { useNeonStore } from "@/store/useNeonStore";
import type { DistrictLiveState } from "@/lib/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockDistrictStates: Record<string, DistrictLiveState> | null = null;

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => ({ districtStates: mockDistrictStates }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(
  weather: DistrictLiveState["weather"],
  traffic: DistrictLiveState["traffic"]
): DistrictLiveState {
  return { weather, traffic, mood: "calm", glow_intensity: 0.5 };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMicroLegend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDistrictStates = null;
    // Reset store state
    useNeonStore.setState({ questToasts: [], questLog: [], legendSeenOnce: false });
  });

  it("does nothing when legendSeenOnce is false, even with storm district", () => {
    useNeonStore.setState({ legendSeenOnce: false });
    mockDistrictStates = { "chip-docks": makeState("storm", "low") };

    renderHook(() => useMicroLegend());

    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });

  it("does nothing when districtStates is null even if legend was seen", () => {
    useNeonStore.setState({ legendSeenOnce: true });
    mockDistrictStates = null;

    renderHook(() => useMicroLegend());

    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });

  it("fires storm micro-legend when weather transitions from clear to storm", () => {
    useNeonStore.setState({ legendSeenOnce: true });

    // First render — set initial weather to establish previous state
    mockDistrictStates = { "chip-docks": makeState("clear", "normal") };
    const { rerender } = renderHook(() => useMicroLegend());

    // No toast on first render (no previous state to compare against)
    expect(useNeonStore.getState().questToasts).toHaveLength(0);

    // Second render — weather transitions to storm
    mockDistrictStates = { "chip-docks": makeState("storm", "normal") };
    rerender();

    const toasts = useNeonStore.getState().questToasts;
    const stormToast = toasts.find((t) => t.text.includes("volatility"));
    expect(stormToast).toBeDefined();
    expect(stormToast?.type).toBe("mood");
  });

  it("fires low traffic micro-legend when traffic transitions to low", () => {
    useNeonStore.setState({ legendSeenOnce: true });

    mockDistrictStates = { "consumer-strip": makeState("clear", "normal") };
    const { rerender } = renderHook(() => useMicroLegend());

    mockDistrictStates = { "consumer-strip": makeState("clear", "low") };
    rerender();

    const toasts = useNeonStore.getState().questToasts;
    const lowToast = toasts.find((t) => t.text.includes("liquidity"));
    expect(lowToast).toBeDefined();
    expect(lowToast?.type).toBe("mood");
  });

  it("does not fire micro-legend when weather is same across renders", () => {
    useNeonStore.setState({ legendSeenOnce: true });

    mockDistrictStates = { "chip-docks": makeState("clear", "normal") };
    const { rerender } = renderHook(() => useMicroLegend());

    // Same state
    rerender();

    // Only the initial render, no weather change detected
    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });
});
