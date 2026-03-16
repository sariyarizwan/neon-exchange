import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMarketData } from "@/hooks/useMarketData";
import type { NeonMarketState } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchMarketSnapshot: vi.fn(),
}));

import * as api from "@/lib/api";

const makeMockSnapshot = (prices: Record<string, number>): NeonMarketState => ({
  tickers: Object.fromEntries(
    Object.entries(prices).map(([id, price]) => [
      id,
      {
        neonId: id,
        neonSymbol: id.toUpperCase(),
        price,
        changePct: 0,
        trend: "flat" as const,
        mood: "confident" as const,
        regime: "calm" as const,
        momentum: 0,
      },
    ])
  ),
  marketMood: "neutral",
  isLive: false,
});

describe("useMarketData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading=false and null snapshot when districtId is null (no fetch)", () => {
    const { result } = renderHook(() => useMarketData(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("starts loading when districtId is provided and resolves snapshot", async () => {
    const snapshot = makeMockSnapshot({ nvx: 100 });
    (api.fetchMarketSnapshot as ReturnType<typeof vi.fn>).mockResolvedValueOnce(snapshot);

    const { result } = renderHook(() => useMarketData("chip-docks"));

    await waitFor(() => {
      expect(result.current.snapshot).not.toBeNull();
    });

    expect(result.current.snapshot).toEqual(snapshot);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on fetch failure", async () => {
    (api.fetchMarketSnapshot as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network timeout")
    );

    const { result } = renderHook(() => useMarketData("consumer-strip"));

    await waitFor(() => {
      expect(result.current.error).toBe("Network timeout");
    });
  });

  it("builds candles from snapshot prices", async () => {
    const snapshot = makeMockSnapshot({ nvx: 100 });
    (api.fetchMarketSnapshot as ReturnType<typeof vi.fn>).mockResolvedValueOnce(snapshot);

    const { result } = renderHook(() => useMarketData("chip-docks"));

    await waitFor(() => {
      expect(result.current.candles["nvx"]).toBeDefined();
    });

    const candles = result.current.candles["nvx"];
    expect(candles.length).toBeGreaterThanOrEqual(1);
    expect(candles[0].open).toBe(100);
    expect(candles[0].close).toBe(100);
  });

  it("returns empty candles when no districtId", () => {
    const { result } = renderHook(() => useMarketData(null));
    expect(result.current.candles).toEqual({});
  });
});
