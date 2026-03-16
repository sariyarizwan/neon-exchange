import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TickerTape } from "@/components/layout/TickerTape";

const mockUseLiveData = vi.fn();

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => mockUseLiveData(),
}));

describe("TickerTape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when tickers is null", () => {
    mockUseLiveData.mockReturnValue({ tickers: null });
    const { container } = render(<TickerTape />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when tickers is empty object", () => {
    mockUseLiveData.mockReturnValue({ tickers: {} });
    const { container } = render(<TickerTape />);
    expect(container.firstChild).toBeNull();
  });

  it("renders ticker symbols when data is available", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        nvx: {
          neonId: "nvx",
          neonSymbol: "NVX",
          price: 150.0,
          changePct: 2.5,
          mood: "confident",
          trend: "up",
          regime: "calm",
          momentum: 0.3,
        },
      },
    });
    render(<TickerTape />);
    // NVX should appear (duplicated for scroll, so at least once)
    expect(screen.getAllByText("NVX").length).toBeGreaterThan(0);
  });

  it("renders price with $ sign", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        nvx: {
          neonId: "nvx",
          neonSymbol: "NVX",
          price: 150.0,
          changePct: 2.5,
          mood: "confident",
          trend: "up",
          regime: "calm",
          momentum: 0.3,
        },
      },
    });
    render(<TickerTape />);
    expect(screen.getAllByText("$150.00").length).toBeGreaterThan(0);
  });

  it("renders positive change with + prefix", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        nvx: {
          neonId: "nvx",
          neonSymbol: "NVX",
          price: 150.0,
          changePct: 2.5,
          mood: "confident",
          trend: "up",
          regime: "calm",
          momentum: 0.3,
        },
      },
    });
    render(<TickerTape />);
    expect(screen.getAllByText("+2.50%").length).toBeGreaterThan(0);
  });

  it("renders negative change without + prefix", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        qntm: {
          neonId: "qntm",
          neonSymbol: "QNTM",
          price: 80.0,
          changePct: -1.3,
          mood: "nervous",
          trend: "down",
          regime: "choppy",
          momentum: -0.1,
        },
      },
    });
    render(<TickerTape />);
    expect(screen.getAllByText("-1.30%").length).toBeGreaterThan(0);
  });

  it("sorts tickers by absolute change percentage descending", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        nvx: {
          neonId: "nvx",
          neonSymbol: "NVX",
          price: 150.0,
          changePct: 0.5,
          mood: "confident",
          trend: "up",
          regime: "calm",
          momentum: 0.1,
        },
        qntm: {
          neonId: "qntm",
          neonSymbol: "QNTM",
          price: 80.0,
          changePct: -5.0,
          mood: "nervous",
          trend: "down",
          regime: "storm",
          momentum: -0.4,
        },
      },
    });
    render(<TickerTape />);
    const allText = document.body.textContent ?? "";
    // QNTM (bigger mover) should appear before NVX in document order
    const qntmPos = allText.indexOf("QNTM");
    const nvxPos = allText.indexOf("NVX");
    expect(qntmPos).toBeLessThan(nvxPos);
  });

  it("duplicates entries for seamless scroll", () => {
    mockUseLiveData.mockReturnValue({
      tickers: {
        nvx: {
          neonId: "nvx",
          neonSymbol: "NVX",
          price: 150.0,
          changePct: 2.5,
          mood: "confident",
          trend: "up",
          regime: "calm",
          momentum: 0.3,
        },
      },
    });
    render(<TickerTape />);
    // Should appear twice (original + duplicate for loop)
    expect(screen.getAllByText("NVX")).toHaveLength(2);
  });
});
