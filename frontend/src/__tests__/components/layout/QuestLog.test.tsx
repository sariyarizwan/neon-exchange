import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestLog } from "@/components/layout/QuestLog";
import { useNeonStore } from "@/store/useNeonStore";

describe("QuestLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNeonStore.setState({
      questLogOpen: false,
      questLog: [],
    });
  });

  it("renders nothing when questLogOpen is false", () => {
    const { container } = render(<QuestLog />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the quest log panel when questLogOpen is true", () => {
    useNeonStore.setState({ questLogOpen: true });
    render(<QuestLog />);
    expect(screen.getByText("Quest Log")).toBeInTheDocument();
  });

  it("shows empty state message when no active quests", () => {
    useNeonStore.setState({ questLogOpen: true, questLog: [] });
    render(<QuestLog />);
    expect(screen.getByText("No active quests. Explore the city!")).toBeInTheDocument();
  });

  it("renders quest entries when questLog has items", () => {
    useNeonStore.setState({
      questLogOpen: true,
      questLog: [
        {
          id: "q1",
          text: "A storm is brewing in Chip Docks",
          type: "storm",
          districtId: null,
          createdAt: Date.now(),
          active: true,
        },
      ],
    });
    render(<QuestLog />);
    expect(screen.getByText("A storm is brewing in Chip Docks")).toBeInTheDocument();
  });

  it("shows active quest count in the Active tab", () => {
    useNeonStore.setState({
      questLogOpen: true,
      questLog: [
        { id: "q1", text: "Quest 1", type: "storm", districtId: null, createdAt: Date.now(), active: true },
        { id: "q2", text: "Quest 2", type: "news", districtId: null, createdAt: Date.now(), active: false },
      ],
    });
    render(<QuestLog />);
    expect(screen.getByText("Active (1)")).toBeInTheDocument();
    expect(screen.getByText("History (2)")).toBeInTheDocument();
  });

  it("closes when the X button is clicked", async () => {
    useNeonStore.setState({ questLogOpen: true });
    render(<QuestLog />);
    const closeBtn = screen.getByRole("button", { name: "x" });
    await userEvent.click(closeBtn);
    expect(useNeonStore.getState().questLogOpen).toBe(false);
  });

  it("switching to History tab shows all entries", async () => {
    useNeonStore.setState({
      questLogOpen: true,
      questLog: [
        { id: "q1", text: "Active quest", type: "news", districtId: null, createdAt: Date.now(), active: true },
        { id: "q2", text: "Past quest", type: "mood", districtId: null, createdAt: Date.now(), active: false },
      ],
    });
    render(<QuestLog />);

    // Only active shown by default
    expect(screen.getByText("Active quest")).toBeInTheDocument();
    expect(screen.queryByText("Past quest")).not.toBeInTheDocument();

    // Switch to history
    const historyTab = screen.getByText("History (2)");
    await userEvent.click(historyTab);
    expect(screen.getByText("Past quest")).toBeInTheDocument();
    expect(screen.getByText("Active quest")).toBeInTheDocument();
  });

  it("dismiss button calls markQuestInactive", async () => {
    const markQuestInactive = vi.spyOn(useNeonStore.getState(), "markQuestInactive");
    useNeonStore.setState({
      questLogOpen: true,
      questLog: [
        { id: "q1", text: "Active quest", type: "trade", districtId: null, createdAt: Date.now(), active: true },
      ],
    });
    render(<QuestLog />);
    // The dismiss button is the checkmark button
    const dismissBtn = screen.getByTitle("Dismiss");
    await userEvent.click(dismissBtn);
    expect(useNeonStore.getState().questLog[0].active).toBe(false);
  });
});
