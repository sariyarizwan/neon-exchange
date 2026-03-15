# Full Backend Integration + State-of-the-Art Enhancements

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up all backend endpoints to the frontend, add streaming chat, production voice, live newsstands with vendor dialogue, ticker tape, breaking news alerts, and dynamic weather effects driven by real market data.

**Architecture:** Backend (FastAPI on :8080) already has all endpoints. Frontend (Next.js 15) has hooks and context providers that partially connect. We fix endpoint mismatches, add missing backend routes, then layer on streaming chat (SSE), AudioWorklet voice, live newsstand UI, ticker tape overlay, and data-driven canvas effects.

**Tech Stack:** Next.js 15, React 18, TypeScript, Zustand, HTML5 Canvas, Web Audio API (AudioWorklet), SSE (EventSource), WebSocket, FastAPI, Gemini 2.5 Flash/Pro, Google ADK

---

## Chunk 1: Backend Endpoint Fixes

### Task 1: Add `/api/market/snapshot` endpoint to backend

Frontend calls `fetchMarketSnapshot(districtId?)` which hits `/api/market/snapshot?district=X`, but this endpoint doesn't exist. Backend only has `/api/market/neon-state`.

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/backend/routers/market_router.py`

- [ ] **Step 1: Add the snapshot endpoint**

Add after the existing `/neon-state` endpoint:

```python
@router.get("/snapshot")
async def get_snapshot(district: str | None = None):
    """Return market data in neon format, optionally filtered by district."""
    snap = snapshot_cache.snapshot
    neon_state = snap.neon_state
    if not district:
        return neon_state
    # Filter tickers to only those in the requested district
    filtered = {
        k: v for k, v in neon_state.get("tickers", {}).items()
        if v.get("districtId") == district
    }
    return {
        "tickers": filtered,
        "marketMood": neon_state.get("marketMood", "cautious"),
        "isLive": neon_state.get("isLive", False),
    }
```

- [ ] **Step 2: Verify endpoint works**

Run: `cd /Users/chinmay_shringi/Desktop/neon-stock-exchange/backend && source venv/bin/activate && python -c "from routers.market_router import router; print('OK')"`

- [ ] **Step 3: Commit**

```bash
git add backend/routers/market_router.py
git commit -m "feat: add /api/market/snapshot endpoint with district filtering"
```

### Task 2: Add `/api/market/history/{tickerId}` endpoint to backend

Frontend calls `fetchTickerHistory(tickerId)` for candlestick charts, but this endpoint doesn't exist.

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/backend/routers/market_router.py`

- [ ] **Step 1: Add the history endpoint**

Add after the new `/snapshot` endpoint:

```python
@router.get("/history/{ticker_id}")
async def get_ticker_history(ticker_id: str):
    """Return OHLC-style price history for a ticker (by neon_id or symbol)."""
    snap = snapshot_cache.snapshot
    # Try neon_id lookup first, then symbol
    entry = snap.ticker_lookup.get(ticker_id.lower())
    if not entry:
        entry = snap.ticker_lookup.get(ticker_id.upper())
    if not entry:
        return []

    real_symbol = entry.get("symbol", "")
    history = entry.get("history", [])
    if not history:
        history = market_data_service.get_price_history(real_symbol, 50)

    # Convert to OHLC candle format
    candles = []
    for h in history:
        price = h.get("price", 0)
        candles.append({
            "open": price,
            "high": price * 1.001,
            "low": price * 0.999,
            "close": price,
            "timestamp": h.get("timestamp", 0),
        })
    return candles
```

- [ ] **Step 2: Commit**

```bash
git add backend/routers/market_router.py
git commit -m "feat: add /api/market/history/{tickerId} for candlestick charts"
```

### Task 3: Add streaming chat endpoint `/api/world/chat/stream`

Current chat is request/response. Add SSE streaming for token-by-token responses.

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/backend/routers/world_router.py`

- [ ] **Step 1: Add the streaming chat endpoint**

Add after the existing `/chat` endpoint:

```python
@router.post("/chat/stream")
async def chat_stream(request: Request):
    """Streaming AI market intel chat via SSE."""
    body = await request.json()
    message = body.get("message", "")
    context = body.get("context", {})

    # Build market context (same as /chat)
    snap = snapshot_cache.snapshot
    mood = snap.neon_state.get("marketMood", "unknown")
    district_id = context.get("districtId", "")
    ticker_id = context.get("tickerId", "")

    market_ctx = f"Market mood: {mood}."
    for ds in snap.district_states:
        if ds.get("district_id") == district_id:
            market_ctx += (
                f" District {ds['name']}: weather={ds.get('weather','?')}, "
                f"traffic={ds.get('traffic','?')}, mood={ds.get('mood','?')}."
            )
            break
    if ticker_id and ticker_id in snap.neon_tickers:
        t = snap.neon_tickers[ticker_id]
        market_ctx += (
            f" Ticker {t.get('neonSymbol','?')}: price=${t.get('price',0):.2f}, "
            f"change={t.get('changePct',0):+.2f}%, mood={t.get('mood','?')}, "
            f"regime={t.get('regime','?')}."
        )
    if snap.news_feed:
        headlines = [n.get("headline", "") for n in snap.news_feed[:3] if n.get("headline")]
        if headlines:
            market_ctx += " Headlines: " + "; ".join(headlines)

    async def stream_generator():
        try:
            from google import genai
            import os

            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            response = client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=(
                    "You are NEON, an AI market intelligence analyst in a cyberpunk stock city. "
                    "Give concise, actionable market insights. Use the city metaphor "
                    "(districts, weather=volatility, traffic=liquidity, storms=crashes). "
                    "Use markdown formatting for structure. "
                    f"Current context: {market_ctx}\n\nUser: {message}"
                ),
            )
            for chunk in response:
                if chunk.text:
                    yield {
                        "event": "token",
                        "data": json.dumps({"text": chunk.text}),
                    }
            yield {"event": "done", "data": json.dumps({"done": True})}
        except Exception as e:
            logger.warning(f"Stream chat error: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)[:200]}),
            }

    return EventSourceResponse(stream_generator())
