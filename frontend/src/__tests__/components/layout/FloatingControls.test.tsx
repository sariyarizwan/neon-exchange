import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingControls } from "@/components/layout/FloatingControls";
import { useNeonStore } from "@/store/useNeonStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/mockAuth", () => ({
  clearStoredAuth: vi.fn(),
}));

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

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  guest: false,
  avatarId: "runner",
};

describe("FloatingControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      selectedDistrictId: null,
      selectedTickerId: null,
      pluginMode: false,
      sound: {
        enabled: true,
        volume: 62,
        bootstrapped: false,
        needsGesture: false,
        playing: false,
        trackName: "Gemini Guide (Mock)",
        mode: "guide",
      },
      dock: {
        connected: true,
        micActive: false,
        transcriptLines: [],
        persona: "Market Maker",
      },
      player: { x: 0, y: 0, vx: 0, vy: 0, facing: "down", avatarId: "runner" },
      showPoiMarkers: false,
      showAlliances: false,
      showStorms: true,
      showRumors: true,
    });
  });

  it("renders districts button", () => {
    render(<FloatingControls user={mockUser} />);
    expect(screen.getByRole("button", { name: "Districts" })).toBeInTheDocument();
  });

  it("renders settings button", () => {
    render(<FloatingControls user={mockUser} />);
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("clicking districts button opens districts panel", async () => {
    render(<FloatingControls user={mockUser} />);
    const districtBtn = screen.getByRole("button", { name: "Districts" });
    await userEvent.click(districtBtn);
    expect(screen.getByText("Districts")).toBeInTheDocument();
    // Districts panel includes ticker search
    expect(screen.getByPlaceholderText("Find a ticker...")).toBeInTheDocument();
  });

  it("clicking settings button opens settings panel", async () => {
    render(<FloatingControls user={mockUser} />);
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    await userEvent.click(settingsBtn);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("shows user display name in settings panel", async () => {
    render(<FloatingControls user={mockUser} />);
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    await userEvent.click(settingsBtn);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("districts panel lists districts from mock data", async () => {
    render(<FloatingControls user={mockUser} />);
    const districtBtn = screen.getByRole("button", { name: "Districts" });
    await userEvent.click(districtBtn);
    // CONSUMER STRIP is one of the mock districts (all caps in mock data)
    expect(screen.getByText("CONSUMER STRIP")).toBeInTheDocument();
  });

  it("ticker search filters tickers by symbol", async () => {
    render(<FloatingControls user={mockUser} />);
    const districtBtn = screen.getByRole("button", { name: "Districts" });
    await userEvent.click(districtBtn);
    const searchInput = screen.getByPlaceholderText("Find a ticker...");
    await userEvent.type(searchInput, "NVX");
    // Should show NVX result
    expect(screen.getByText("NVX")).toBeInTheDocument();
  });

  it("shows 'No signals found' when search returns nothing", async () => {
    render(<FloatingControls user={mockUser} />);
    const districtBtn = screen.getByRole("button", { name: "Districts" });
    await userEvent.click(districtBtn);
    const searchInput = screen.getByPlaceholderText("Find a ticker...");
    await userEvent.type(searchInput, "ZZZZZ");
    expect(screen.getByText("No signals found.")).toBeInTheDocument();
  });

  it("avatar picker shows avatar options in settings panel", async () => {
    render(<FloatingControls user={mockUser} />);
    const settingsBtn = screen.getByRole("button", { name: "Settings" });
    await userEvent.click(settingsBtn);
    expect(screen.getByText("Avatar Picker")).toBeInTheDocument();
  });

  it("closing districts panel with X removes the panel", async () => {
    render(<FloatingControls user={mockUser} />);
    const districtBtn = screen.getByRole("button", { name: "Districts" });
    await userEvent.click(districtBtn);
    // Districts panel now open
    const closeBtn = screen.getByRole("button", { name: "Close districts panel" });
    await userEvent.click(closeBtn);
    expect(screen.queryByPlaceholderText("Find a ticker...")).not.toBeInTheDocument();
  });
});
