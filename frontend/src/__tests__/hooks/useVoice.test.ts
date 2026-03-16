import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoice } from "@/hooks/useVoice";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api", () => ({
  getVoiceWebSocketUrl: vi.fn(() => "ws://localhost:8080/api/voice"),
}));

// We collect created WebSocket instances so tests can drive events
const mockWsInstances: MockWebSocket[] = [];

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  readyState = MockWebSocket.OPEN;

  constructor(public url: string) {
    mockWsInstances.push(this);
  }
}

beforeEach(() => {
  mockWsInstances.length = 0;
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useVoice", () => {
  it("starts in disconnected state with empty transcript", () => {
    const { result } = renderHook(() => useVoice());

    expect(result.current.connectionState).toBe("disconnected");
    expect(result.current.connected).toBe(false);
    expect(result.current.transcript).toEqual([]);
  });

  it("connect() transitions to connecting then connected when WebSocket opens", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    expect(result.current.connectionState).toBe("connecting");

    // Simulate WS open
    act(() => {
      const ws = mockWsInstances[0];
      ws.onopen?.();
    });

    expect(result.current.connectionState).toBe("connected");
    expect(result.current.connected).toBe(true);
  });

  it("connect() appends a welcome transcript line on open", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockWsInstances[0].onopen?.();
    });

    expect(result.current.transcript.length).toBeGreaterThan(0);
    expect(result.current.transcript[0]).toContain("Oracle:");
  });

  it("sendText() sends JSON via WebSocket and adds to transcript as You", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockWsInstances[0].onopen?.();
    });

    act(() => {
      result.current.sendText("Analyze NVX");
    });

    const ws = mockWsInstances[0];
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({ type: "text", text: "Analyze NVX" })
    );

    expect(result.current.transcript[0]).toContain("You: Analyze NVX");
  });

  it("received text message from WebSocket appended to transcript", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockWsInstances[0].onopen?.();
    });

    act(() => {
      const msg = new MessageEvent("message", {
        data: JSON.stringify({ type: "text", text: "NVX is bullish today." }),
      });
      mockWsInstances[0].onmessage?.(msg);
    });

    expect(
      result.current.transcript.some((line) => line.includes("NVX is bullish"))
    ).toBe(true);
  });

  it("transcript is capped at 30 entries", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockWsInstances[0].onopen?.();
    });

    // Send 35 messages to exceed the cap
    act(() => {
      for (let i = 0; i < 35; i++) {
        const msg = new MessageEvent("message", {
          data: JSON.stringify({ type: "text", text: `Line ${i}` }),
        });
        mockWsInstances[0].onmessage?.(msg);
      }
    });

    expect(result.current.transcript.length).toBeLessThanOrEqual(30);
  });

  it("WebSocket close event sets connectionState to disconnected", () => {
    const { result } = renderHook(() => useVoice());

    act(() => {
      result.current.connect();
    });

    act(() => {
      mockWsInstances[0].onopen?.();
    });

    act(() => {
      mockWsInstances[0].onclose?.();
    });

    expect(result.current.connectionState).toBe("disconnected");
    expect(result.current.connected).toBe(false);
  });
});
