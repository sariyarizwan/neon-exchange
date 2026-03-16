import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { useCameraControls } from "@/components/city/useCameraControls";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCanvasRef(canvas?: HTMLCanvasElement | null) {
  const ref = createRef<HTMLCanvasElement | null>();
  // createRef is readonly so we cast
  (ref as unknown as { current: HTMLCanvasElement | null }).current = canvas ?? document.createElement("canvas");
  return ref;
}

// ---------------------------------------------------------------------------
// useCameraControls tests
// ---------------------------------------------------------------------------

describe("useCameraControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initialises without crashing when canvasRef has a canvas element", () => {
    const ref = makeCanvasRef();
    expect(() => {
      renderHook(() => useCameraControls(ref));
    }).not.toThrow();
  });

  it("initialises without crashing when canvasRef.current is null", () => {
    const ref = makeCanvasRef(null);
    expect(() => {
      renderHook(() => useCameraControls(ref));
    }).not.toThrow();
  });

  it("returns isDragging as false on initial render", () => {
    const ref = makeCanvasRef();
    const { result } = renderHook(() => useCameraControls(ref));
    expect(result.current.isDragging).toBe(false);
  });

  it("returns expected pointer event handler functions", () => {
    const ref = makeCanvasRef();
    const { result } = renderHook(() => useCameraControls(ref));
    expect(typeof result.current.onPointerDown).toBe("function");
    expect(typeof result.current.onPointerMove).toBe("function");
    expect(typeof result.current.onPointerUp).toBe("function");
    expect(typeof result.current.onPointerCancel).toBe("function");
    expect(typeof result.current.onLostPointerCapture).toBe("function");
  });

  it("returns gestureMovedRef with initial active=false", () => {
    const ref = makeCanvasRef();
    const { result } = renderHook(() => useCameraControls(ref));
    expect(result.current.gestureMovedRef.current.active).toBe(false);
    expect(result.current.gestureMovedRef.current.moved).toBe(false);
  });

  it("attaches keydown and keyup event listeners to window on mount", () => {
    const addEventSpy = vi.spyOn(window, "addEventListener");
    const ref = makeCanvasRef();
    renderHook(() => useCameraControls(ref));

    const keydownCalls = addEventSpy.mock.calls.filter(([type]) => type === "keydown");
    const keyupCalls = addEventSpy.mock.calls.filter(([type]) => type === "keyup");
    expect(keydownCalls.length).toBeGreaterThan(0);
    expect(keyupCalls.length).toBeGreaterThan(0);
  });

  it("removes keydown and keyup listeners from window on unmount", () => {
    const removeEventSpy = vi.spyOn(window, "removeEventListener");
    const ref = makeCanvasRef();
    const { unmount } = renderHook(() => useCameraControls(ref));

    act(() => {
      unmount();
    });

    const keydownRemovals = removeEventSpy.mock.calls.filter(([type]) => type === "keydown");
    const keyupRemovals = removeEventSpy.mock.calls.filter(([type]) => type === "keyup");
    expect(keydownRemovals.length).toBeGreaterThan(0);
    expect(keyupRemovals.length).toBeGreaterThan(0);
  });

  it("sets up ResizeObserver on the canvas element", () => {
    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();
    const OriginalResizeObserver = global.ResizeObserver;

    global.ResizeObserver = class {
      observe = observeSpy;
      unobserve = vi.fn();
      disconnect = disconnectSpy;
      constructor(public callback: ResizeObserverCallback) {}
    } as unknown as typeof ResizeObserver;

    const ref = makeCanvasRef();
    const { unmount } = renderHook(() => useCameraControls(ref));

    expect(observeSpy).toHaveBeenCalledWith(ref.current);

    act(() => {
      unmount();
    });

    expect(disconnectSpy).toHaveBeenCalled();

    global.ResizeObserver = OriginalResizeObserver;
  });

  it("cancels animation frame on unmount", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
    const ref = makeCanvasRef();
    const { unmount } = renderHook(() => useCameraControls(ref));

    act(() => {
      unmount();
    });

    expect(cancelSpy).toHaveBeenCalled();
  });

  it("requests animation frame on mount", () => {
    const requestSpy = vi.spyOn(window, "requestAnimationFrame");
    const ref = makeCanvasRef();
    renderHook(() => useCameraControls(ref));

    expect(requestSpy).toHaveBeenCalled();
  });
});
