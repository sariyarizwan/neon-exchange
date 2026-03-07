"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVoiceWebSocketUrl } from "@/lib/api";

type VoiceState = {
  connected: boolean;
  speaking: boolean;
  transcript: string[];
};

/**
 * Manages WebSocket connection to the Gemini Live voice endpoint.
 * Handles push-to-talk audio capture and playback.
 */
export function useVoice() {
  const [state, setState] = useState<VoiceState>({
    connected: false,
    speaking: false,
    transcript: [],
  });
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getVoiceWebSocketUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "text" && msg.text) {
          setState((s) => ({
            ...s,
            transcript: [msg.text, ...s.transcript].slice(0, 20),
          }));
        }
        if (msg.type === "audio" && msg.data) {
          playAudio(msg.data);
        }
        if (msg.type === "error") {
          setState((s) => ({
            ...s,
            transcript: [`[Error] ${msg.message}`, ...s.transcript].slice(0, 20),
          }));
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false, speaking: false }));
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, connected: false }));
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "end" }));
      wsRef.current.close();
      wsRef.current = null;
    }
    stopCapture();
    setState((s) => ({ ...s, connected: false, speaking: false }));
  }, []);

  const startSpeaking = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(input[i] * 32767)));
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        wsRef.current?.send(JSON.stringify({ type: "audio", data: base64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setState((s) => ({ ...s, speaking: true }));
    } catch {
      setState((s) => ({
        ...s,
        transcript: ["[Mic access denied]", ...s.transcript].slice(0, 20),
      }));
    }
  }, [connect]);

  const stopSpeaking = useCallback(() => {
    stopCapture();
    setState((s) => ({ ...s, speaking: false }));
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text }));
    }
  }, []);

  function stopCapture() {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }

  function playAudio(base64Data: string) {
    try {
      const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const ctx = new AudioContext({ sampleRate: 24000 });
      const buffer = ctx.createBuffer(1, bytes.length / 2, 24000);
      const channel = buffer.getChannelData(0);
      const view = new Int16Array(bytes.buffer);
      for (let i = 0; i < view.length; i++) {
        channel[i] = view[i] / 32768;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start();
    } catch {
      // ignore playback errors
    }
  }

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    startSpeaking,
    stopSpeaking,
    sendText,
  };
}
