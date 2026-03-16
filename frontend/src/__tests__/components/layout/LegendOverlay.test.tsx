import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LegendOverlay } from "@/components/layout/LegendOverlay";
import { useNeonStore } from "@/store/useNeonStore";

describe("LegendOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNeonStore.setState({
      legendOverlayOpen: false,
      legendSeenOnce: true, // Prevent auto-show in tests
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when legendOverlayOpen is false", () => {
    const { container } = render(<LegendOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the overlay when legendOverlayOpen is true", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText("How to Read the Market")).toBeInTheDocument();
  });

  it("shows the City Guide header", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText("City Guide")).toBeInTheDocument();
  });

  it("shows Weather -> Volatility mapping", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText("Weather")).toBeInTheDocument();
    expect(screen.getByText("Volatility")).toBeInTheDocument();
  });

  it("shows Traffic -> Liquidity mapping", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText("Traffic")).toBeInTheDocument();
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
  });

  it("shows NPC Mood mapping", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText("NPC Mood")).toBeInTheDocument();
    expect(screen.getByText("Trend / Momentum")).toBeInTheDocument();
  });

  it("clicking Got it closes the overlay", () => {
    vi.useRealTimers();
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    const gotItBtn = screen.getAllByText("Got it")[0];
    gotItBtn.click();
    expect(useNeonStore.getState().legendOverlayOpen).toBe(false);
  });

  it("Got it also sets legendSeenOnce", () => {
    vi.useRealTimers();
    useNeonStore.setState({ legendOverlayOpen: true, legendSeenOnce: false });
    render(<LegendOverlay />);
    const gotItBtn = screen.getAllByText("Got it")[0];
    gotItBtn.click();
    expect(useNeonStore.getState().legendSeenOnce).toBe(true);
  });

  it("auto-opens after 2 seconds if legendSeenOnce is false", () => {
    useNeonStore.setState({ legendOverlayOpen: false, legendSeenOnce: false });
    render(<LegendOverlay />);
    // Should not be visible yet
    expect(useNeonStore.getState().legendOverlayOpen).toBe(false);
    // After 2 seconds
    vi.advanceTimersByTime(2001);
    expect(useNeonStore.getState().legendOverlayOpen).toBe(true);
  });

  it("does NOT auto-open if legendSeenOnce is true", () => {
    useNeonStore.setState({ legendOverlayOpen: false, legendSeenOnce: true });
    render(<LegendOverlay />);
    vi.advanceTimersByTime(2001);
    expect(useNeonStore.getState().legendOverlayOpen).toBe(false);
  });

  it("shows hint text for weather mapping", () => {
    useNeonStore.setState({ legendOverlayOpen: true });
    render(<LegendOverlay />);
    expect(screen.getByText(/Storm means risk/)).toBeInTheDocument();
  });
});
