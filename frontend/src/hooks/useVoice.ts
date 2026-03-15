"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVoiceWebSocketUrl } from "@/lib/api";

export type VoiceConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "speaking"
  | "processing";

type VoiceState = {
  connectionState: VoiceConnectionState;
  transcript: string[];
  audioLevel: number;
};

/**
 * Manages WebSocket connection to Gemini Live voice endpoint.
 * Uses AudioWorklet for capture, queued playback for responses.
 */
export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    connectionState: "disconnected",
    transcript: [],
    audioLevel: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const updateState = useCallback(
    (partial: Partial<VoiceState>) =>
      setState((s) => ({ ...s, ...partial })),
    []
  );

  const addTranscript = useCallback((line: string, speaker: "You" | "Oracle" = "Oracle") => {
    setState((s) => ({
      ...s,
      transcript: [`${speaker}: ${line}`, ...s.transcript].slice(0, 30),
    }));
  }, []);

  // --- Playback queue ---
  const playNext = useCallback(() => {
    const ctx = playbackContextRef.current;
    const queue = playbackQueueRef.current;
    if (!ctx || queue.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;
    const buffer = queue.shift()!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.onended = () => playNext();
    src.start();
  }, []);

  const enqueueAudio = useCallback(
    (base64Data: string) => {
      try {
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const ctx =
          playbackContextRef.current ?? new AudioContext({ sampleRate: 24000 });
        playbackContextRef.current = ctx;
        const buffer = ctx.createBuffer(1, bytes.length / 2, 24000);
        const channel = buffer.getChannelData(0);
        const view = new Int16Array(bytes.buffer);
        for (let i = 0; i < view.length; i++) {
          channel[i] = view[i] / 32768;
        }
        playbackQueueRef.current.push(buffer);
        if (!isPlayingRef.current) playNext();
      } catch {
        // ignore
      }
    },
    [playNext]
  );

  // --- WebSocket ---
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    updateState({ connectionState: "connecting" });
    const ws = new WebSocket(getVoiceWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      updateState({ connectionState: "connected" });
      addTranscript("Voice channel open. Hold Space to speak.", "Oracle");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "text" && msg.text) {
          addTranscript(msg.text, "Oracle");
          updateState({ connectionState: "connected" });
        }
        if (msg.type === "audio" && msg.data) {
          enqueueAudio(msg.data);
          updateState({ connectionState: "processing" });
        }
        if (msg.type === "error") {
          addTranscript(`Error: ${msg.message}`, "Oracle");
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => updateState({ connectionState: "disconnected" });
    ws.onerror = () => updateState({ connectionState: "disconnected" });
  }, [updateState, addTranscript, enqueueAudio]);

  // --- Stop capture helper ---
  const stopCaptureRef = useRef(() => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    captureNodeRef.current?.disconnect();
    captureNodeRef.current = null;
    captureContextRef.current?.close();
    captureContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    analyserRef.current = null;
  });

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.send(JSON.stringify({ type: "end" })); } catch { /* ignore */ }
      wsRef.current.close();
      wsRef.current = null;
    }
    stopCaptureRef.current();
    updateState({ connectionState: "disconnected", audioLevel: 0 });
  }, [updateState]);

  // --- Audio capture ---
  const startSpeaking = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      captureContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // Audio level analyser
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      levelIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setState((s) => ({ ...s, audioLevel: Math.min(1, rms * 3) }));
      }, 50);

      // Try AudioWorklet, fall back to ScriptProcessorNode
      try {
        await ctx.audioWorklet.addModule("/audio-processor.js");
        const worklet = new AudioWorkletNode(ctx, "pcm-capture-processor");
        captureNodeRef.current = worklet;

        worklet.port.onmessage = (e) => {
          if (e.data.type === "pcm" && wsRef.current?.readyState === WebSocket.OPEN) {
            const pcm16 = new Int16Array(e.data.data);
            const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
            wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
          }
        };

        source.connect(worklet);
        worklet.connect(ctx.destination);
      } catch {
        // Fallback to ScriptProcessorNode
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          const pcmInput = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(pcmInput.length);
          for (let i = 0; i < pcmInput.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(pcmInput[i] * 32767)));
          }
          const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
          wsRef.current?.send(JSON.stringify({ type: "audio", data: base64 }));
        };
        source.connect(processor);
        processor.connect(ctx.destination);
      }

      updateState({ connectionState: "speaking" });
      addTranscript("Listening...", "Oracle");
    } catch {
      addTranscript("Mic access denied", "Oracle");
    }
  }, [connect, updateState, addTranscript]);

  const stopSpeaking = useCallback(() => {
    stopCaptureRef.current();
    updateState({ connectionState: "connected", audioLevel: 0 });
  }, [updateState]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      addTranscript(text, "You");
    }
  }, [addTranscript]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState: state.connectionState,
    connected: state.connectionState !== "disconnected",
    speaking: state.connectionState === "speaking",
    transcript: state.transcript,
    audioLevel: state.audioLevel,
    connect,
    disconnect,
    startSpeaking,
    stopSpeaking,
    sendText,
  };
}
