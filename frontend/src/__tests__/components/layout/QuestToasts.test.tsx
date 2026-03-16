import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestToasts } from "@/components/layout/QuestToasts";
import { useNeonStore } from "@/store/useNeonStore";

describe("QuestToasts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNeonStore.setState({ questToasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when questToasts is empty", () => {
    const { container } = render(<QuestToasts />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a toast when questToasts has items", () => {
    useNeonStore.setState({
      questToasts: [
        { id: "t1", text: "Acquired 10 NVX @ $100.00", type: "trade", createdAt: Date.now() },
      ],
    });
    render(<QuestToasts />);
    expect(screen.getByText("Acquired 10 NVX @ $100.00")).toBeInTheDocument();
  });

  it("renders at most 3 toasts", () => {
    useNeonStore.setState({
      questToasts: [
        { id: "t1", text: "Toast 1", type: "storm", createdAt: Date.now() },
        { id: "t2", text: "Toast 2", type: "news", createdAt: Date.now() },
        { id: "t3", text: "Toast 3", type: "mood", createdAt: Date.now() },
        { id: "t4", text: "Toast 4", type: "crowd", createdAt: Date.now() },
      ],
    });
    render(<QuestToasts />);
    expect(screen.getByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();
    expect(screen.queryByText("Toast 4")).not.toBeInTheDocument();
  });

  it("dismiss button removes the toast from store", () => {
    useNeonStore.setState({
      questToasts: [
        { id: "t1", text: "Dismiss me", type: "trade", createdAt: Date.now() },
      ],
    });
    render(<QuestToasts />);
    const dismissBtn = screen.getByText("x");
    dismissBtn.click();
    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });

  it("shows the storm toast icon for storm type", () => {
    useNeonStore.setState({
      questToasts: [
        { id: "t1", text: "Storm alert", type: "storm", createdAt: Date.now() },
      ],
    });
    render(<QuestToasts />);
    // Storm icon is ⚡ (U+26A1)
    expect(screen.getByText("⚡")).toBeInTheDocument();
  });

  it("auto-dismisses toast after 6 seconds", () => {
    useNeonStore.setState({
      questToasts: [
        { id: "t1", text: "Auto dismiss", type: "trade", createdAt: Date.now() },
      ],
    });
    render(<QuestToasts />);
    expect(screen.getByText("Auto dismiss")).toBeInTheDocument();
    vi.advanceTimersByTime(6100);
    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });
});
