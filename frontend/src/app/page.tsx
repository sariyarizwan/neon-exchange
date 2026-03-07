"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AmbientAudioController } from "@/components/audio/AmbientAudioController";
import { BottomDock } from "@/components/layout/BottomDock";
import { CenterStage } from "@/components/layout/CenterStage";
import { RightPanel } from "@/components/layout/RightPanel";
import { SidebarLeft } from "@/components/layout/SidebarLeft";
import { TopHeader } from "@/components/layout/TopHeader";
import { cn } from "@/lib/cn";
import { readStoredAuth } from "@/lib/mockAuth";
import { useNeonStore } from "@/store/useNeonStore";
import type { MockAuthState } from "@/types/auth";

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable || target.getAttribute("role") === "textbox";
};

export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<MockAuthState | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const stormModeActive = useNeonStore((state) => state.stormModeActive);
  const focusMode = useNeonStore((state) => state.focusMode);
  const focusRightPanelOpen = useNeonStore((state) => state.focusRightPanelOpen);
  const overlaysDimmed = useNeonStore((state) => state.overlaysDimmed);
  const clearSelection = useNeonStore((state) => state.clearSelection);
  const toggleMic = useNeonStore((state) => state.toggleMic);
  const setAvatarId = useNeonStore((state) => state.setAvatarId);
  const setFocusRightPanelOpen = useNeonStore((state) => state.setFocusRightPanelOpen);

  useEffect(() => {
    const stored = readStoredAuth();
    if (!stored?.isAuthed) {
      setCheckedAuth(true);
      router.replace("/login");
      return;
    }

    setAuth(stored);
    setAvatarId(stored.user.avatarId);
    setCheckedAuth(true);
  }, [router, setAvatarId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isTypingTarget(event.target)) {
        event.preventDefault();
        const searchInput = document.getElementById("ticker-search-input");
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus();
          searchInput.select();
        }
      }

      if (event.key === "Escape") {
        clearSelection();
      }

      if (event.code === "Space" && !isTypingTarget(event.target)) {
        event.preventDefault();
        toggleMic();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearSelection, toggleMic]);

  if (!checkedAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base-950 text-slate-100">
        <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="scanline-overlay absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="glass-panel panel-frame relative z-10 rounded-[1.8rem] px-6 py-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan">NEON EXCHANGE</div>
          <div className="mt-2 text-sm text-slate-300">Loading city access...</div>
        </div>
      </main>
    );
  }

  if (!auth) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-base-950 text-slate-100">
      <AmbientAudioController />
      <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="scanline-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      {stormModeActive ? <div className="storm-tint-overlay absolute inset-0 z-20" aria-hidden="true" /> : null}

      <div className="relative z-10 grid h-screen min-h-screen grid-rows-[auto_minmax(0,1fr)_auto]">
        <TopHeader user={auth.user} />
        <section
          className={cn(
            "relative grid min-h-0 gap-4 overflow-hidden px-4 pb-3 pt-4 max-[980px]:grid-rows-[1fr_auto]",
            focusMode
              ? focusRightPanelOpen
                ? "grid-cols-[56px_minmax(0,1fr)_minmax(320px,360px)]"
                : "grid-cols-[56px_minmax(0,1fr)_0px]"
              : "grid-cols-[minmax(250px,290px)_minmax(0,1fr)_minmax(320px,380px)] max-[1180px]:grid-cols-[240px_minmax(0,1fr)_320px] max-[980px]:grid-cols-[220px_minmax(0,1fr)]"
          )}
          style={{ height: "calc(100vh - 10.75rem)" }}
        >
          <SidebarLeft />
          <CenterStage />
          <RightPanel />
          {focusMode && !focusRightPanelOpen ? (
            <button
              type="button"
              onClick={() => setFocusRightPanelOpen(true)}
              className={cn(
                "absolute right-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-neon-cyan/35 bg-slate-950/88 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-neon-cyan transition",
                overlaysDimmed && "pointer-events-none opacity-20"
              )}
            >
              Panel
            </button>
          ) : null}
        </section>
        <BottomDock />
      </div>
    </main>
  );
}