```

Add `import json` at top if not already present.

- [ ] **Step 2: Commit**

```bash
git add backend/routers/world_router.py
git commit -m "feat: add /api/world/chat/stream SSE endpoint for streaming chat"
```

---

## Chunk 2: Frontend API Layer + Evidence/Bootstrap Wire-Up

### Task 4: Add streaming chat and evidence API functions

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/lib/api.ts`

- [ ] **Step 1: Add new API functions**

Append before the `// --- Types ---` section:

```typescript
export async function fetchEvidence(): Promise<{ evidence: EvidenceItem[] }> {
  const res = await fetch(`${API_URL}/api/world/evidence-feed`);
  if (!res.ok) throw new Error(`Evidence fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchScenarios(): Promise<{ scenarios: ScenarioItem[] }> {
  const res = await fetch(`${API_URL}/api/world/scenarios`);
  if (!res.ok) throw new Error(`Scenarios fetch failed: ${res.status}`);
  return res.json();
}

export function createChatStream(
  message: string,
  context?: { districtId?: string | null; tickerId?: string | null },
  onToken?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: string) => void
): () => void {
  const controller = new AbortController();

  fetch(`${API_URL}/api/world/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, context }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok || !res.body) {
        onError?.(`Stream failed: ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) onToken?.(data.text);
              if (data.done) onDone?.();
              if (data.error) onError?.(data.error);
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      onDone?.();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError?.(err.message);
      }
    });

  return () => controller.abort();
}
```

Add these types at the bottom:

```typescript
export type EvidenceItem = {
  id: string;
  timestamp: string;
  text: string;
  districtId?: string;
  tickerId?: string;
};

export type ScenarioItem = {
  id: string;
  title: string;
  type: string;
  probability: number;
  description: string;
  affected_tickers: string[];
  affected_districts: string[];
  severity: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat: add streaming chat, evidence, and scenarios API functions"
```

### Task 5: Create `useEvidence` hook

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/hooks/useEvidence.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useEffect } from "react";
import { fetchEvidence } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";

/**
 * Polls the backend evidence feed every 10 seconds and pushes
 * new items into the Zustand store's evidenceTimeline.
 */
export function useEvidence() {
  useEffect(() => {
    let cancelled = false;
    const seenIds = new Set<string>();

    const load = async () => {
      try {
        const { evidence } = await fetchEvidence();
        if (cancelled) return;

        const store = useNeonStore.getState();
        const newItems = evidence.filter((item) => !seenIds.has(item.id));

        for (const item of newItems) {
          seenIds.add(item.id);
          store.addEvidence({
            text: item.text,
            districtId: item.districtId ?? null,
            tickerId: item.tickerId ?? null,
          });
        }
      } catch {
        // Backend unavailable — ignore
      }
    };

    load();
    const interval = setInterval(load, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
}
```

- [ ] **Step 2: Wire into QuestTriggerWatcher in page.tsx**

In `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/app/page.tsx`, add `useEvidence()` call inside `QuestTriggerWatcher`:

```typescript
import { useEvidence } from "@/hooks/useEvidence";

function QuestTriggerWatcher() {
  useQuestTriggers();
  useMicroLegend();
  useEvidence();
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useEvidence.ts frontend/src/app/page.tsx
git commit -m "feat: wire evidence feed from backend into Zustand store"
```

### Task 6: Connect bootstrap on page load

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/LiveDataProvider.tsx`

- [ ] **Step 1: Add bootstrap fetch on mount**

```typescript
"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useLiveMarket } from "@/hooks/useLiveMarket";
import { useLiveNews } from "@/hooks/useLiveNews";
import { fetchBootstrap } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";
import type { DistrictLiveState, LiveSignals, NeonTickerData, NewsItem } from "@/lib/api";

type LiveDataContextType = {
  tickers: Record<string, NeonTickerData> | null;
  news: NewsItem[] | null;
  districtStates: Record<string, DistrictLiveState> | null;
  signals: LiveSignals | null;
  marketMood: string;
  connected: boolean;
  isLive: boolean;
};

const LiveDataContext = createContext<LiveDataContextType>({
  tickers: null,
  news: null,
  districtStates: null,
  signals: null,
  marketMood: "cautious",
  connected: false,
  isLive: false,
});

export function useLiveData() {
  return useContext(LiveDataContext);
}

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const market = useLiveMarket();
  const newsData = useLiveNews();

  // Bootstrap: seed initial scenarios and news from the agent system
  useEffect(() => {
    fetchBootstrap()
      .then((data) => {
        const store = useNeonStore.getState();
        // Seed evidence from initial scenarios
        if (data.scenarios && Array.isArray(data.scenarios)) {
          for (const scenario of data.scenarios.slice(0, 5)) {
            store.addEvidence({
              text: `[scenario] ${scenario.title ?? scenario.description ?? ""}`.slice(0, 200),
              districtId: scenario.affected_districts?.[0] ?? null,
              tickerId: scenario.affected_tickers?.[0] ?? null,
            });
          }
        }
      })
      .catch(() => {
        // Backend not available — fine
      });
  }, []);

  const value: LiveDataContextType = {
    tickers: market.tickers,
    news: market.news ?? newsData.news,
    districtStates: market.districtStates,
    signals: market.signals,
    marketMood: market.marketMood,
    connected: market.connected,
    isLive: market.isLive || newsData.isLive,
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/LiveDataProvider.tsx
git commit -m "feat: bootstrap initial state from backend agent system on page load"
```

---

## Chunk 3: Streaming Chat UI

### Task 7: Upgrade `useChat` hook to support streaming

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/hooks/useChat.ts`

- [ ] **Step 1: Rewrite useChat with streaming support**

```typescript
"use client";

import { useCallback, useRef, useState } from "react";
import { createChatStream, sendChatMessage } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  streaming?: boolean;
  category?: "normal" | "alert" | "analysis";
};

type UseChatResult = {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  clearError: () => void;
};

const SUGGESTED_PROMPTS = [
  "What's moving in Chip Docks?",
  "Analyze NVX momentum",
  "Any brewing storms?",
  "Which districts are most correlated?",
  "Market breadth summary",
];

const formatTimestamp = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

export { SUGGESTED_PROMPTS };

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Market intel online. Ask me about districts, tickers, or market conditions.",
      timestamp: formatTimestamp(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idCounter = useRef(1);
  const abortRef = useRef<(() => void) | null>(null);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Abort any ongoing stream
    abortRef.current?.();

    const userMsg: ChatMessage = {
      id: `msg-${idCounter.current++}`,
      role: "user",
      text: trimmed,
      timestamp: formatTimestamp(),
    };

    const assistantId = `msg-${idCounter.current++}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      timestamp: formatTimestamp(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setSending(true);
    setError(null);

    const state = useNeonStore.getState();
    const context = {
      districtId: state.selectedDistrictId,
      tickerId: state.selectedTickerId,
    };

    // Try streaming first, fall back to non-streaming
    const abort = createChatStream(
      trimmed,
      context,
      (token) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, text: m.text + token } : m
          )
        );
      },
      () => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setSending(false);
      },
      async (err) => {
        // Fall back to non-streaming endpoint
        try {
          const response = await sendChatMessage(trimmed, context);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, text: response.reply, streaming: false }
                : m
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    text: "Market intel temporarily unavailable. Backend connection required for AI responses.",
                    streaming: false,
                  }
                : m
            )
          );
          setError("Market intel offline");
        }
        setSending(false);
      }
    );

    abortRef.current = abort;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, sending, error, send, clearError };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useChat.ts
