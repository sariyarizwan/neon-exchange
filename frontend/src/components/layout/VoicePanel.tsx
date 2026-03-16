"use client";

import { useEffect, useRef } from "react";
import { useVoice, type VoiceConnectionState } from "@/hooks/useVoice";
import { cn } from "@/lib/cn";

const STATE_LABELS: Record<VoiceConnectionState, string> = {
  disconnected: "Standby",
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
            const height = Math.max(2, audioLevel * 24 * (1 - offset * 0.5));
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
          {transcript
            .filter((line) => !line.includes("Error:") && !line.includes("error:"))
            .slice(0, 10)
            .map((line, i) => (
            <div
              key={`${i}-${line.slice(0, 20)}`}
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
