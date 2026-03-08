"use client";

import { useEffect } from "react";
import { useNeonStore } from "@/store/useNeonStore";

const typeIcons: Record<string, string> = {
  storm: "\u26A1",
  crowd: "\uD83D\uDC65",
  alliance: "\uD83D\uDD17",
  news: "\uD83D\uDCF0",
  mood: "\uD83C\uDFAD",
};

const typeBorders: Record<string, string> = {
  storm: "border-amber-400/40",
  crowd: "border-neon-cyan/40",
  alliance: "border-neon-magenta/40",
  news: "border-neon-lime/40",
  mood: "border-white/20",
};

export function QuestToasts() {
  const questToasts = useNeonStore((state) => state.questToasts);
  const dismissQuestToast = useNeonStore((state) => state.dismissQuestToast);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (questToasts.length === 0) return;
    const now = Date.now();
    const timers = questToasts
      .filter((t) => now - t.createdAt < 6000)
      .map((t) => {
        const remaining = 6000 - (now - t.createdAt);
        return window.setTimeout(() => dismissQuestToast(t.id), remaining);
      });
    return () => timers.forEach(clearTimeout);
  }, [questToasts, dismissQuestToast]);

  if (questToasts.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-16 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
      {questToasts.slice(0, 3).map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-xl border bg-slate-950/92 px-4 py-2 text-xs text-slate-100 shadow-lg backdrop-blur-sm transition-all duration-300 ${typeBorders[toast.type] ?? "border-white/10"}`}
        >
          <span className="text-sm">{typeIcons[toast.type] ?? "\u2728"}</span>
          <span className="max-w-[280px] truncate">{toast.text}</span>
          <button
            type="button"
            onClick={() => dismissQuestToast(toast.id)}
            className="ml-1 text-slate-500 hover:text-white"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
