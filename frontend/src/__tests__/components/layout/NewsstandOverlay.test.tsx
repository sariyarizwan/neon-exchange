import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsstandOverlay } from "@/components/layout/NewsstandOverlay";
import { useNeonStore } from "@/store/useNeonStore";

const mockUseNewsstand = vi.fn();

vi.mock("@/hooks/useNewsstand", () => ({
  useNewsstand: (districtId: string | null) => mockUseNewsstand(districtId),
}));

describe("NewsstandOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseNewsstand.mockReturnValue([]);
    useNeonStore.setState({ activeNewsstandDistrictId: null });
  });

  it("renders nothing when activeNewsstandDistrictId is null", () => {
    const { container } = render(<NewsstandOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when districtId is set but news is empty", () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "chip-docks" });
    mockUseNewsstand.mockReturnValue([]);
    const { container } = render(<NewsstandOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders newsstand header when districtId and news are present", () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "chip-docks" });
    mockUseNewsstand.mockReturnValue([
      {
        headline: "Chip shortage eases",
        severity: "low",
        timestamp: "2024-01-01T00:00:00Z",
        source: "Reuters",
        district_id: "chip-docks",
        sector: "tech",
        tickers: ["NVX"],
      },
    ]);
    render(<NewsstandOverlay />);
    expect(screen.getByText("chip docks Newsstand")).toBeInTheDocument();
  });

  it("renders news headlines", () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "chip-docks" });
    mockUseNewsstand.mockReturnValue([
      {
        headline: "Chip shortage eases globally",
        severity: "low",
        timestamp: "2024-01-01T00:00:00Z",
        source: "Reuters",
        district_id: "chip-docks",
        sector: "tech",
        tickers: ["NVX"],
      },
    ]);
    render(<NewsstandOverlay />);
    expect(screen.getByText("Chip shortage eases globally")).toBeInTheDocument();
  });

  it("close button clears activeNewsstandDistrictId", async () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "chip-docks" });
    mockUseNewsstand.mockReturnValue([
      {
        headline: "News headline",
        severity: "low",
        timestamp: "2024-01-01T00:00:00Z",
        source: "Reuters",
        district_id: "chip-docks",
        sector: "tech",
        tickers: [],
      },
    ]);
    render(<NewsstandOverlay />);
    const closeBtn = screen.getByRole("button", { name: "x" });
    await userEvent.click(closeBtn);
    expect(useNeonStore.getState().activeNewsstandDistrictId).toBeNull();
  });

  it("shows ticker tags in news cards", () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "chip-docks" });
    mockUseNewsstand.mockReturnValue([
      {
        headline: "NVX surges on AI demand",
        severity: "high",
        timestamp: "2024-01-01T00:00:00Z",
        source: "Bloomberg",
        district_id: "chip-docks",
        sector: "tech",
        tickers: ["NVX", "QNTM"],
      },
    ]);
    render(<NewsstandOverlay />);
    expect(screen.getByText("NVX")).toBeInTheDocument();
    expect(screen.getByText("QNTM")).toBeInTheDocument();
  });

  it("passes districtId to useNewsstand hook", () => {
    useNeonStore.setState({ activeNewsstandDistrictId: "consumer-strip" });
    mockUseNewsstand.mockReturnValue([
      {
        headline: "Retail sales surge",
        severity: "low",
        timestamp: "2024-01-01T00:00:00Z",
        source: "CNBC",
        district_id: "consumer-strip",
        sector: "consumer",
        tickers: [],
      },
    ]);
    render(<NewsstandOverlay />);
    expect(mockUseNewsstand).toHaveBeenCalledWith("consumer-strip");
  });
});
