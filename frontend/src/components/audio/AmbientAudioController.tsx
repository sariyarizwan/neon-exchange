"use client";

import { useEffect, useRef } from "react";
import { useNeonStore } from "@/store/useNeonStore";

const AUDIO_PREFS_KEY = "neon-exchange-audio";
// TODO: replace placeholder ambience loop with the final cyberpunk city mix.
const TRACK_PATH = "/audio/ambience/neon-rain.wav";

export function AmbientAudioController() {
  const sound = useNeonStore((state) => state.sound);
  const setSoundEnabled = useNeonStore((state) => state.setSoundEnabled);
  const setSoundVolume = useNeonStore((state) => state.setSoundVolume);
  const setAudioBootstrapped = useNeonStore((state) => state.setAudioBootstrapped);
  const setAudioNeedsGesture = useNeonStore((state) => state.setAudioNeedsGesture);
  const setAudioPlaying = useNeonStore((state) => state.setAudioPlaying);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(AUDIO_PREFS_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as { enabled?: boolean; volume?: number };
      if (typeof parsed.enabled === "boolean") {
        setSoundEnabled(parsed.enabled);
      }
      if (typeof parsed.volume === "number") {
        setSoundVolume(Math.max(0, Math.min(100, parsed.volume)));
      }
    } catch (error) {
      console.error("Failed to parse audio preferences", error);
    }
  }, [setSoundEnabled, setSoundVolume]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      AUDIO_PREFS_KEY,
      JSON.stringify({
        enabled: sound.enabled,
        volume: sound.volume
      })
    );
  }, [sound.enabled, sound.volume]);

  useEffect(() => {
    const audio = new Audio(TRACK_PATH);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = sound.volume / 100;
    audioRef.current = audio;

    const onPlay = () => setAudioPlaying(true);
    const onPause = () => setAudioPlaying(false);
    const onError = () => {
      console.error("Ambience audio failed to load", audio.error);
      setAudioPlaying(false);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
  }, [setAudioPlaying]);

  useEffect(() => {
    const enableAudio = () => {
      setAudioBootstrapped(true);
      setAudioNeedsGesture(false);
    };

    window.addEventListener("pointerdown", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });

    return () => {
      window.removeEventListener("pointerdown", enableAudio);
      window.removeEventListener("keydown", enableAudio);
    };
  }, [setAudioBootstrapped, setAudioNeedsGesture]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = sound.volume / 100;
  }, [sound.volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!sound.enabled) {
      audio.pause();
      setAudioNeedsGesture(false);
      return;
    }

    if (!sound.bootstrapped) {
      setAudioNeedsGesture(true);
      return;
    }

    const playAudio = async () => {
      try {
        await audio.play();
        setAudioPlaying(true);
        setAudioNeedsGesture(false);
      } catch (error) {
        console.error("Ambience playback failed", error);
        setAudioPlaying(false);
        setAudioNeedsGesture(true);
      }
    };

    void playAudio();
  }, [setAudioNeedsGesture, setAudioPlaying, sound.bootstrapped, sound.enabled]);

  return null;
}
