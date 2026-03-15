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
