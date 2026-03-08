"use client";

import { useState } from "react";
import { districts } from "@/mock/districts";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";

const typeIcons: Record<string, string> = {
  storm: "\u26A1",
  crowd: "\uD83D\uDC65",
  alliance: "\uD83D\uDD17",
  news: "\uD83D\uDCF0",
  mood: "\uD83C\uDFAD",
  trade: "\uD83D\uDCB0",
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function QuestLog() {
  const questLogOpen = useNeonStore((state) => state.questLogOpen);
  const toggleQuestLog = useNeonStore((state) => state.toggleQuestLog);
  const questLog = useNeonStore((state) => state.questLog);
  const markQuestInactive = useNeonStore((state) => state.markQuestInactive);
  const focusDistrict = useNeonStore((state) => state.focusDistrict);
  const [tab, setTab] = useState<"active" | "history">("active");

  if (!questLogOpen) return null;

  const activeEntries = questLog.filter((e) => e.active);
  const historyEntries = questLog;
  const entries = tab === "active" ? activeEntries : historyEntries;

  return (
    <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
      <div className="w-[380px] max-h-[480px] flex flex-col rounded-2xl border border-white/10 bg-slate-950/96 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">&#x1F4DC;</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Quest Log</span>
          </div>
          <button
            type="button"
            onClick={toggleQuestLog}
            className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-300 hover:text-white"
          >
            x
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={cn(
              "flex-1 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
              tab === "active" ? "border-b-2 border-neon-cyan text-neon-cyan" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Active ({activeEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={cn(
              "flex-1 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
              tab === "history" ? "border-b-2 border-neon-cyan text-neon-cyan" : "text-slate-500 hover:text-slate-300"
            )}
          >
            History ({historyEntries.length})
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2 space-y-1.5" style={{ maxHeight: 360 }}>
          {entries.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-slate-500">
              {tab === "active" ? "No active quests. Explore the city!" : "No events recorded yet."}
            </div>
          ) : (
            entries.map((entry) => {
              const district = entry.districtId ? districts.find((d) => d.id === entry.districtId) : null;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border px-3 py-2",
                    entry.active ? "border-white/10 bg-slate-900/60" : "border-white/5 bg-slate-950/40 opacity-60"
                  )}
                >
                  <span className="mt-0.5 text-sm">{typeIcons[entry.type] ?? "\u2728"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">{timeAgo(entry.createdAt)}</span>
                      {district ? (
                        <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: district.accent }}>
                          {district.name}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-200">{entry.text}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {district ? (
                      <button
                        type="button"
                        onClick={() => {
                          focusDistrict(district.id);
                          markQuestInactive(entry.id);
                        }}
                        className="rounded-md border border-neon-cyan/30 bg-neon-cyan/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-neon-cyan hover:bg-neon-cyan/15"
                      >
                        Go
                      </button>
                    ) : null}
                    {entry.active && tab === "active" ? (
                      <button
                        type="button"
                        onClick={() => markQuestInactive(entry.id)}
                        className="text-[10px] text-slate-600 hover:text-slate-300"
                        title="Dismiss"
                      >
                        \u2713
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
