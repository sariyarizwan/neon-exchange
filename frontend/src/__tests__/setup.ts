import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof globalThis.ResizeObserver;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  return setTimeout(cb, 0) as unknown as number;
});
global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock canvas context
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  createRadialGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  canvas: { width: 1200, height: 800 },
});

// Mock EventSource (not available in jsdom)
global.EventSource = class EventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readyState = 0;
  url: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  private listeners: Record<string, Array<(e: unknown) => void>> = {};
  constructor(url: string) {
    this.url = url;
  }
  addEventListener(event: string, listener: (e: unknown) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }
  removeEventListener(event: string, listener: (e: unknown) => void) {
    this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== listener);
  }
  dispatchEvent(event: Event): boolean { return true; }
  close = vi.fn();
  withCredentials = false;
  _emit(event: string, data: unknown) {
    for (const l of this.listeners[event] ?? []) l(data);
  }
} as unknown as typeof globalThis.EventSource;

// Mock AudioContext
global.AudioContext = class AudioContext {
  createAnalyser() {
    return {
      connect: vi.fn(), disconnect: vi.fn(), fftSize: 0,
      frequencyBinCount: 128, getByteTimeDomainData: vi.fn(),
    };
  }
  createGain() { return { connect: vi.fn(), gain: { value: 1 } }; }
  createBufferSource() { return { connect: vi.fn(), start: vi.fn(), buffer: null }; }
  createBuffer() { return { getChannelData: vi.fn().mockReturnValue(new Float32Array(0)) }; }
  destination = {};
  sampleRate = 16000;
  state = "running" as AudioContextState;
  close = vi.fn();
  // Minimal stubs for type compat
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  decodeAudioData = vi.fn().mockResolvedValue(null);
  createOscillator = vi.fn();
  createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn(), disconnect: vi.fn() });
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) };
  createScriptProcessor = vi.fn().mockReturnValue({
    connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null,
  });
} as unknown as typeof globalThis.AudioContext;
