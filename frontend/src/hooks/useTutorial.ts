"use client";

import { useCallback, useEffect, useState } from "react";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorialSteps";
import { readStoredAuth } from "@/lib/mockAuth";

const STORAGE_KEY = "neon-exchange-tutorial-complete";

export interface UseTutorialReturn {
  active: boolean;
  step: number;
  totalSteps: number;
  next: () => void;
  back: () => void;
  skip: () => void;
  restart: () => void;
}

export function useTutorial(): UseTutorialReturn {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const totalSteps = TUTORIAL_STEPS.length;

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const auth = readStoredAuth();
    if (!completed && auth?.isAuthed) {
      setActive(true);
      setStep(0);
    }
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
  }, []);

  const next = useCallback(() => {
    setStep((prev) => {
      if (prev >= totalSteps - 1) {
        complete();
        return prev;
      }
      return prev + 1;
    });
  }, [totalSteps, complete]);

  const back = useCallback(() => {
    setStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const restart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setActive(true);
    setStep(0);
  }, []);

  return { active, step, totalSteps, next, back, skip, restart };
}
