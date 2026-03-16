import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock useLiveData (the hook that CityCanvas calls)
// ---------------------------------------------------------------------------
vi.mock("@/components/LiveDataProvider", () => ({
  useLiveData: () => ({
    tickers: null,
    news: null,
    districtStates: null,
    signals: null,
    marketMood: "neutral",
    connected: false,
    isLive: false
  })
}));

// ---------------------------------------------------------------------------
// Mock useNeonStore — avoid localStorage and complex store init
// ---------------------------------------------------------------------------
vi.mock("@/store/useNeonStore", async () => {
  const { create } = await import("zustand");
  const store = create(() => ({
    selectedTickerId: null,
    selectedDistrictId: null,
    stormModeActive: false,
    showAlliances: false,
    showPoiMarkers: false,
    pluginMode: false,
    overlaysDimmed: false,
    scenePulse: { districtId: null, startedAt: 0, expiresAt: 0, kind: null },
    camera: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      zoom: 1,
      viewportWidth: 1200,
      viewportHeight: 800,
      targetX: null,
      targetY: null
    },
    player: {
      x: 1760,
      y: 1450,
      vx: 0,
      vy: 0,
      facing: "down",
      avatarId: "runner"
    },
    guide: { speaking: false, message: null },
    dock: {
      connected: true,
      micActive: false,
      transcriptLines: [],
      persona: "Market Maker"
    },
    droneState: "calm",
    setViewport: vi.fn(),
    setCamera: vi.fn(),
    setPlayer: vi.fn(),
    clearCameraTarget: vi.fn(),
    markWorldMotion: vi.fn(),
    setSelectedTickerId: vi.fn(),
    setSelectedDistrictId: vi.fn(),
    setActiveRightPanelTab: vi.fn(),
    setActiveNewsstandDistrictId: vi.fn(),
    setDistrictPopupId: vi.fn(),
    triggerDistrictPulse: vi.fn(),
    setPluginMode: vi.fn(),
    setDroneState: vi.fn(),
    advanceOnboarding: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn()
  }));

  return { useNeonStore: store };
});

// ---------------------------------------------------------------------------
// Mock the Tooltip component (used inside CityCanvas for hover entities)
// ---------------------------------------------------------------------------
vi.mock("@/components/ui/Tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { CityCanvas } from "@/components/city/CityCanvas";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CityCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a canvas element", () => {
    act(() => {
      render(<CityCanvas />);
    });
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("canvas has touch-none class (prevents default touch scroll)", () => {
    act(() => {
      render(<CityCanvas />);
    });
    const canvas = document.querySelector("canvas");
    expect(canvas?.classList.contains("touch-none")).toBe(true);
  });

  it("canvas has aria-label for accessibility", () => {
    act(() => {
      render(<CityCanvas />);
    });
    const canvas = document.querySelector("canvas");
    expect(canvas?.getAttribute("aria-label")).toBeTruthy();
  });

  it("renders without crashing with default store state", () => {
    expect(() => {
      act(() => {
        render(<CityCanvas />);
      });
    }).not.toThrow();
  });

  it("cancels animation frame on unmount (RAF is cleaned up)", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    let unmount: () => void;
    act(() => {
      const result = render(<CityCanvas />);
      unmount = result.unmount;
    });

    act(() => {
      unmount();
    });

    expect(cancelSpy).toHaveBeenCalled();
  });
});