git commit -m "feat: upgrade useChat to streaming with SSE + fallback"
```

### Task 8: Upgrade FloatingChat UI with markdown, suggestions, and streaming indicator

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/FloatingChat.tsx`

- [ ] **Step 1: Install react-markdown**

```bash
cd /Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend && npm install react-markdown
```

- [ ] **Step 2: Rewrite FloatingChat with enhanced UI**

```typescript
"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import { useChat, SUGGESTED_PROMPTS } from "@/hooks/useChat";
import { useLiveData } from "@/components/LiveDataProvider";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

type FloatingChatProps = {
  open: boolean;
  onToggle: () => void;
};

export function FloatingChatPanel({ open, onToggle }: FloatingChatProps) {
  const [input, setInput] = useState("");
  const { messages, sending, error, send } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { connected } = useLiveData();
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || sending) return;
    send(msg);
    if (!text) setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  const showSuggestions = messages.length <= 1 && !sending;

  return (
    <div className="mb-2">
      <ResizablePanel
        initialWidth={360}
        initialHeight={460}
        minWidth={280}
        minHeight={300}
        storageKey="floating-chat"
        className="flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Market Intel
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                connected ? "bg-neon-lime shadow-[0_0_4px_rgba(0,255,100,0.5)]" : "bg-slate-600"
              )}
              title={connected ? "Live" : "Offline"}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Context badges */}
            {selectedDistrictId ? (
              <span className="rounded-md border border-neon-cyan/20 bg-neon-cyan/8 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-cyan-300">
                {selectedDistrictId.replace(/-/g, " ")}
              </span>
            ) : null}
            {selectedTickerId ? (
              <span className="rounded-md border border-neon-magenta/20 bg-neon-magenta/8 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-pink-300">
                {selectedTickerId}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onToggle}
              className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
              title="Close"
            >
              x
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error ? (
          <div className="border-b border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[10px] text-amber-300">
            {error}
          </div>
        ) : null}

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[88%] rounded-xl px-3 py-2",
                msg.role === "user"
                  ? "ml-auto border border-neon-cyan/20 bg-neon-cyan/8 text-right"
                  : "mr-auto bg-slate-900/80",
                msg.category === "alert" && "border border-neon-magenta/30 bg-neon-magenta/8",
                msg.category === "analysis" && "border border-neon-cyan/30 bg-neon-cyan/6"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none text-[11px] leading-[1.5] text-slate-200 [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-neon-cyan">
                  <ReactMarkdown>{msg.text || (msg.streaming ? "" : "...")}</ReactMarkdown>
                  {msg.streaming ? (
                    <span className="inline-block h-3 w-1 animate-pulse bg-neon-cyan/60" />
                  ) : null}
                </div>
              ) : (
                <div className="text-[11px] leading-[1.5] text-slate-200">
                  {msg.text}
                </div>
              )}
              <div className="mt-0.5 text-[9px] text-slate-500">
                {msg.timestamp}
              </div>
            </div>
          ))}
          {sending && !messages.some((m) => m.streaming) ? (
            <div className="mr-auto max-w-[85%] rounded-xl bg-slate-900/80 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan/50 animate-bounce [animation-delay:300ms]" />
                </span>
                Analyzing market data...
              </div>
            </div>
          ) : null}
        </div>

        {/* Suggested prompts */}
        {showSuggestions ? (
          <div className="border-t border-white/5 px-3 py-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-500 mb-1.5">Suggested</div>
            <div className="flex flex-wrap gap-1">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="rounded-lg border border-slate-700/50 bg-slate-900/60 px-2 py-1 text-[10px] text-slate-400 transition hover:border-neon-cyan/30 hover:text-cyan-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Input */}
        <div
          className="border-t border-white/5 px-3 py-2"
          data-ignore-camera-keys="true"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the market..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-neon-cyan/40"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="rounded-lg border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-neon-cyan/16 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </ResizablePanel>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/FloatingChat.tsx
git commit -m "feat: upgrade chat UI with streaming, markdown, context badges, suggestions"
```

