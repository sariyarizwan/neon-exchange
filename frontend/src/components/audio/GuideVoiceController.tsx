"use client";

import { useEffect, useMemo, useRef } from "react";
import { districtThemes } from "@/mock/cityThemes";
import { districtNewsBoards, tickerNews } from "@/mock/news";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { useNeonStore } from "@/store/useNeonStore";

const buildGuideLine = (selectedDistrictId: string | null, selectedTickerId: string | null, activeNewsstandDistrictId: string | null) => {
  if (selectedTickerId) {
    const ticker = tickers.find((entry) => entry.id === selectedTickerId);
    if (ticker) {
      const newsLine = tickerNews[ticker.id]?.lines[0]?.text ?? `${ticker.symbol} is active. Watch the nearby tape and crowd flow.`;
      return `Gemini Guide: ${ticker.symbol}. ${newsLine}`;
    }
  }

  if (activeNewsstandDistrictId) {
    const district = districts.find((entry) => entry.id === activeNewsstandDistrictId);
    const headline = districtNewsBoards[activeNewsstandDistrictId]?.lines[0]?.text ?? "Newsstand loaded. Fresh district headlines are waiting here.";
    return `Gemini Guide: ${district?.name ?? "District"} newsstand. ${headline}`;
  }

  const districtId = selectedDistrictId ?? "consumer-strip";
  const district = districts.find((entry) => entry.id === districtId);
  const theme = districtThemes[districtId];
  return `Gemini Guide: ${district?.name ?? "Central Hub"}. ${theme?.questHint ?? "Walk the road loop and inspect the active kiosks."}`;
};

export function GuideVoiceController() {
  const sound = useNeonStore((state) => state.sound);
  const selectedDistrictId = useNeonStore((state) => state.selectedDistrictId);
  const selectedTickerId = useNeonStore((state) => state.selectedTickerId);
  const activeNewsstandDistrictId = useNeonStore((state) => state.activeNewsstandDistrictId);
  const appendTranscriptLine = useNeonStore((state) => state.appendTranscriptLine);
  const setGuideMessage = useNeonStore((state) => state.setGuideMessage);
  const setGuideSpeaking = useNeonStore((state) => state.setGuideSpeaking);
  const setAudioPlaying = useNeonStore((state) => state.setAudioPlaying);
  const lastLineRef = useRef<string>("");
  const lastSpokenAtRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const line = useMemo(
    () => buildGuideLine(selectedDistrictId, selectedTickerId, activeNewsstandDistrictId),
    [activeNewsstandDistrictId, selectedDistrictId, selectedTickerId]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const synth = window.speechSynthesis;
    const speak = () => {
      if (!sound.enabled || sound.mode !== "guide") {
        synth.cancel();
        setGuideSpeaking(false);
        setAudioPlaying(false);
        return;
      }

      setGuideMessage(line);

      if (!sound.bootstrapped) {
        return;
      }

      const now = Date.now();
      if (lastLineRef.current === line && now - lastSpokenAtRef.current < 10000) {
        return;
      }

      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.rate = 1;
      utterance.pitch = 1.06;
      utterance.volume = sound.volume / 100;
      utterance.onstart = () => {
        setGuideSpeaking(true);
        setAudioPlaying(true);
      };
      utterance.onend = () => {
        setGuideSpeaking(false);
        setAudioPlaying(false);
      };
      utterance.onerror = (error) => {
        console.error("Guide voice playback failed", error);
        setGuideSpeaking(false);
        setAudioPlaying(false);
      };

      lastLineRef.current = line;
      lastSpokenAtRef.current = now;
      appendTranscriptLine(line);
      synth.speak(utterance);
    };

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(speak, 260);

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      if (Date.now() - lastSpokenAtRef.current > 15000) {
        speak();
      }
    }, 4000);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      synth.cancel();
    };
  }, [appendTranscriptLine, line, setAudioPlaying, setGuideMessage, setGuideSpeaking, sound.bootstrapped, sound.enabled, sound.mode, sound.volume]);

  return null;
}
