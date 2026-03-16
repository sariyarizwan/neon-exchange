import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { BreakingNewsAlert } from "@/components/layout/BreakingNewsAlert";
import { useNeonStore } from "@/store/useNeonStore";

const mockUseLiveData = vi.fn();

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => mockUseLiveData(),
}));

describe("BreakingNewsAlert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useNeonStore.setState({ selectedDistrictId: null });
    mockUseLiveData.mockReturnValue({ news: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there is no news", () => {
    const { container } = render(<BreakingNewsAlert />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when news has no high-severity items", () => {
    mockUseLiveData.mockReturnValue({
      news: [
        {
          headline: "Low severity news",
          severity: "low",
          timestamp: new Date().toISOString(),
          source: "Reuters",
          district_id: null,
          sector: "tech",
          tickers: [],
        },
      ],
    });
    const { container } = render(<BreakingNewsAlert />);
    expect(container.firstChild).toBeNull();
  });

  it("renders alert banner for high severity news", () => {
    mockUseLiveData.mockReturnValue({
      news: [
        {
          headline: "Major market crash detected!",
          severity: "high",
          timestamp: "2024-01-01T00:00:00Z",
          source: "Bloomberg",
          district_id: "chip-docks",
          sector: "tech",
          tickers: ["NVX"],
        },
      ],
    });
    render(<BreakingNewsAlert />);
    expect(screen.getByText("Major market crash detected!")).toBeInTheDocument();
  });

  it("shows Breaking badge on alert", () => {
    mockUseLiveData.mockReturnValue({
      news: [
        {
          headline: "Breaking news",
          severity: "high",
          timestamp: "2024-01-01T00:00:01Z",
          source: "Reuters",
          district_id: null,
          sector: "tech",
          tickers: [],
        },
      ],
    });
    render(<BreakingNewsAlert />);
    expect(screen.getByText("Breaking")).toBeInTheDocument();
  });

  it("shows district ID on alert when district_id is present", () => {
    mockUseLiveData.mockReturnValue({
      news: [
        {
          headline: "District alert",
          severity: "high",
          timestamp: "2024-01-01T00:00:02Z",
          source: "Reuters",
          district_id: "chip-docks",
          sector: "tech",
          tickers: [],
        },
      ],
    });
    render(<BreakingNewsAlert />);
    // District ID rendered with dashes replaced by spaces
    expect(screen.getByText("chip docks")).toBeInTheDocument();
  });

  it("auto-dismisses after 4 seconds", () => {
    mockUseLiveData.mockReturnValue({
      news: [
        {
          headline: "Short-lived alert",
          severity: "high",
          timestamp: "2024-01-01T00:00:03Z",
          source: "Reuters",
          district_id: null,
          sector: "tech",
          tickers: [],
        },
      ],
    });
    render(<BreakingNewsAlert />);
    expect(screen.getByText("Short-lived alert")).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(4100); });
    expect(screen.queryByText("Short-lived alert")).not.toBeInTheDocument();
  });

  it("does not show the same news item twice", () => {
    const newsItem = {
      headline: "Once-only alert",
      severity: "high",
      timestamp: "2024-01-01T00:00:04Z",
      source: "Reuters",
      district_id: null,
      sector: "tech",
      tickers: [],
    };
    mockUseLiveData.mockReturnValue({ news: [newsItem] });
    const { rerender } = render(<BreakingNewsAlert />);
    expect(screen.getByText("Once-only alert")).toBeInTheDocument();
    // Dismiss
    act(() => { vi.advanceTimersByTime(4100); });
    // Re-render with same item - should not show again (seenRef tracks it)
    rerender(<BreakingNewsAlert />);
    expect(screen.queryByText("Once-only alert")).not.toBeInTheDocument();
  });
});