---

## Chunk 4: Voice Improvements

### Task 9: Create AudioWorklet processor for voice capture

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/public/audio-processor.js`

- [ ] **Step 1: Create the AudioWorklet processor**

```javascript
/**
 * AudioWorklet processor for capturing PCM16 audio at 16kHz.
 * Replaces the deprecated ScriptProcessorNode.
 */
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._sampleCount = 0;
    // Send chunks every ~4096 samples (~256ms at 16kHz)
    this._chunkSize = 4096;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];
    for (let i = 0; i < samples.length; i++) {
      this._buffer.push(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))));
      this._sampleCount++;
    }

    if (this._sampleCount >= this._chunkSize) {
      const pcm16 = new Int16Array(this._buffer);
      this.port.postMessage({ type: "pcm", data: pcm16.buffer }, [pcm16.buffer]);
      this._buffer = [];
      this._sampleCount = 0;
    }

    return true;
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/public/audio-processor.js
git commit -m "feat: add AudioWorklet processor for PCM16 voice capture"
```

### Task 10: Upgrade `useVoice` hook with AudioWorklet and connection state machine

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/hooks/useVoice.ts`

- [ ] **Step 1: Rewrite useVoice**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVoiceWebSocketUrl } from "@/lib/api";

export type VoiceConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "speaking"
  | "processing";

type VoiceState = {
  connectionState: VoiceConnectionState;
  transcript: string[];
  audioLevel: number;
};

/**
 * Manages WebSocket connection to Gemini Live voice endpoint.
 * Uses AudioWorklet for capture, queued playback for responses.
 */
export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    connectionState: "disconnected",
    transcript: [],
    audioLevel: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const updateState = useCallback(
    (partial: Partial<VoiceState>) =>
      setState((s) => ({ ...s, ...partial })),
    []
  );

  const addTranscript = useCallback((line: string, speaker: "You" | "Oracle" = "Oracle") => {
    setState((s) => ({
      ...s,
      transcript: [`${speaker}: ${line}`, ...s.transcript].slice(0, 30),
    }));
  }, []);

  // --- Playback queue ---
  const playNext = useCallback(() => {
    const ctx = playbackContextRef.current;
    const queue = playbackQueueRef.current;
    if (!ctx || queue.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const buffer = queue.shift()!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => playNext();
    src.start();
  }, []);

  const enqueueAudio = useCallback(
    (base64Data: string) => {
      try {
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const ctx =
          playbackContextRef.current ?? new AudioContext({ sampleRate: 24000 });
        playbackContextRef.current = ctx;
        const buffer = ctx.createBuffer(1, bytes.length / 2, 24000);
        const channel = buffer.getChannelData(0);
        const view = new Int16Array(bytes.buffer);
        for (let i = 0; i < view.length; i++) {
          channel[i] = view[i] / 32768;
        }
        playbackQueueRef.current.push(buffer);
        if (!isPlayingRef.current) playNext();
      } catch {
        // ignore
      }
    },
    [playNext]
  );

  // --- WebSocket ---
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateState({ connectionState: "connecting" });
    const ws = new WebSocket(getVoiceWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      updateState({ connectionState: "connected" });
      addTranscript("Voice channel open. Hold Space to speak.", "Oracle");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "text" && msg.text) {
          addTranscript(msg.text, "Oracle");
          updateState({ connectionState: "connected" });
        }
        if (msg.type === "audio" && msg.data) {
          enqueueAudio(msg.data);
          updateState({ connectionState: "processing" });
        }
        if (msg.type === "error") {
          addTranscript(`Error: ${msg.message}`, "Oracle");
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => updateState({ connectionState: "disconnected" });
    ws.onerror = () => updateState({ connectionState: "disconnected" });
  }, [updateState, addTranscript, enqueueAudio]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.send(JSON.stringify({ type: "end" })); } catch { /* ignore */ }
      wsRef.current.close();
      wsRef.current = null;
    }
    stopCapture();
    updateState({ connectionState: "disconnected", audioLevel: 0 });
  }, [updateState]);

  // --- Audio capture ---
  function stopCapture() {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    captureNodeRef.current?.disconnect();
    captureNodeRef.current = null;
    captureContextRef.current?.close();
    captureContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current = null;
  }

  const startSpeaking = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      captureContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // Audio level analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      levelIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setState((s) => ({ ...s, audioLevel: Math.min(1, rms * 3) }));
      }, 50);

      // Try AudioWorklet, fall back to ScriptProcessorNode
      try {
        await ctx.audioWorklet.addModule("/audio-processor.js");
        const worklet = new AudioWorkletNode(ctx, "pcm-capture-processor");
        captureNodeRef.current = worklet;

        worklet.port.onmessage = (e) => {
          if (e.data.type === "pcm" && wsRef.current?.readyState === WebSocket.OPEN) {
            const pcm16 = new Int16Array(e.data.data);
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
          }
        };

        source.connect(worklet);
        worklet.connect(ctx.destination);
      } catch {
        // Fallback to ScriptProcessorNode
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32767)));
          }
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          wsRef.current?.send(JSON.stringify({ type: "audio", data: base64 }));
        };
        source.connect(processor);
        processor.connect(ctx.destination);
      }

      updateState({ connectionState: "speaking" });
      addTranscript("Listening...", "Oracle");
    } catch {
      addTranscript("Mic access denied", "Oracle");
    }
  }, [connect, updateState, addTranscript]);

  const stopSpeaking = useCallback(() => {
    stopCapture();
    updateState({ connectionState: "connected", audioLevel: 0 });
  }, [updateState]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      addTranscript(text, "You");
    }
  }, [addTranscript]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState: state.connectionState,
    connected: state.connectionState !== "disconnected",
    speaking: state.connectionState === "speaking",
    transcript: state.transcript,
    audioLevel: state.audioLevel,
    connect,
    disconnect,
    startSpeaking,
    stopSpeaking,
    sendText,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useVoice.ts
