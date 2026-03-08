"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ResizablePanel } from "@/components/ui/ResizablePanel";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/cn";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sending, error, send } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    send(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 right-[230px] z-30 flex flex-col items-end gap-2">
      {open ? (
        <ResizablePanel
          initialWidth={320}
          initialHeight={400}
          minWidth={260}
          minHeight={280}
          storageKey="floating-chat"
          className="flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Market Intel
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white"
                title="Minimize"
              >
                _
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                  "max-w-[85%] rounded-xl px-3 py-2",
                  msg.role === "user"
                    ? "ml-auto border border-neon-cyan/20 bg-neon-cyan/8 text-right"
                    : "mr-auto bg-slate-900/80"
                )}
              >
                <div className="text-[11px] leading-[1.5] text-slate-200">
                  {msg.text}
                </div>
                <div className="mt-0.5 text-[9px] text-slate-500">
                  {msg.timestamp}
                </div>
              </div>
            ))}
            {sending ? (
              <div className="mr-auto max-w-[85%] rounded-xl bg-slate-900/80 px-3 py-2">
                <div className="text-[11px] text-slate-400 animate-pulse">
                  Analyzing market data...
                </div>
              </div>
            ) : null}
          </div>

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
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="rounded-lg border border-neon-cyan/35 bg-neon-cyan/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-100 transition hover:bg-neon-cyan/16 disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </ResizablePanel>
      ) : null}

      <button
        type="button"
        aria-label="Open market chat"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border bg-slate-950/88 text-sm font-bold transition",
          open
            ? "border-neon-cyan/50 text-cyan-100 shadow-neon-cyan"
            : "border-slate-700 text-slate-400 hover:border-neon-cyan/35 hover:text-cyan-100"
        )}
        title="Market Intel Chat"
      >
        &#x25A4;
      </button>
    </div>
  );
}
