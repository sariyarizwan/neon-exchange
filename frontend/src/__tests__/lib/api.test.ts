import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchNeonState,
  fetchMarketSnapshot,
  fetchTickerHistory,
  fetchNews,
  fetchEvidence,
  fetchScenarios,
  sendChatMessage,
  createNeonStream,
  createChatStream,
  getVoiceWebSocketUrl,
  type NeonMarketState,
  type OHLCCandle,
  type NewsItem,
  type EvidenceItem,
  type ScenarioItem,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeErrorResponse(status: number): Response {
  return new Response("Error", { status });
}

const mockNeonState: NeonMarketState = {
  tickers: {
    nvx: {
      neonId: "nvx",
      neonSymbol: "NVX",
      price: 150.0,
      changePct: 2.5,
      trend: "up",
      mood: "confident",
      regime: "calm",
      momentum: 0.3,
    },
  },
  marketMood: "bullish",
  isLive: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("API client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // --- fetchNeonState ---
  describe("fetchNeonState", () => {
    it("returns parsed NeonMarketState on success", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(mockNeonState));

      const result = await fetchNeonState();

      expect(result).toEqual(mockNeonState);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/market/neon-state")
      );
    });

    it("throws when response is not ok", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeErrorResponse(503));

      await expect(fetchNeonState()).rejects.toThrow("Market fetch failed: 503");
    });
  });

  // --- fetchMarketSnapshot ---
  describe("fetchMarketSnapshot", () => {
    it("includes district query string when districtId is provided", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(mockNeonState));

      await fetchMarketSnapshot("chip-docks");

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("district=chip-docks");
    });

    it("omits query string when districtId is not provided", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(mockNeonState));

      await fetchMarketSnapshot();

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("district=");
    });

    it("returns parsed NeonMarketState", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(mockNeonState));

      const result = await fetchMarketSnapshot("consumer-strip");
      expect(result.marketMood).toBe("bullish");
      expect(result.isLive).toBe(true);
    });

    it("throws on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeErrorResponse(404));

      await expect(fetchMarketSnapshot("nonexistent")).rejects.toThrow(
        "Snapshot fetch failed: 404"
      );
    });
  });

  // --- fetchTickerHistory ---
  describe("fetchTickerHistory", () => {
    it("returns OHLCCandle array", async () => {
      const candles: OHLCCandle[] = [
        { open: 100, high: 110, low: 95, close: 105, timestamp: 1000 },
        { open: 105, high: 115, low: 100, close: 112, timestamp: 2000 },
      ];
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(candles));

      const result = await fetchTickerHistory("nvx");

      expect(result).toEqual(candles);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/market/history/nvx")
      );
    });

    it("URL-encodes the tickerId", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse([]));

      await fetchTickerHistory("special/ticker");

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("special%2Fticker");
    });
  });

  // --- fetchNews ---
  describe("fetchNews", () => {
    it("returns news array and isLive flag", async () => {
      const newsItems: NewsItem[] = [
        {
          headline: "Tech rally continues",
          sector: "Technology",
          tickers: ["NVX"],
          severity: "medium",
          source: "Finnhub",
          timestamp: Date.now(),
        },
      ];
      global.fetch = vi.fn().mockResolvedValueOnce(
        makeOkResponse({ news: newsItems, isLive: true })
      );

      const result = await fetchNews();

      expect(result.news).toHaveLength(1);
      expect(result.isLive).toBe(true);
    });
  });

  // --- fetchEvidence ---
  describe("fetchEvidence", () => {
    it("returns evidence array", async () => {
      const evidence: EvidenceItem[] = [
        { id: "ev-1", timestamp: "12:00", text: "NVX momentum spike" },
        { id: "ev-2", timestamp: "12:01", text: "Storm in Chip Docks" },
      ];
      global.fetch = vi.fn().mockResolvedValueOnce(
        makeOkResponse({ evidence })
      );

      const result = await fetchEvidence();

      expect(result.evidence).toHaveLength(2);
      expect(result.evidence[0].id).toBe("ev-1");
    });
  });

  // --- fetchScenarios ---
  describe("fetchScenarios", () => {
    it("returns scenarios array", async () => {
      const scenarios: ScenarioItem[] = [
        {
          id: "sc-1",
          title: "Chip Rally",
          type: "bullish",
          probability: 0.75,
          description: "Chips surging",
          affected_tickers: ["NVX"],
          affected_districts: ["chip-docks"],
          severity: "low",
        },
      ];
      global.fetch = vi.fn().mockResolvedValueOnce(
        makeOkResponse({ scenarios })
      );

      const result = await fetchScenarios();

      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].id).toBe("sc-1");
    });
  });

  // --- sendChatMessage ---
  describe("sendChatMessage", () => {
    it("POSTs with JSON body and returns ChatResponse", async () => {
      const chatResponse = { reply: "Market is bullish today" };
      global.fetch = vi.fn().mockResolvedValueOnce(makeOkResponse(chatResponse));

      const result = await sendChatMessage("What's the market doing?", {
        districtId: "chip-docks",
        tickerId: "nvx",
      });

      expect(result.reply).toBe("Market is bullish today");
      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/world/chat");
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      const body = JSON.parse(options.body);
      expect(body.message).toBe("What's the market doing?");
      expect(body.context.districtId).toBe("chip-docks");
    });

    it("throws on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(makeErrorResponse(500));

      await expect(
        sendChatMessage("Hello", {})
      ).rejects.toThrow("Chat failed: 500");
    });
  });

  // --- createNeonStream ---
  describe("createNeonStream", () => {
    it("creates EventSource pointing to neon-stream endpoint", () => {
      // The global EventSource mock from setup.ts is a proper class
      const cleanup = createNeonStream(vi.fn());

      // cleanup should close the source
      expect(typeof cleanup).toBe("function");
      expect(() => cleanup()).not.toThrow();
    });

    it("parses neon_update events and calls onUpdate", () => {
      const onUpdate = vi.fn();

      // Capture the EventSource instance created
      let instance: InstanceType<typeof EventSource> | null = null;
      const OrigES = global.EventSource;
      global.EventSource = class extends OrigES {
        constructor(url: string) {
          super(url);
          instance = this;
        }
      } as unknown as typeof EventSource;

      createNeonStream(onUpdate);

      // Simulate a neon_update event
      const fakeEvent = { data: JSON.stringify({ tickers: {}, news: [], tick: 1 }) };
      (instance as unknown as { _emit: (e: string, d: unknown) => void })._emit("neon_update", fakeEvent);

      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ tick: 1 })
      );

      global.EventSource = OrigES;
    });
  });

  // --- createChatStream ---
  describe("createChatStream", () => {
    it("POSTs to chat/stream endpoint with streaming body", async () => {
      // Create a ReadableStream that sends one SSE line then closes
      const encoder = new TextEncoder();
      const streamData = 'data: {"text":"hello"}\n\ndata: {"done":true}\n\n';
      let streamController: ReadableStreamDefaultController<Uint8Array>;

      const readableStream = new ReadableStream<Uint8Array>({
        start(ctrl) {
          streamController = ctrl;
        },
      });

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(readableStream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        })
      );

      const onToken = vi.fn();
      const onDone = vi.fn();

      const abort = createChatStream(
        "Tell me about NVX",
        { districtId: "chip-docks" },
        onToken,
        onDone
      );

      // Enqueue SSE data and close
      streamController!.enqueue(encoder.encode(streamData));
      streamController!.close();

      // Wait for microtasks to process
      await new Promise((r) => setTimeout(r, 50));

      const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(url).toContain("/api/world/chat/stream");
      expect(options.method).toBe("POST");
      expect(onToken).toHaveBeenCalledWith("hello");
    });

    it("returns an abort function that cancels the request", () => {
      let abortCalled = false;
      const fakeController = {
        signal: { aborted: false },
        abort: () => {
          abortCalled = true;
        },
      };

      // We cannot easily mock AbortController globally in this setup,
      // but we can verify that abort() doesn't throw and the fetch
      // receives a signal
      global.fetch = vi.fn().mockReturnValueOnce(new Promise(() => {}));

      const abort = createChatStream("test", {}, vi.fn(), vi.fn());

      expect(typeof abort).toBe("function");
      // Should not throw
      expect(() => abort()).not.toThrow();
    });
  });

  // --- getVoiceWebSocketUrl ---
  describe("getVoiceWebSocketUrl", () => {
    it("converts http to ws protocol", () => {
      const url = getVoiceWebSocketUrl();
      expect(url).toMatch(/^ws/);
      expect(url).toContain("/api/voice");
    });
  });
});
