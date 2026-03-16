import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import type { OHLCCandle } from "@/lib/api";

const makeCandle = (open: number, high: number, low: number, close: number): OHLCCandle => ({
  open,
  high,
  low,
  close,
  timestamp: Date.now(),
});

describe("CandlestickChart", () => {
  it("renders a canvas element", () => {
    const { container } = render(<CandlestickChart candles={[]} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders without crashing with empty candles", () => {
    expect(() => render(<CandlestickChart candles={[]} />)).not.toThrow();
  });

  it("renders without crashing with a single candle", () => {
    const candles = [makeCandle(100, 110, 90, 105)];
    expect(() => render(<CandlestickChart candles={candles} />)).not.toThrow();
  });

  it("renders without crashing with many candles", () => {
    const candles = Array.from({ length: 30 }, (_, i) =>
      makeCandle(100 + i, 110 + i, 90 + i, 105 + i)
    );
    expect(() => render(<CandlestickChart candles={candles} />)).not.toThrow();
  });

  it("applies default width and height of 280x160", () => {
    const { container } = render(<CandlestickChart candles={[]} />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.width).toBe("280px");
    expect(canvas.style.height).toBe("160px");
  });

  it("applies custom width and height", () => {
    const { container } = render(
      <CandlestickChart candles={[]} width={400} height={200} />
    );
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.width).toBe("400px");
    expect(canvas.style.height).toBe("200px");
  });

  it("calls getContext to draw when candles are present", () => {
    const candles = [
      makeCandle(100, 110, 90, 105),
      makeCandle(105, 115, 95, 110),
    ];
    render(<CandlestickChart candles={candles} />);
    const ctx = HTMLCanvasElement.prototype.getContext as ReturnType<typeof vi.fn>;
    expect(ctx).toHaveBeenCalled();
  });

  it("handles down candle (close < open) without crashing", () => {
    const candles = [makeCandle(110, 115, 80, 85)];
    expect(() => render(<CandlestickChart candles={candles} />)).not.toThrow();
  });

  it("handles equal open and close (doji candle) without crashing", () => {
    const candles = [makeCandle(100, 110, 90, 100)];
    expect(() => render(<CandlestickChart candles={candles} />)).not.toThrow();
  });

  it("handles extreme price ranges without crashing", () => {
    const candles = [
      makeCandle(0.01, 0.02, 0.005, 0.015),
      makeCandle(99999, 100000, 98000, 99500),
    ];
    expect(() => render(<CandlestickChart candles={candles} />)).not.toThrow();
  });

  it("has rounded-lg class on canvas", () => {
    const { container } = render(<CandlestickChart candles={[]} />);
    const canvas = container.querySelector("canvas");
    expect(canvas?.className).toContain("rounded-lg");
  });
});
