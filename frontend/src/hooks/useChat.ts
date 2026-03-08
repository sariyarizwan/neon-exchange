"use client";

import { useCallback, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api";
import { useNeonStore } from "@/store/useNeonStore";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
};

type UseChatResult = {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  clearError: () => void;
};

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Market intel online. Ask me about districts, tickers, or market conditions.",
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idCounter = useRef(1);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `msg-${idCounter.current++}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    setError(null);

    try {
      const state = useNeonStore.getState();
      const response = await sendChatMessage(trimmed, {
        districtId: state.selectedDistrictId,
        tickerId: state.selectedTickerId,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${idCounter.current++}`,
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError("Market intel offline");
      const fallbackMsg: ChatMessage = {
        id: `msg-${idCounter.current++}`,
        role: "assistant",
        text: "Market intel temporarily unavailable. Backend connection required for AI responses.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setSending(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { messages, sending, error, send, clearError };
}
