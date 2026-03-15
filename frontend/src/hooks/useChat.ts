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
