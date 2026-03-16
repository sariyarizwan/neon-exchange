import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChat } from "@/hooks/useChat";
import { useNeonStore } from "@/store/useNeonStore";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/api", () => ({
  createChatStream: vi.fn(),
  sendChatMessage: vi.fn(),
}));

import * as api from "@/lib/api";

// Helper: make createChatStream immediately call onError so the fallback path runs
function mockStreamError(onErrorMsg = "Stream failed: 503") {
  (api.createChatStream as ReturnType<typeof vi.fn>).mockImplementation(
    (
      _msg: string,
      _ctx: unknown,
      _onToken: unknown,
      _onDone: unknown,
      onError: (e: string) => void
    ) => {
      onError(onErrorMsg);
      return () => {};
    }
  );
}

// Helper: make createChatStream immediately call onToken then onDone
function mockStreamSuccess(tokens: string[]) {
  (api.createChatStream as ReturnType<typeof vi.fn>).mockImplementation(
    (
      _msg: string,
      _ctx: unknown,
      onToken: (t: string) => void,
      onDone: () => void
    ) => {
      for (const tok of tokens) onToken(tok);
      onDone();
      return () => {};
    }
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useNeonStore.setState({
      selectedDistrictId: null,
      selectedTickerId: null,
    });
  });

  it("has a welcome message as initial state with sending=false and no error", () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe("assistant");
    expect(result.current.messages[0].id).toBe("welcome");
    expect(result.current.sending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("send() with empty or whitespace-only string does nothing", async () => {
    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("   ");
    });

    // Still only the welcome message
    expect(result.current.messages).toHaveLength(1);
    expect(api.createChatStream).not.toHaveBeenCalled();
  });

  it("send() adds a user message immediately", async () => {
    mockStreamSuccess([]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("What's moving?");
    });

    const userMessages = result.current.messages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(1);
    expect(userMessages[0].text).toBe("What's moving?");
  });

  it("send() adds an assistant message placeholder (streaming=true) alongside user message", async () => {
    mockStreamSuccess([]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Tell me about NVX");
    });

    const assistantMessages = result.current.messages.filter((m) => m.role === "assistant");
    // welcome + streaming response
    expect(assistantMessages.length).toBeGreaterThanOrEqual(2);
  });

  it("streaming tokens accumulate in assistant message", async () => {
    mockStreamSuccess(["Hello ", "world!"]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Hi");
    });

    const assistantMsgs = result.current.messages.filter((m) => m.role === "assistant" && m.id !== "welcome");
    expect(assistantMsgs[0].text).toBe("Hello world!");
    expect(assistantMsgs[0].streaming).toBe(false);
  });

  it("sets sending=false after stream completes", async () => {
    mockStreamSuccess(["done"]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Query");
    });

    expect(result.current.sending).toBe(false);
  });

  it("falls back to sendChatMessage when stream errors, sets assistant reply", async () => {
    mockStreamError();
    (api.sendChatMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      reply: "Fallback response from backend",
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Analyze Chip Docks");
    });

    const assistantMsgs = result.current.messages.filter(
      (m) => m.role === "assistant" && m.id !== "welcome"
    );
    expect(assistantMsgs[0].text).toBe("Fallback response from backend");
    expect(assistantMsgs[0].streaming).toBe(false);
  });

  it("sets error message when both stream and fallback fail", async () => {
    mockStreamError();
    (api.sendChatMessage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Who is NVX?");
    });

    expect(result.current.error).toBe("Market intel offline");
    const assistantMsgs = result.current.messages.filter(
      (m) => m.role === "assistant" && m.id !== "welcome"
    );
    expect(assistantMsgs[0].text).toContain("temporarily unavailable");
  });

  it("clearError() resets error to null", async () => {
    mockStreamError();
    (api.sendChatMessage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("fail")
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("Query");
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("multiple sequential sends accumulate messages in order", async () => {
    (api.createChatStream as ReturnType<typeof vi.fn>)
      .mockImplementationOnce(
        (_m: string, _c: unknown, onToken: (t: string) => void, onDone: () => void) => {
          onToken("First response");
          onDone();
          return () => {};
        }
      )
      .mockImplementationOnce(
        (_m: string, _c: unknown, onToken: (t: string) => void, onDone: () => void) => {
          onToken("Second response");
          onDone();
          return () => {};
        }
      );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("First question");
    });

    await act(async () => {
      await result.current.send("Second question");
    });

    const userMsgs = result.current.messages.filter((m) => m.role === "user");
    expect(userMsgs).toHaveLength(2);
    expect(userMsgs[0].text).toBe("First question");
    expect(userMsgs[1].text).toBe("Second question");
  });
});
