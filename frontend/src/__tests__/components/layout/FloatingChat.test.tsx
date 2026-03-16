import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingChatPanel } from "@/components/layout/FloatingChat";
import { useNeonStore } from "@/store/useNeonStore";

// Mock useChat hook
const mockSend = vi.fn();
vi.mock("@/hooks/useChat", () => ({
  SUGGESTED_PROMPTS: ["What's moving in Chip Docks?", "Analyze NVX momentum"],
  useChat: () => ({
    messages: [
      {
        id: "welcome",
        role: "assistant",
        text: "Market intel online.",
        timestamp: "12:00",
      },
    ],
    sending: false,
    error: null,
    send: mockSend,
    clearError: vi.fn(),
  }),
}));

// Mock LiveDataProvider
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

// Mock ResizablePanel to pass-through children
vi.mock("@/components/ui/ResizablePanel", () => ({
  ResizablePanel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="resizable-panel">{children}</div>
  ),
}));

// Mock react-markdown
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

const mockOnToggle = vi.fn();

describe("FloatingChatPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      selectedDistrictId: null,
      selectedTickerId: null,
    });
  });

  it("renders nothing when open=false", () => {
    const { container } = render(
      <FloatingChatPanel open={false} onToggle={mockOnToggle} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the chat panel when open=true", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    expect(screen.getByText("Market Intel")).toBeInTheDocument();
  });

  it("renders welcome message from useChat", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    expect(screen.getByText("Market intel online.")).toBeInTheDocument();
  });

  it("calls onToggle when close button is clicked", async () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const closeBtn = screen.getByTitle("Close");
    await userEvent.click(closeBtn);
    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it("send button is disabled when input is empty", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const sendBtn = screen.getByRole("button", { name: "Send" });
    expect(sendBtn).toBeDisabled();
  });

  it("send button becomes enabled when user types", async () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const input = screen.getByPlaceholderText("Ask about the market...");
    await userEvent.type(input, "hello");
    const sendBtn = screen.getByRole("button", { name: "Send" });
    expect(sendBtn).not.toBeDisabled();
  });

  it("calls send when Send button is clicked with text", async () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const input = screen.getByPlaceholderText("Ask about the market...");
    await userEvent.type(input, "What is happening?");
    const sendBtn = screen.getByRole("button", { name: "Send" });
    await userEvent.click(sendBtn);
    expect(mockSend).toHaveBeenCalledWith("What is happening?");
  });

  it("calls send when Enter key is pressed", async () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const input = screen.getByPlaceholderText("Ask about the market...");
    await userEvent.type(input, "market update{Enter}");
    expect(mockSend).toHaveBeenCalledWith("market update");
  });

  it("input wrapper has data-ignore-camera-keys attribute", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const inputArea = document
      .querySelector('[data-ignore-camera-keys="true"]');
    expect(inputArea).toBeInTheDocument();
  });

  it("shows suggested prompts when messages <= 1", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    expect(screen.getByText("What's moving in Chip Docks?")).toBeInTheDocument();
    expect(screen.getByText("Analyze NVX momentum")).toBeInTheDocument();
  });

  it("clicking a suggested prompt calls send", async () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const promptBtn = screen.getByText("Analyze NVX momentum");
    await userEvent.click(promptBtn);
    expect(mockSend).toHaveBeenCalledWith("Analyze NVX momentum");
  });

  it("shows district badge when selectedDistrictId is set", () => {
    useNeonStore.setState({ selectedDistrictId: "chip-docks" });
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    expect(screen.getByText("chip docks")).toBeInTheDocument();
  });

  it("shows ticker badge when selectedTickerId is set", () => {
    useNeonStore.setState({ selectedTickerId: "nvx" });
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    expect(screen.getByText("nvx")).toBeInTheDocument();
  });

  it("shows offline indicator when not connected", () => {
    render(<FloatingChatPanel open={true} onToggle={mockOnToggle} />);
    const dot = screen.getByTitle("Offline");
    expect(dot).toBeInTheDocument();
  });
});
