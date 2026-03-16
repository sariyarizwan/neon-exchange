import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradePanel } from "@/components/layout/TradePanel";
import { useNeonStore } from "@/store/useNeonStore";

// Mock LiveDataProvider
vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => ({
    tickers: {
      nvx: {
        price: 150.0,
        changePct: 2.5,
        mood: "confident",
        trend: "up",
        regime: "calm",
        momentum: 0.3,
        neonId: "nvx",
        neonSymbol: "NVX",
      },
    },
    districtStates: null,
    signals: null,
    news: [],
    marketMood: "cautious",
    isLive: false,
    connected: false,
  }),
}));

describe("TradePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      selectedTickerId: null,
      portfolio: [],
      paperBalance: 100000,
      synergyBurst: { active: false, expiresAt: 0, recentTrades: [] },
    });
  });

  it("renders nothing when no ticker is selected", () => {
    const { container } = render(<TradePanel />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the simulated paper trade disclaimer", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    expect(screen.getByText(/Simulated/)).toBeInTheDocument();
  });

  it("renders paper balance when ticker is selected with live data", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("$100,000.00")).toBeInTheDocument();
  });

  it("renders Acquire Uplink button", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    expect(screen.getByText("Acquire Uplink")).toBeInTheDocument();
  });

  it("renders Extract button", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    expect(screen.getByText("Extract")).toBeInTheDocument();
  });

  it("Extract button is disabled when no position held", () => {
    useNeonStore.setState({ selectedTickerId: "nvx", portfolio: [] });
    render(<TradePanel />);
    const extractBtn = screen.getByText("Extract");
    expect(extractBtn.closest("button")).toBeDisabled();
  });

  it("Acquire button is enabled when sufficient balance", () => {
    useNeonStore.setState({ selectedTickerId: "nvx", paperBalance: 100000 });
    render(<TradePanel />);
    const acquireBtn = screen.getByText("Acquire Uplink");
    expect(acquireBtn.closest("button")).not.toBeDisabled();
  });

  it("clicking Acquire Uplink calls acquireUplink and adds quest toast", async () => {
    useNeonStore.setState({ selectedTickerId: "nvx", paperBalance: 100000 });
    render(<TradePanel />);
    const acquireBtn = screen.getByText("Acquire Uplink");
    await userEvent.click(acquireBtn);
    // Check balance decreased (10 shares * $150 = $1500)
    expect(useNeonStore.getState().paperBalance).toBe(98500);
    // Check quest toast was added
    expect(useNeonStore.getState().questToasts.length).toBeGreaterThan(0);
  });

  it("shows existing position when portfolio has the ticker", () => {
    useNeonStore.setState({
      selectedTickerId: "nvx",
      portfolio: [
        {
          tickerId: "nvx",
          symbol: "NVX",
          districtId: "chip-docks",
          shares: 50,
          avgPrice: 140.0,
          acquiredAt: Date.now(),
        },
      ],
    });
    render(<TradePanel />);
    expect(screen.getByText("Position: 50 shares")).toBeInTheDocument();
  });

  it("shows Paper Trade label", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    expect(screen.getByText("Paper Trade")).toBeInTheDocument();
  });

  it("quantity input has data-ignore-camera-keys attribute", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<TradePanel />);
    const qtyInput = screen.getByRole("spinbutton");
    expect(qtyInput).toHaveAttribute("data-ignore-camera-keys", "true");
  });
});
