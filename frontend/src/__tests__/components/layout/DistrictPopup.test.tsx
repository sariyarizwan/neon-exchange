import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistrictPopup } from "@/components/layout/DistrictPopup";
import { useNeonStore } from "@/store/useNeonStore";

vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => ({
    tickers: null,
    districtStates: null,
    signals: null,
    news: [],
    marketMood: null,
    isLive: false,
    connected: false,
  }),
}));

vi.mock("@/hooks/useMarketData", () => ({
  useMarketData: () => ({
    snapshot: null,
    candles: {},
    loading: false,
    error: null,
  }),
}));

vi.mock("@/components/ui/ResizablePanel", () => ({
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
}));

vi.mock("@/components/ui/CandlestickChart", () => ({
  CandlestickChart: () => <canvas data-testid="candlestick-chart" />,
}));

describe("DistrictPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({ districtPopupId: null });
  });

  it("renders nothing when districtPopupId is null", () => {
    const { container } = render(<DistrictPopup />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for unknown districtPopupId", () => {
    useNeonStore.setState({ districtPopupId: "non-existent-district" });
    const { container } = render(<DistrictPopup />);
    expect(container.firstChild).toBeNull();
  });

  it("renders district name when districtPopupId is valid", () => {
    // Use the first district from mock data (consumer-strip)
    useNeonStore.setState({ districtPopupId: "consumer-strip" });
    render(<DistrictPopup />);
    // CONSUMER STRIP is the name in mock data (all caps)
    expect(screen.getByText("CONSUMER STRIP")).toBeInTheDocument();
  });

  it("shows close button that clears districtPopupId", async () => {
    useNeonStore.setState({ districtPopupId: "consumer-strip" });
    render(<DistrictPopup />);
    const closeBtn = screen.getByRole("button", { name: "x" });
    await userEvent.click(closeBtn);
    expect(useNeonStore.getState().districtPopupId).toBeNull();
  });

  it("shows sector in district stats", () => {
    useNeonStore.setState({ districtPopupId: "consumer-strip" });
    render(<DistrictPopup />);
    // District stats section should have Sector label
    expect(screen.getByText("Sector:")).toBeInTheDocument();
  });

  it("shows accumulating market data when no candles", () => {
    useNeonStore.setState({ districtPopupId: "consumer-strip" });
    render(<DistrictPopup />);
    expect(screen.getByText("Accumulating market data...")).toBeInTheDocument();
  });

  it("shows tickers in district section", () => {
    useNeonStore.setState({ districtPopupId: "consumer-strip" });
    render(<DistrictPopup />);
    expect(screen.getByText("Tickers in District")).toBeInTheDocument();
  });
});
