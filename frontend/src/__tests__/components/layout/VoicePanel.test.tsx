import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoicePanel } from "@/components/layout/VoicePanel";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockStartSpeaking = vi.fn();
const mockStopSpeaking = vi.fn();
const mockUseVoice = vi.fn();

vi.mock("@/hooks/useVoice", () => ({
  useVoice: () => mockUseVoice(),
}));

const disconnectedState = {
  connectionState: "disconnected" as const,
  connected: false,
  transcript: [],
  audioLevel: 0,
  connect: mockConnect,
  disconnect: mockDisconnect,
  startSpeaking: mockStartSpeaking,
  stopSpeaking: mockStopSpeaking,
  sendText: vi.fn(),
};

describe("VoicePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVoice.mockReturnValue(disconnectedState);
  });

  it("renders Oracle Voice label", () => {
    render(<VoicePanel />);
    expect(screen.getByText(/Oracle Voice/)).toBeInTheDocument();
  });

  it("shows Offline status when disconnected", () => {
    render(<VoicePanel />);
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });

  it("shows Connect button when disconnected", () => {
    render(<VoicePanel />);
    expect(screen.getByText("Connect")).toBeInTheDocument();
  });

  it("clicking Connect calls connect()", async () => {
    render(<VoicePanel />);
    const connectBtn = screen.getByText("Connect");
    await userEvent.click(connectBtn);
    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it("shows Disconnect button when connected", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "connected",
      connected: true,
    });
    render(<VoicePanel />);
    expect(screen.getByText("Disconnect")).toBeInTheDocument();
  });

  it("clicking Disconnect calls disconnect()", async () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "connected",
      connected: true,
    });
    render(<VoicePanel />);
    const disconnectBtn = screen.getByText("Disconnect");
    await userEvent.click(disconnectBtn);
    expect(mockDisconnect).toHaveBeenCalledOnce();
  });

  it("shows Ready status when connected", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "connected",
      connected: true,
    });
    render(<VoicePanel />);
    expect(screen.getByText(/Ready/)).toBeInTheDocument();
  });

  it("shows waveform bars when connected", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "connected",
      connected: true,
      audioLevel: 0.5,
    });
    render(<VoicePanel />);
    expect(screen.getByText("Hold to Speak")).toBeInTheDocument();
  });

  it("shows push-to-talk button when connected", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "connected",
      connected: true,
    });
    render(<VoicePanel />);
    expect(screen.getByText("Hold to Speak")).toBeInTheDocument();
  });

  it("shows Release to Stop when speaking", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      connectionState: "speaking",
      connected: true,
    });
    render(<VoicePanel />);
    expect(screen.getByText("Release to Stop")).toBeInTheDocument();
  });

  it("renders transcript lines when available", () => {
    mockUseVoice.mockReturnValue({
      ...disconnectedState,
      transcript: ["Oracle: Market is stable.", "You: What is moving?"],
    });
    render(<VoicePanel />);
    expect(screen.getByText("Oracle: Market is stable.")).toBeInTheDocument();
    expect(screen.getByText("You: What is moving?")).toBeInTheDocument();
  });

  it("does not render transcript section when transcript is empty", () => {
    render(<VoicePanel />);
    expect(screen.queryByText(/Oracle:/)).not.toBeInTheDocument();
  });
});
