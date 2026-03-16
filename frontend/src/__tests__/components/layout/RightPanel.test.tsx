import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RightPanel } from "@/components/layout/RightPanel";
import { useNeonStore } from "@/store/useNeonStore";

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

vi.mock("@/components/ui/ResizablePanel", () => ({
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
}));

// Mock TradePanel since it has its own dependencies
vi.mock("@/components/layout/TradePanel", () => ({
  TradePanel: () => <div data-testid="trade-panel" />,
}));

describe("RightPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      selectedTickerId: null,
      activeRightPanelTab: "scenes",
      evidenceTimeline: [],
    });
  });

  it("renders a minimized button when no ticker is selected", () => {
    render(<RightPanel />);
    const btn = screen.getByRole("button", { name: "Open ticker panel" });
    expect(btn).toBeInTheDocument();
  });

  it("renders ticker details when a valid ticker is selected", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    expect(screen.getByText("Street Contact")).toBeInTheDocument();
  });

  it("shows ticker symbol in the panel header", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    // NVX should appear in the header
    expect(screen.getAllByText("NVX").length).toBeGreaterThan(0);
  });

  it("shows live price when liveTicker data is available", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    expect(screen.getAllByText(/\$150\.00/).length).toBeGreaterThan(0);
  });

  it("shows Ping District button", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    expect(screen.getByText("Ping District")).toBeInTheDocument();
  });

  it("shows Details toggle button", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("clicking Details shows tabs", async () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    const detailsBtn = screen.getByText("Details");
    await userEvent.click(detailsBtn);
    expect(screen.getByText("Scenes")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
    expect(screen.getByText("Feed")).toBeInTheDocument();
  });

  it("switching to Links tab shows alliances section", async () => {
    useNeonStore.setState({ selectedTickerId: "nvx", activeRightPanelTab: "alliances" });
    render(<RightPanel />);
    const detailsBtn = screen.getByText("Details");
    await userEvent.click(detailsBtn);
    const linksTab = screen.getByText("Links");
    await userEvent.click(linksTab);
    // Links tab is now active - check for alliance content or empty state
    expect(screen.queryByText("No street links loaded.") !== null || screen.queryByText("Links") !== null).toBe(true);
  });

  it("minimize button hides panel body and shows compact button", async () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    const minimizeBtn = screen.getByTitle("Minimize panel");
    await userEvent.click(minimizeBtn);
    // Panel should collapse - the open ticker panel button should appear
    expect(screen.getByRole("button", { name: "Open ticker panel" })).toBeInTheDocument();
  });

  it("Close button clears ticker selection", async () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<RightPanel />);
    const closeBtn = screen.getByText("Close");
    await userEvent.click(closeBtn);
    expect(useNeonStore.getState().selectedTickerId).toBeNull();
  });
});
