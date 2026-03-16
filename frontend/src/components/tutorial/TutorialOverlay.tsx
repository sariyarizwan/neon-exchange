"use client";

import { useEffect } from "react";
import { TUTORIAL_STEPS } from "./tutorialSteps";
import { TutorialSpotlight } from "./TutorialSpotlight";
import { TutorialStep } from "./TutorialStep";
import type { UseTutorialReturn } from "@/hooks/useTutorial";

type TutorialOverlayProps = {
  tutorial: UseTutorialReturn;
};

export function TutorialOverlay({ tutorial }: TutorialOverlayProps) {
  const { active, step, totalSteps, next, back, skip } = tutorial;

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent WASD and movement keys from propagating while tutorial is active
      const movementKeys = new Set(["w", "a", "s", "d", "W", "A", "S", "D", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
      if (movementKeys.has(event.key)) {
        event.stopPropagation();
        event.preventDefault();
      }

      if (event.key === "Enter" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        next();
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        skip();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        back();
      }
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [active, next, back, skip]);

  if (!active) return null;

  const currentStep = TUTORIAL_STEPS[step];
  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <TutorialSpotlight target={currentStep.spotlightTarget} />
      <TutorialStep
        step={currentStep}
        currentIndex={step}
        totalSteps={totalSteps}
        onNext={next}
        onBack={back}
        onSkip={skip}
      />
    </div>
  );
}
