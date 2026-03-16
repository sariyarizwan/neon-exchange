import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingMinimap } from "@/components/layout/FloatingMinimap";
import { useNeonStore } from "@/store/useNeonStore";

// Mock sub-components with heavy dependencies
vi.mock("@/components/layout/FloatingChat", () => ({
  FloatingChatPanel: ({ open }: { open: boolean }) =>
    open ? <div data-testid="floating-chat-panel" /> : null,
}));

vi.mock("@/components/layout/VoicePanel", () => ({
  VoicePanel: () => <div data-testid="voice-panel" />,
}));

describe("FloatingMinimap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      selectedDistrictId: null,
      questLogOpen: false,
      questLog: [],
      legendOverlayOpen: false,
      player: { x: 1000, y: 1000, vx: 0, vy: 0, facing: "down", avatarId: "runner" },
      camera: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        zoom: 1,
        viewportWidth: 1400,
        viewportHeight: 860,
        targetX: null,
        targetY: null,
      },
    });
  });

  it("renders the minimap container", () => {
    render(<FloatingMinimap />);
    // Minimap button should exist
    expect(screen.getByRole("button", { name: "Jump camera using minimap" })).toBeInTheDocument();
  });

  it("renders Quest Log button", () => {
    render(<FloatingMinimap />);
    expect(screen.getByRole("button", { name: "Quest Log (Q)" })).toBeInTheDocument();
  });

  it("renders Market Intel Chat button", () => {
    render(<FloatingMinimap />);
    expect(screen.getByRole("button", { name: "Market Intel Chat" })).toBeInTheDocument();
  });

  it("renders Legend button", () => {
    render(<FloatingMinimap />);
    expect(screen.getByRole("button", { name: "Legend" })).toBeInTheDocument();
  });

  it("renders Metaphor Guide button", () => {
    render(<FloatingMinimap />);
    expect(screen.getByRole("button", { name: "Metaphor Guide (L)" })).toBeInTheDocument();
  });

  it("clicking Quest Log button toggles questLogOpen", async () => {
    render(<FloatingMinimap />);
    const questBtn = screen.getByRole("button", { name: "Quest Log (Q)" });
    await userEvent.click(questBtn);
    expect(useNeonStore.getState().questLogOpen).toBe(true);
  });

  it("shows quest count badge when there are active quests", () => {
    useNeonStore.setState({
      questLog: [
        { id: "q1", text: "Quest 1", type: "storm", districtId: null, createdAt: Date.now(), active: true },
        { id: "q2", text: "Quest 2", type: "news", districtId: null, createdAt: Date.now(), active: true },
      ],
    });
    render(<FloatingMinimap />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("clicking Legend button toggles legend panel", async () => {
    render(<FloatingMinimap />);
    const legendBtn = screen.getByRole("button", { name: "Legend" });
    await userEvent.click(legendBtn);
    expect(screen.getByText("Legend")).toBeInTheDocument();
    expect(screen.getByText("Districts")).toBeInTheDocument();
  });

  it("clicking Metaphor Guide button toggles legendOverlayOpen", async () => {
    render(<FloatingMinimap />);
    const guideBtn = screen.getByRole("button", { name: "Metaphor Guide (L)" });
    await userEvent.click(guideBtn);
    expect(useNeonStore.getState().legendOverlayOpen).toBe(true);
  });

  it("renders voice panel", () => {
    render(<FloatingMinimap />);
    expect(screen.getByTestId("voice-panel")).toBeInTheDocument();
  });

  it("renders SVG minimap with district zones", () => {
    render(<FloatingMinimap />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("chat panel is hidden by default", () => {
    render(<FloatingMinimap />);
    expect(screen.queryByTestId("floating-chat-panel")).not.toBeInTheDocument();
  });

  it("clicking chat button shows chat panel", async () => {
    render(<FloatingMinimap />);
    const chatBtn = screen.getByRole("button", { name: "Market Intel Chat" });
    await userEvent.click(chatBtn);
    expect(screen.getByTestId("floating-chat-panel")).toBeInTheDocument();
  });
});
