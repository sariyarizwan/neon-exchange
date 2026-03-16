import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useNewsstand } from "@/hooks/useNewsstand";
import type { NewsItem } from "@/lib/api";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockNews: NewsItem[] | null = null;

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => ({ news: mockNews }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNewsItem(
  headline: string,
  district_id: string | null = null
): NewsItem {
  return {
    headline,
    sector: "Technology",
    tickers: [],
    severity: "low",
    source: "test",
    timestamp: Date.now(),
    district_id,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useNewsstand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNews = null;
  });

  it("returns empty array when news is null", () => {
    mockNews = null;
    const { result } = renderHook(() => useNewsstand("chip-docks"));
    expect(result.current).toEqual([]);
  });

  it("returns empty array when news is empty", () => {
    mockNews = [];
    const { result } = renderHook(() => useNewsstand("chip-docks"));
    expect(result.current).toEqual([]);
  });

  it("returns district-filtered news when districtId matches and district news exists", () => {
    mockNews = [
      makeNewsItem("Chip Docks rally", "chip-docks"),
      makeNewsItem("Consumer Strip dip", "consumer-strip"),
      makeNewsItem("Chip Docks correction", "chip-docks"),
    ];

    const { result } = renderHook(() => useNewsstand("chip-docks"));

    expect(result.current).toHaveLength(2);
    result.current.forEach((item) => expect(item.district_id).toBe("chip-docks"));
  });

  it("falls back to all news when no district-specific items exist", () => {
    mockNews = [
      makeNewsItem("Global market news"),
      makeNewsItem("Another headline"),
    ];

    const { result } = renderHook(() => useNewsstand("chip-docks"));

    // Falls back to all news (max 5)
    expect(result.current).toHaveLength(2);
  });

  it("returns all news (up to 5) when districtId is null", () => {
    mockNews = Array.from({ length: 8 }, (_, i) =>
      makeNewsItem(`Headline ${i}`)
    );

    const { result } = renderHook(() => useNewsstand(null));

    expect(result.current).toHaveLength(5);
  });

  it("caps results at 5 even when many district-specific items exist", () => {
    mockNews = Array.from({ length: 10 }, (_, i) =>
      makeNewsItem(`Chip news ${i}`, "chip-docks")
    );

    const { result } = renderHook(() => useNewsstand("chip-docks"));

    expect(result.current).toHaveLength(5);
  });
});
