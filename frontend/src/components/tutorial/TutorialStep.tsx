"use client";

import { useEffect, useState } from "react";
import type { TutorialStepDef } from "./tutorialSteps";
import { cn } from "@/lib/cn";

type TutorialStepProps = {
  step: TutorialStepDef;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
};

const CARD_GAP = 16;

export function TutorialStep({ step, currentIndex, totalSteps, onNext, onBack, onSkip }: TutorialStepProps) {
  const [position, setPosition] = useState<{ top?: number; left?: number; right?: number } | null>(null);

  // Calculate position relative to spotlight target
  useEffect(() => {
    if (!step.spotlightTarget) {
      setPosition(null);
      return;
    }

    const calculate = () => {
      const target = document.querySelector(`[data-tutorial-target="${step.spotlightTarget}"]`);
      if (!target) {
        setPosition(null);
        return;
      }

      const bounds = target.getBoundingClientRect();
      const cardWidth = 448;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (step.cardPosition === "right") {
        const left = bounds.right + CARD_GAP;
        const top = Math.max(16, Math.min(bounds.top, viewportHeight - 400));
        if (left + cardWidth < viewportWidth - 16) {
          setPosition({ top, left });
          return;
        }
      }

      if (step.cardPosition === "left") {
        const right = viewportWidth - bounds.left + CARD_GAP;
        const top = Math.max(16, Math.min(bounds.top, viewportHeight - 400));
        if (right + cardWidth < viewportWidth - 16) {
          setPosition({ top, right });
          return;
        }
      }

      // Fallback: center
      setPosition(null);
    };

    calculate();
    window.addEventListener("resize", calculate);
    return () => {
      window.removeEventListener("resize", calculate);
    };
  }, [step.spotlightTarget, step.cardPosition]);

  const isLastStep = currentIndex === totalSteps - 1;
  const isFirstStep = currentIndex === 0;

  const centered = !position;

  const card = (
    <div
      key={currentIndex}
      className="w-full max-w-lg animate-[fadeSlideUp_300ms_ease-out_both]"
    >
      <div className="glass-panel rounded-2xl shadow-neon-cyan">
        {/* Neon cyan top accent border */}
        <div className="h-[2px] rounded-t-2xl bg-neon-cyan/60" />

        <div className="px-5 py-4">
          {/* Title */}
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neon-cyan">
            <span className="mr-1.5 text-neon-cyan/60">{"\u25C8"}</span>
            {step.title}
          </h3>

          {/* Body */}
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-300">
            {step.body}
          </p>

          {/* Step dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  index === currentIndex
                    ? "bg-neon-cyan shadow-[0_0_6px_rgba(51,245,255,0.5)]"
                    : "bg-slate-600"
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={isFirstStep}
              className={cn(
                "rounded-xl border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition",
                isFirstStep
                  ? "cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600"
                  : "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-600 hover:text-white"
              )}
            >
              Back
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="text-[10px] uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-300"
            >
              Skip Tutorial
            </button>

            <button
              type="button"
              onClick={onNext}
              className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-cyan transition hover:bg-neon-cyan/20"
            >
              {isLastStep ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Centered: use flexbox centering on a full-screen container
  if (centered) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {card}
        </div>
      </div>
    );
  }

  // Positioned next to spotlight target
  return (
    <div
      className="fixed z-[9999] pointer-events-auto"
      style={{
        top: position.top,
        left: position.left,
        right: position.right,
      }}
    >
      {card}
    </div>
  );
}