git commit -m "feat: upgrade voice with AudioWorklet, playback queue, audio levels"
```

### Task 11: Create VoicePanel component with waveform visualizer

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/VoicePanel.tsx`

- [ ] **Step 1: Create VoicePanel**

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useVoice, type VoiceConnectionState } from "@/hooks/useVoice";
import { cn } from "@/lib/cn";

const STATE_LABELS: Record<VoiceConnectionState, string> = {
  disconnected: "Offline",
  connecting: "Connecting...",
  connected: "Ready",
  speaking: "Listening",
  processing: "Processing",
};

const STATE_COLORS: Record<VoiceConnectionState, string> = {
  disconnected: "bg-slate-600",
  connecting: "bg-amber-500 animate-pulse",
  connected: "bg-neon-lime",
  speaking: "bg-neon-magenta animate-pulse",
  processing: "bg-neon-cyan animate-pulse",
};

export function VoicePanel() {
  const {
    connectionState,
    connected,
    transcript,
    audioLevel,
    connect,
    disconnect,
    startSpeaking,
    stopSpeaking,
  } = useVoice();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-slate-950/90 p-3 shadow-[0_0_28px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATE_COLORS[connectionState])} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Oracle Voice — {STATE_LABELS[connectionState]}
          </span>
        </div>
        <button
          type="button"
          onClick={connected ? disconnect : connect}
          className={cn(
            "rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition",
            connected
              ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
              : "border border-neon-cyan/30 text-cyan-300 hover:bg-neon-cyan/10"
          )}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>

      {/* Audio level waveform */}
      {connected ? (
        <div className="flex h-6 items-end justify-center gap-[2px]">
          {Array.from({ length: 16 }).map((_, i) => {
            const offset = Math.abs(i - 7.5) / 7.5;
            const height = Math.max(2, audioLevel * 24 * (1 - offset * 0.5) + Math.sin(Date.now() / 200 + i) * 1.5);
            return (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  connectionState === "speaking"
                    ? "bg-neon-magenta/70"
                    : connectionState === "processing"
                      ? "bg-neon-cyan/70"
                      : "bg-slate-700"
                )}
                style={{ height: `${Math.max(2, height)}px` }}
              />
            );
          })}
        </div>
      ) : null}

      {/* Push-to-talk button */}
      {connected ? (
        <button
          type="button"
          onPointerDown={startSpeaking}
          onPointerUp={stopSpeaking}
          onPointerLeave={stopSpeaking}
          className={cn(
            "rounded-xl py-2 text-[11px] font-semibold uppercase tracking-wider transition-all",
            connectionState === "speaking"
              ? "border-2 border-neon-magenta/50 bg-neon-magenta/15 text-pink-200 shadow-[0_0_20px_rgba(255,0,128,0.2)]"
              : "border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-neon-cyan/30"
          )}
        >
          {connectionState === "speaking" ? "Release to Stop" : "Hold to Speak"}
        </button>
      ) : null}

      {/* Transcript */}
      {transcript.length > 0 ? (
        <div
          ref={scrollRef}
          className="max-h-28 space-y-1 overflow-y-auto overscroll-contain"
        >
          {transcript.slice(0, 10).map((line, i) => (
            <div
              key={`${line}-${i}`}
              className={cn(
                "text-[10px] leading-[1.4]",
                line.startsWith("You:")
                  ? "text-neon-cyan/70"
                  : line.startsWith("Oracle:")
                    ? "text-slate-400"
                    : "text-amber-400/60"
              )}
            >
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/VoicePanel.tsx
git commit -m "feat: add VoicePanel with waveform visualizer and connection state"
```

---

## Chunk 5: Live Newsstands + Ticker Tape + Breaking News

### Task 12: Create useNewsstand hook for live district news

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/hooks/useNewsstand.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useMemo } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import type { NewsItem } from "@/lib/api";

/**
 * Returns live news filtered by district, falling back to all news
 * if no district-specific news is available.
 */
export function useNewsstand(districtId: string | null): NewsItem[] {
  const { news } = useLiveData();

  return useMemo(() => {
    if (!news || news.length === 0) return [];

    if (districtId) {
      const districtNews = news.filter(
        (item) => item.district_id === districtId
      );
      if (districtNews.length > 0) return districtNews.slice(0, 5);
    }

    return news.slice(0, 5);
  }, [news, districtId]);
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useNewsstand.ts
git commit -m "feat: add useNewsstand hook for district-filtered live news"
```

### Task 13: Create TickerTape component

A persistent horizontal scrolling ticker tape at the bottom of the viewport.

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/TickerTape.tsx`

- [ ] **Step 1: Create TickerTape**

```typescript
"use client";

import { useLiveData } from "@/components/LiveDataProvider";
import { cn } from "@/lib/cn";

export function TickerTape() {
  const { tickers } = useLiveData();

  if (!tickers) return null;

  const entries = Object.values(tickers)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  if (entries.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...entries, ...entries];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 overflow-hidden border-t border-neon-cyan/10 bg-base-950/90 backdrop-blur-sm">
      <div
        className="flex animate-[ticker-scroll_40s_linear_infinite] whitespace-nowrap py-1"
        style={{ width: "max-content" }}
      >
        {items.map((ticker, i) => {
          const isUp = ticker.changePct > 0;
          const isFlat = Math.abs(ticker.changePct) < 0.1;
          return (
            <span
              key={`${ticker.neonId}-${i}`}
              className="mx-3 inline-flex items-center gap-1.5 text-[11px] font-mono"
            >
              <span className="font-semibold text-slate-300">
                {ticker.neonSymbol}
              </span>
              <span className={cn(
                "font-medium",
                isFlat ? "text-slate-500" : isUp ? "text-neon-lime" : "text-neon-magenta"
              )}>
                ${ticker.price.toFixed(2)}
              </span>
              <span className={cn(
                "text-[10px]",
                isFlat ? "text-slate-600" : isUp ? "text-neon-lime/70" : "text-neon-magenta/70"
              )}>
                {isUp ? "+" : ""}{ticker.changePct.toFixed(2)}%
              </span>
              <span className="text-slate-700">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the ticker-scroll keyframe to globals.css**

In `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/app/globals.css`, add:

```css
@keyframes ticker-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/TickerTape.tsx frontend/src/app/globals.css
git commit -m "feat: add scrolling ticker tape overlay with live market data"
```

### Task 14: Create BreakingNewsAlert component

Full-screen flash for high-severity news events.

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/BreakingNewsAlert.tsx`

- [ ] **Step 1: Create BreakingNewsAlert**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveData } from "@/components/LiveDataProvider";
import { useNeonStore } from "@/store/useNeonStore";
import type { NewsItem } from "@/lib/api";
import { cn } from "@/lib/cn";

type Alert = {
  id: string;
  headline: string;
  districtId?: string | null;
  expiresAt: number;
};

export function BreakingNewsAlert() {
  const { news } = useLiveData();
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const seenRef = useRef(new Set<string>());
  const triggerDistrictPulse = useNeonStore((s) => s.triggerDistrictPulse);

  const showAlert = useCallback(
    (item: NewsItem) => {
      const id = `${item.headline}-${item.timestamp}`;
      if (seenRef.current.has(id)) return;
      seenRef.current.add(id);

      setActiveAlert({
        id,
        headline: item.headline,
        districtId: item.district_id,
        expiresAt: Date.now() + 4000,
      });

      // Trigger storm pulse in affected district
      if (item.district_id) {
        triggerDistrictPulse(item.district_id, "scene", 4000);
      }
    },
    [triggerDistrictPulse]
  );

  // Watch for high-severity news
  useEffect(() => {
    if (!news) return;
    const highSeverity = news.find(
      (item) => item.severity === "high" && !seenRef.current.has(`${item.headline}-${item.timestamp}`)
    );
    if (highSeverity) {
      showAlert(highSeverity);
    }
  }, [news, showAlert]);

  // Auto-dismiss
  useEffect(() => {
    if (!activeAlert) return;
    const remaining = activeAlert.expiresAt - Date.now();
    if (remaining <= 0) {
      setActiveAlert(null);
      return;
    }
    const timeout = window.setTimeout(() => setActiveAlert(null), remaining);
    return () => window.clearTimeout(timeout);
  }, [activeAlert]);

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-16">
      {/* Flash overlay */}
      <div className="absolute inset-0 animate-[flash-fade_0.6s_ease-out] bg-neon-magenta/8" />

      {/* Banner */}
      <div className={cn(
        "pointer-events-auto mx-4 max-w-xl animate-[slide-down_0.3s_ease-out]",
        "rounded-xl border border-neon-magenta/40 bg-base-950/95 px-5 py-3",
        "shadow-[0_0_40px_rgba(255,0,128,0.3)] backdrop-blur-md"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded bg-neon-magenta/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon-magenta animate-pulse">
            Breaking
          </span>
          {activeAlert.districtId ? (
            <span className="text-[9px] uppercase tracking-wider text-slate-500">
              {activeAlert.districtId.replace(/-/g, " ")}
            </span>
          ) : null}
        </div>
        <div className="text-[13px] font-medium leading-snug text-slate-100">
          {activeAlert.headline}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add flash-fade and slide-down keyframes to globals.css**

```css
@keyframes flash-fade {
  0% { opacity: 0.6; }
  100% { opacity: 0; }
}

@keyframes slide-down {
  0% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/BreakingNewsAlert.tsx frontend/src/app/globals.css
git commit -m "feat: add breaking news alert with flash overlay and storm pulse"
```

### Task 15: Create NewsstandOverlay for interactive newsstand popups

When player approaches a newsstand, show floating news cards.

**Files:**
- Create: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/NewsstandOverlay.tsx`

- [ ] **Step 1: Create NewsstandOverlay**

```typescript
"use client";

import { useNewsstand } from "@/hooks/useNewsstand";
import { useNeonStore } from "@/store/useNeonStore";
import { cn } from "@/lib/cn";

export function NewsstandOverlay() {
  const districtId = useNeonStore((s) => s.activeNewsstandDistrictId);
  const setActiveNewsstandDistrictId = useNeonStore((s) => s.setActiveNewsstandDistrictId);
  const liveNews = useNewsstand(districtId);

  if (!districtId || liveNews.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-20 z-40 -translate-x-1/2 w-[340px]">
      <div className="rounded-2xl border border-white/10 bg-base-950/95 p-3 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {districtId.replace(/-/g, " ")} Newsstand
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-neon-lime animate-pulse" />
          </div>
          <button
            type="button"
            onClick={() => setActiveNewsstandDistrictId(null)}
            className="text-[10px] text-slate-500 hover:text-white"
          >
            x
          </button>
        </div>

        {/* News cards */}
        <div className="space-y-1.5">
          {liveNews.map((item, i) => {
            const sentiment =
              item.severity === "high"
                ? "magenta"
                : item.tickers.length > 0
                  ? "cyan"
                  : "amber";
            const borderColor = {
              magenta: "border-neon-magenta/25",
              cyan: "border-neon-cyan/25",
              amber: "border-neon-amber/25",
            }[sentiment];
            const accentColor = {
              magenta: "bg-neon-magenta/10",
              cyan: "bg-neon-cyan/10",
              amber: "bg-neon-amber/10",
            }[sentiment];

            return (
              <div
                key={`${item.headline}-${i}`}
                className={cn(
                  "rounded-lg border p-2 transition-all",
                  borderColor,
                  accentColor
                )}
              >
                <div className="text-[11px] leading-snug text-slate-200">
                  {item.headline}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {item.tickers.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-slate-800/60 px-1 py-0.5 text-[8px] font-mono uppercase text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="ml-auto text-[8px] text-slate-600">
                    {item.source}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/NewsstandOverlay.tsx
git commit -m "feat: add interactive newsstand overlay with live sentiment-colored news cards"
```

---

## Chunk 6: Enable Newsstand Interaction + Wire Everything into Page

### Task 16: Re-enable newsstand E key interaction with live data in CityCanvas

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/city/CityCanvas.tsx`

- [ ] **Step 1: Uncomment and update newsstand interaction block**

In CityCanvas.tsx around line 695-708, replace the commented-out newsstand interaction with live-news-powered version:

Find the commented block:
```typescript
      // Newsstand Space-key interaction disabled
      // const nearbyNewsstand = newsstands.find(...
```

Replace with:
```typescript
      // Newsstand E-key interaction (live news)
      const nearbyNewsstand = newsstands.find(
        (stand) => Math.hypot(player.x - stand.x, player.y - stand.y) < 104
      ) ?? null;
      if (nearbyNewsstand) {
        setActiveNewsstandDistrictId(nearbyNewsstand.districtId);
        setSelectedDistrictId(nearbyNewsstand.districtId);
      }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat: re-enable newsstand E-key interaction with live data"
```

### Task 17: Wire all new components into page.tsx

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/app/page.tsx`

- [ ] **Step 1: Add imports and components**

Add imports:
```typescript
import { TickerTape } from "@/components/layout/TickerTape";
import { BreakingNewsAlert } from "@/components/layout/BreakingNewsAlert";
import { NewsstandOverlay } from "@/components/layout/NewsstandOverlay";
import { VoicePanel } from "@/components/layout/VoicePanel";
```

Add components inside the `<LiveDataProvider>` block, after `<FloatingMinimap />`:
```typescript
        <TickerTape />
        <BreakingNewsAlert />
        <NewsstandOverlay />
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "feat: wire ticker tape, breaking news, newsstand overlay into main page"
```

### Task 18: Add VoicePanel to FloatingMinimap area

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/layout/FloatingMinimap.tsx`

- [ ] **Step 1: Add VoicePanel import and render**

Add import:
```typescript
import { VoicePanel } from "./VoicePanel";
```

Add `<VoicePanel />` inside the bottom-right container, above the minimap:
```typescript
<div className="fixed bottom-4 right-4 z-30 flex items-end gap-2">
  {/* Voice panel */}
  <div className="mb-1">
    <VoicePanel />
  </div>
  {/* ... existing minimap content */}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/FloatingMinimap.tsx
git commit -m "feat: add voice panel to minimap area"
```

---

## Chunk 7: Dynamic Weather & Visual Effects in Canvas

### Task 19: Apply live district states to CityCanvas weather rendering

The SSE stream already sends `district_states` with weather/traffic/mood/glow. CityCanvas already reads `districtStatesRef` for storm detection. We need to ensure NPC speeds respond to traffic, and glow intensity drives district lighting.

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/city/CityCanvas.tsx`

- [ ] **Step 1: Read and understand the current weather/NPC rendering**

Read CityCanvas.tsx NPC movement logic (around NpcRuntime speed calculation) and district glow rendering to understand current patterns.

- [ ] **Step 2: Update NPC speed based on live traffic**

In the NPC decision/movement logic, adjust speed based on live district traffic:

```typescript
// Inside the NPC movement update loop, after computing base speed:
const ds = districtStatesRef.current;
if (ds && npc.districtId && ds[npc.districtId]) {
  const traffic = ds[npc.districtId].traffic;
  const trafficMultiplier =
    traffic === "gridlock" ? 0.3
    : traffic === "heavy" ? 0.6
    : traffic === "normal" ? 1.0
    : 1.4; // "low"
  npc.speed = npc.speed * trafficMultiplier;
}
```

- [ ] **Step 3: Update district glow intensity based on live data**

In the district rendering section, use live glow_intensity:

```typescript
// When drawing district accent/glow effects, multiply by live glow_intensity:
const ds = districtStatesRef.current;
const liveGlow = ds && ds[district.id] ? ds[district.id].glow_intensity : 0.5;
// Use liveGlow to modulate the glow alpha in drawPixelRect calls
```

- [ ] **Step 4: Add rain particle density based on live weather**

In the rain rendering section, scale rain density by district weather:

```typescript
// When computing rain drop count:
const ds = districtStatesRef.current;
const activeWeathers = ds ? Object.values(ds) : [];
const stormCount = activeWeathers.filter(d => d.weather === "storm").length;
const rainCount = activeWeathers.filter(d => d.weather === "rain").length;
const baseDensity = stormFactor * 80;
const weatherDensity = baseDensity + stormCount * 30 + rainCount * 15;
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat: drive NPC speed, glow intensity, and rain from live district states"
```

### Task 20: Connect live storm mode to backend regime detection

**Files:**
- Modify: `/Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend/src/components/LiveDataProvider.tsx`

- [ ] **Step 1: Auto-activate storm mode when backend detects storms**

Add to the LiveDataProvider component, inside the existing useEffect or as a new one:

```typescript
// Auto-activate storm mode based on live district states
useEffect(() => {
  if (!market.districtStates) return;
  const hasStorm = Object.values(market.districtStates).some(
    (d) => d.weather === "storm"
  );
  const store = useNeonStore.getState();
  if (hasStorm && !store.stormModeActive) {
    // Don't auto-set stormModeActive (too aggressive), but trigger pulse on stormy districts
    for (const [districtId, state] of Object.entries(market.districtStates)) {
      if (state.weather === "storm") {
        store.triggerDistrictPulse(districtId, "scene", 8000);
      }
    }
  }
}, [market.districtStates]);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/LiveDataProvider.tsx
git commit -m "feat: trigger district storm pulses from live backend weather data"
```

---

## Chunk 8: Final Integration & Verification

### Task 21: Verify backend starts and all endpoints respond

- [ ] **Step 1: Start backend**

```bash
cd /Users/chinmay_shringi/Desktop/neon-stock-exchange/backend
source venv/bin/activate
python main.py &
sleep 3
```

- [ ] **Step 2: Test key endpoints**

```bash
curl -s http://localhost:8080/api/health | python -m json.tool
curl -s http://localhost:8080/api/market/snapshot | python -m json.tool | head -20
curl -s http://localhost:8080/api/market/history/nvx | python -m json.tool | head -10
curl -s http://localhost:8080/api/world/news | python -m json.tool | head -20
curl -s http://localhost:8080/api/world/evidence-feed | python -m json.tool | head -20
curl -s http://localhost:8080/api/world/scenarios | python -m json.tool
curl -s http://localhost:8080/api/agents/bootstrap | python -m json.tool | head -20
```

- [ ] **Step 3: Test SSE stream**

```bash
timeout 5 curl -s http://localhost:8080/api/world/neon-stream | head -5
```

### Task 22: Verify frontend builds and connects

- [ ] **Step 1: Install new dependency and build**

```bash
cd /Users/chinmay_shringi/Desktop/neon-stock-exchange/frontend
npm install react-markdown
npm run build
```

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev &
sleep 5
curl -s http://localhost:3000 | head -20
```

- [ ] **Step 3: Manual verification checklist**

Open `http://localhost:3000` in browser and verify:
- [ ] Ticker tape scrolling at bottom with live prices
- [ ] Chat panel opens with suggestions, streams responses
- [ ] Voice panel shows in minimap area with connect/disconnect
- [ ] Pressing E near newsstand shows live news overlay
- [ ] Breaking news flash appears for high-severity events
- [ ] Evidence feed populates in right panel Feed tab
- [ ] District weather effects change based on market conditions
- [ ] NPC movement speed varies by district traffic level

### Task 23: Final commit

- [ ] **Step 1: Commit any remaining changes**

```bash
git add -A
git commit -m "feat: complete backend integration with streaming chat, voice, newsstands, ticker tape, and dynamic weather"
```
