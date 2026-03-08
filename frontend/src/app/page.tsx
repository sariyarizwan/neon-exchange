"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AmbientAudioController } from "@/components/audio/AmbientAudioController";
import { GuideVoiceController } from "@/components/audio/GuideVoiceController";
import { CenterStage } from "@/components/layout/CenterStage";
import { DistrictPopup } from "@/components/layout/DistrictPopup";
import { FloatingControls } from "@/components/layout/FloatingControls";
import { FloatingMinimap } from "@/components/layout/FloatingMinimap";
import { RightPanel } from "@/components/layout/RightPanel";
import { QuestToasts } from "@/components/layout/QuestToasts";
import { LiveDataProvider } from "@/components/LiveDataProvider";
import { useQuestTriggers } from "@/hooks/useQuestTriggers";
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
  const clearSelection = useNeonStore((state) => state.clearSelection);
  const toggleMic = useNeonStore((state) => state.toggleMic);
  const setAvatarId = useNeonStore((state) => state.setAvatarId);

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
    <LiveDataProvider>
    <QuestTriggerWatcher />
    <main className="relative min-h-screen overflow-hidden bg-base-950 text-slate-100">
      <AmbientAudioController />
      <GuideVoiceController />
      <div className="noise-overlay absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="scanline-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      {stormModeActive ? <div className="storm-tint-overlay absolute inset-0 z-20" aria-hidden="true" /> : null}

      <div className="relative z-10 h-screen">
        <FloatingControls user={auth.user} />
        <section className="relative h-screen overflow-hidden">
          <CenterStage />
        </section>
        <RightPanel />
        <DistrictPopup />
        <QuestToasts />
        <FloatingMinimap />
      </div>
    </main>
    </LiveDataProvider>
  );
}

/** Invisible component that runs the quest trigger hook inside LiveDataProvider context */
function QuestTriggerWatcher() {
  useQuestTriggers();
  return null;
}
