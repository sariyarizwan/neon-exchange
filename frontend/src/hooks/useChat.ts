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

/** Static responses used when the backend is offline (demo mode). */
const OFFLINE_RESPONSES: Record<string, string> = {
  "What's moving in Chip Docks?":
    "Chip Docks is showing strong momentum today. NVX (Nova Vect) is leading the pack at +3.2% with confident sentiment — the semiconductor rally is spilling over from overnight Asia markets. QNTM (Quantum Logic) is riding the wave at +1.8%, while SPHR (Sphere Optics) lags slightly at +0.4% on cautious volume. The district weather is clear with normal traffic — a textbook calm regime. Watch NVX for potential breakout above resistance if momentum holds into the afternoon session.",

  "Analyze NVX momentum":
    "NVX (Nova Vect) is exhibiting strong bullish momentum. Current price action shows a steady uptrend with higher highs and higher lows over the last 8 candles. Key signals:\n\n• Momentum score: 0.72 (strong)\n• Volatility regime: calm → potential breakout setup\n• Volume: above 20-period average by 40%\n• Alliances: strongly correlated with QNTM (r=0.84) and moderately with HASH (r=0.61)\n\nThe confident mood reflects institutional accumulation. If the broader tech sector (Chip Docks) maintains its calm weather, NVX has room to run. Risk: any storm regime shift could trigger rapid reversal given the elevated correlation cluster.",

  "Any brewing storms?":
    "Two districts are showing elevated volatility signatures:\n\n1. **Energy Yard** — Weather: storm. FLUX is down -4.1% with erratic mood. The district's volatility ratio is 3.2x baseline, driven by geopolitical supply concerns. GRID and SPRK are holding but nervous. Traffic is thinning (low liquidity), which amplifies moves.\n\n2. **Crypto Alley** — Weather: rain, trending toward storm. COIN and HASH are both choppy with momentum divergence. The correlation between them has weakened from 0.91 to 0.54 in the last hour — a classic pre-storm decorrelation signal.\n\nAll other districts are clear or light rain. No contagion detected yet between Energy Yard and Crypto Alley.",

  "Which districts are most correlated?":
    "Top correlated district pairs right now:\n\n1. **Chip Docks ↔ Comms Neon Ridge** (r=0.78) — Tech and telecom moving in lockstep, likely driven by shared infrastructure demand narrative.\n\n2. **Bank Towers ↔ Consumer Strip** (r=0.65) — Financials and consumer discretionary tracking together on interest rate expectations.\n\n3. **Bio Dome ↔ Industrials Foundry** (r=0.52) — Moderate correlation, possibly from defensive rotation flows.\n\nNotable decorrelation: **Energy Yard ↔ Crypto Alley** dropped from 0.71 to 0.23 — these two are diverging sharply, which historically precedes a regime shift in one or both.",

  "Market breadth summary":
    "Current market breadth across all 23 tickers:\n\n• **Advancers:** 15 (65%)\n• **Decliners:** 6 (26%)\n• **Unchanged:** 2 (9%)\n• **A/D Ratio:** 2.5 — bullish\n\nBreadth signal: **strong_bullish**. The rally is broad-based with participation across 6 of 8 districts. Only Energy Yard (storm) and parts of Crypto Alley are lagging. This is healthy — narrow rallies concentrated in 1-2 sectors tend to reverse, but this breadth suggests institutional conviction.\n\nKey risk: if breadth narrows below 1.2 ratio while prices hold, it signals distribution (smart money selling into strength).",
};

/** Fallback for queries not in the static map. */
const DEFAULT_OFFLINE_RESPONSE =
  "Interesting question. Based on current market conditions, the overall mood is cautiously bullish with 15 of 23 tickers advancing. Chip Docks and Bank Towers are showing the strongest momentum, while Energy Yard is the district to watch — it's in storm regime with elevated volatility. Crypto Alley is showing signs of choppy weather developing. I'd recommend checking the districts panel to explore sector dynamics, and keep an eye on the alliance cables between Chip Docks and Comms Neon Ridge — their high correlation (r=0.78) means moves in one will likely echo in the other.";

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
      async () => {
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
          // Use static demo response when backend is offline
          const staticReply = OFFLINE_RESPONSES[trimmed] ?? DEFAULT_OFFLINE_RESPONSE;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, text: staticReply, streaming: false }
                : m
            )
          );
        }
        setSending(false);
      }
    );

    abortRef.current = abort;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, sending, error, send, clearError };
}
