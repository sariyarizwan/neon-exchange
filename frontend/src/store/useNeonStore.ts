"use client";

import { create } from "zustand";
import { avatarOptions, newsstands } from "@/mock/cityWorld";
import { districts } from "@/mock/districts";
import { tickers } from "@/mock/tickers";
import { cameraTopLeftForWorldPoint, clampCameraPosition, HOME_WORLD_POINT } from "@/lib/world";
import type { RightPanelTab, AgentPersona, EvidenceItem, FacingDirection, GuideState, PlayerState, SoundMode, SoundState } from "@/types/store";

type ToggleKey = "showAlliances" | "showStorms" | "showRumors";

type CameraState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  targetX: number | null;
  targetY: number | null;
};

type ScenePulse = {
  districtId: string | null;
  startedAt: number;
  expiresAt: number;
  kind: "scene" | "rumor" | null;
};

type NeonState = {
  selectedTickerId: string | null;
  selectedDistrictId: string | null;
  activeRightPanelTab: RightPanelTab;
  focusMode: boolean;
  focusRightPanelOpen: boolean;
  overlaysDimmed: boolean;
  showAlliances: boolean;
  showStorms: boolean;
  showRumors: boolean;
  stormModeActive: boolean;
  dock: {
    connected: boolean;
    micActive: boolean;
    transcriptLines: string[];
    persona: AgentPersona;
  };
  camera: CameraState;
  player: PlayerState;
  sound: SoundState;
  guide: GuideState;
  pluginMode: boolean;
  showPoiMarkers: boolean;
  activeNewsstandDistrictId: string | null;
  scenePulse: ScenePulse;
  evidenceTimeline: EvidenceItem[];
  setSelectedTickerId: (tickerId: string | null) => void;
  setSelectedDistrictId: (districtId: string | null) => void;
  setActiveRightPanelTab: (tab: RightPanelTab) => void;
  toggleFocusMode: () => void;
  setFocusRightPanelOpen: (open: boolean) => void;
  markWorldMotion: () => void;
  setFilterToggle: (key: ToggleKey, value: boolean) => void;
  toggleMic: () => void;
  interruptMic: () => void;
  setPersona: (persona: AgentPersona) => void;
  appendTranscriptLine: (line: string) => void;
  setViewport: (width: number, height: number) => void;
  setCamera: (partial: Partial<CameraState>) => void;
  setPlayer: (partial: Partial<PlayerState>) => void;
  setPlayerPosition: (x: number, y: number) => void;
  setPlayerFacing: (facing: FacingDirection) => void;
  setAvatarId: (avatarId: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setSoundMode: (mode: SoundMode) => void;
  setAudioBootstrapped: (bootstrapped: boolean) => void;
  setAudioNeedsGesture: (needsGesture: boolean) => void;
  setAudioPlaying: (playing: boolean) => void;
  setGuideSpeaking: (speaking: boolean) => void;
  setGuideMessage: (message: string | null) => void;
  setPluginMode: (active: boolean) => void;
  setShowPoiMarkers: (active: boolean) => void;
  setActiveNewsstandDistrictId: (districtId: string | null) => void;
  focusWorldPoint: (x: number, y: number) => void;
  focusDistrict: (districtId: string) => void;
  focusHome: () => void;
  clearCameraTarget: () => void;
  clearSelection: () => void;
  triggerDistrictPulse: (districtId: string, kind: "scene" | "rumor", duration?: number) => void;
  clearStormMode: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  addEvidence: (entry: Omit<EvidenceItem, "id" | "timestamp">) => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const ZOOM_STEP = 0.1;

const initialViewport = { width: 1400, height: 860 };
const initialTopLeft = cameraTopLeftForWorldPoint(
  HOME_WORLD_POINT.x,
  HOME_WORLD_POINT.y,
  initialViewport.width,
  initialViewport.height
);

const initialTranscript = [
  "Market Maker: Midtown spread is stable. Awaiting fresh tape.",
  "Whale: Watching BANK TOWERS and CRYPTO ALLEY for hidden size.",
  "News Desk: Rumor poster queue loaded. Live pipeline mocked.",
  "Market Maker: Central hub traffic elevated but orderly.",
  "News Desk: Gemini Live + ADK wiring is pending."
];

const initialEvidence: EvidenceItem[] = [
  {
    id: "ev-1",
    timestamp: "20:41",
    districtId: "consumer-strip",
    text: "Consumer Strip sentiment lights accelerated after the second neon open."
  },
  {
    id: "ev-2",
    timestamp: "20:46",
    tickerId: "coin",
    districtId: "crypto-alley",
    text: "Coin Circuit alliances widened into telecom rails during the last pulse."
  },
  {
    id: "ev-3",
    timestamp: "20:52",
    tickerId: "flux",
    districtId: "energy-yard",
    text: "Energy Yard traffic bands crossed high-volatility threshold."
  }
];

const initialNewsstand = newsstands.find((entry) => entry.districtId === "consumer-strip") ?? newsstands[0];
let overlayRestoreTimeout: number | null = null;
const soundTrackName = (mode: SoundMode) => (mode === "guide" ? "Gemini Guide (Mock)" : "neon-rain.wav");

export const useNeonStore = create<NeonState>((set, get) => ({
  selectedTickerId: null,
  selectedDistrictId: "consumer-strip",
  activeRightPanelTab: "scenes",
  focusMode: false,
  focusRightPanelOpen: false,
  overlaysDimmed: false,
  showAlliances: false,
  showStorms: true,
  showRumors: true,
  stormModeActive: false,
  dock: {
    connected: true,
    micActive: false,
    transcriptLines: initialTranscript,
    persona: "Market Maker"
  },
  camera: {
    x: initialTopLeft.x,
    y: initialTopLeft.y,
    vx: 0,
    vy: 0,
    zoom: 1,
    viewportWidth: initialViewport.width,
    viewportHeight: initialViewport.height,
    targetX: null,
    targetY: null
  },
  player: {
    x: initialNewsstand.x + 160,
    y: initialNewsstand.y - 110,
    vx: 0,
    vy: 0,
    facing: "down",
    avatarId: avatarOptions[0]?.id ?? "runner"
  },
  sound: {
    enabled: true,
    volume: 62,
    bootstrapped: false,
    needsGesture: false,
    playing: false,
    trackName: soundTrackName("guide"),
    mode: "guide"
  },
  guide: {
    speaking: false,
    message: "Gemini guide online. I will shadow your route through the market."
  },
  pluginMode: false,
  showPoiMarkers: false,
  activeNewsstandDistrictId: null,
  scenePulse: {
    districtId: null,
    startedAt: 0,
    expiresAt: 0,
    kind: null
  },
  evidenceTimeline: initialEvidence,
  setSelectedTickerId: (tickerId) =>
    set(() => {
      const ticker = tickers.find((entry) => entry.id === tickerId);

      return {
        selectedTickerId: tickerId,
        selectedDistrictId: ticker?.districtId ?? null,
        activeRightPanelTab: tickerId ? "scenes" : "evidence"
      };
    }),
  setSelectedDistrictId: (districtId) => set(() => ({ selectedDistrictId: districtId })),
  setActiveRightPanelTab: (tab) => set(() => ({ activeRightPanelTab: tab })),
  toggleFocusMode: () =>
    set((state) => ({
      focusMode: !state.focusMode,
      focusRightPanelOpen: state.focusMode ? false : state.focusRightPanelOpen
    })),
  setFocusRightPanelOpen: (open) => set(() => ({ focusRightPanelOpen: open })),
  markWorldMotion: () => {
    if (typeof window === "undefined") {
      set(() => ({ overlaysDimmed: true }));
      return;
    }
    set(() => ({ overlaysDimmed: true }));
    if (overlayRestoreTimeout !== null) {
      window.clearTimeout(overlayRestoreTimeout);
    }
    overlayRestoreTimeout = window.setTimeout(() => {
      set(() => ({ overlaysDimmed: false }));
    }, 1000);
  },
  setFilterToggle: (key, value) => set(() => ({ [key]: value })),
  toggleMic: () =>
    set((state) => {
      const micActive = !state.dock.micActive;
      const line = micActive
        ? `${state.dock.persona}: Push-to-talk armed. Streaming mock transcript...`
        : `${state.dock.persona}: Push-to-talk released. Standing by.`;

      return {
        dock: {
          ...state.dock,
          micActive,
          transcriptLines: [line, ...state.dock.transcriptLines].slice(0, 10)
        }
      };
    }),
  interruptMic: () =>
    set((state) => ({
      dock: {
        ...state.dock,
        micActive: false,
        transcriptLines: [`${state.dock.persona}: Interrupt received. Channel muted.`, ...state.dock.transcriptLines].slice(0, 10)
      }
    })),
  setPersona: (persona) =>
    set((state) => ({
      dock: {
        ...state.dock,
        persona,
        transcriptLines: [`Persona switched to ${persona}.`, ...state.dock.transcriptLines].slice(0, 10)
      }
    })),
  appendTranscriptLine: (line) =>
    set((state) => ({
      dock: {
        ...state.dock,
        transcriptLines: [line, ...state.dock.transcriptLines].slice(0, 12)
      }
    })),
  setViewport: (width, height) =>
    set((state) => {
      const position = clampCameraPosition(state.camera.x, state.camera.y, width, height, state.camera.zoom);
      const target =
        state.camera.targetX !== null && state.camera.targetY !== null
          ? clampCameraPosition(state.camera.targetX, state.camera.targetY, width, height, state.camera.zoom)
          : null;

      return {
        camera: {
          ...state.camera,
          viewportWidth: width,
          viewportHeight: height,
          x: position.x,
          y: position.y,
          targetX: target?.x ?? state.camera.targetX,
          targetY: target?.y ?? state.camera.targetY
        }
      };
    }),
  setCamera: (partial) =>
    set((state) => ({
      camera: {
        ...state.camera,
        ...partial
      }
    })),
  setPlayer: (partial) =>
    set((state) => ({
      player: {
        ...state.player,
        ...partial
      }
    })),
  setPlayerPosition: (x, y) =>
    set((state) => ({
      player: {
        ...state.player,
        x,
        y
      }
    })),
  setPlayerFacing: (facing) =>
    set((state) => ({
      player: {
        ...state.player,
        facing
      }
    })),
  setAvatarId: (avatarId) =>
    set((state) => ({
      player: {
        ...state.player,
        avatarId
      }
    })),
  setSoundEnabled: (enabled) =>
    set((state) => ({
      sound: {
        ...state.sound,
        enabled,
        needsGesture: enabled ? state.sound.needsGesture : false
      }
    })),
  setSoundVolume: (volume) =>
    set((state) => ({
      sound: {
        ...state.sound,
        volume
      }
    })),
  setSoundMode: (mode) =>
    set((state) => ({
      sound: {
        ...state.sound,
        mode,
        trackName: soundTrackName(mode),
        needsGesture: state.sound.enabled ? !state.sound.bootstrapped : false
      }
    })),
  setAudioBootstrapped: (bootstrapped) =>
    set((state) => ({
      sound: {
        ...state.sound,
        bootstrapped
      }
    })),
  setAudioNeedsGesture: (needsGesture) =>
    set((state) => ({
      sound: {
        ...state.sound,
        needsGesture
      }
    })),
  setAudioPlaying: (playing) =>
    set((state) => ({
      sound: {
        ...state.sound,
        playing
      }
    })),
  setGuideSpeaking: (speaking) => set((state) => ({ guide: { ...state.guide, speaking } })),
  setGuideMessage: (message) => set((state) => ({ guide: { ...state.guide, message } })),
  setPluginMode: (active) => set(() => ({ pluginMode: active })),
  setShowPoiMarkers: (active) => set(() => ({ showPoiMarkers: active })),
  setActiveNewsstandDistrictId: (districtId) => set(() => ({ activeNewsstandDistrictId: districtId })),
  focusWorldPoint: (x, y) =>
    set((state) => {
      const target = cameraTopLeftForWorldPoint(x, y, state.camera.viewportWidth, state.camera.viewportHeight);

      return {
        camera: {
          ...state.camera,
          targetX: target.x,
          targetY: target.y,
          vx: 0,
          vy: 0
        }
      };
    }),
  focusDistrict: (districtId) =>
    set((state) => {
      const district = districts.find((entry) => entry.id === districtId);
      if (!district) {
        return state;
      }

      const target = cameraTopLeftForWorldPoint(
        district.center.x,
        district.center.y,
        state.camera.viewportWidth,
        state.camera.viewportHeight
      );

      return {
        selectedDistrictId: districtId,
        camera: {
          ...state.camera,
          targetX: target.x,
          targetY: target.y,
          vx: 0,
          vy: 0
        },
        focusRightPanelOpen: state.focusMode ? false : state.focusRightPanelOpen
      };
    }),
  focusHome: () =>
    set((state) => {
      const target = cameraTopLeftForWorldPoint(
        HOME_WORLD_POINT.x,
        HOME_WORLD_POINT.y,
        state.camera.viewportWidth,
        state.camera.viewportHeight
      );

      return {
        selectedDistrictId: "consumer-strip",
        camera: {
          ...state.camera,
          targetX: target.x,
          targetY: target.y,
          vx: 0,
          vy: 0
        },
        focusRightPanelOpen: false
      };
    }),
  clearCameraTarget: () =>
    set((state) => ({
      camera: {
        ...state.camera,
        targetX: null,
        targetY: null
      }
    })),
  clearSelection: () =>
    set((state) => ({
      selectedTickerId: null,
      selectedDistrictId: null,
      activeRightPanelTab: "evidence",
      focusRightPanelOpen: false,
      camera: {
        ...state.camera,
        targetX: null,
        targetY: null
      }
    })),
  triggerDistrictPulse: (districtId, kind, duration = 2400) =>
    set((state) => ({
      stormModeActive: true,
      selectedDistrictId: districtId,
      scenePulse: {
        districtId,
        kind,
        startedAt: Date.now(),
        expiresAt: Date.now() + duration
      },
      dock: {
        ...state.dock,
        transcriptLines: [`${kind === "rumor" ? "News Desk" : "Market Maker"} pulse triggered in ${districtId}.`, ...state.dock.transcriptLines].slice(0, 12)
      }
    })),
  clearStormMode: () =>
    set((state) => ({
      stormModeActive: false,
      scenePulse:
        state.scenePulse.expiresAt <= Date.now()
          ? {
              districtId: null,
              startedAt: 0,
              expiresAt: 0,
              kind: null
            }
          : state.scenePulse
    })),
  setZoom: (zoom) =>
    set((state) => ({
      camera: {
        ...state.camera,
        zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
      }
    })),
  zoomIn: () =>
    set((state) => ({
      camera: {
        ...state.camera,
        zoom: Math.min(MAX_ZOOM, state.camera.zoom + ZOOM_STEP)
      }
    })),
  zoomOut: () =>
    set((state) => ({
      camera: {
        ...state.camera,
        zoom: Math.max(MIN_ZOOM, state.camera.zoom - ZOOM_STEP)
      }
    })),
  addEvidence: (entry) =>
    set((state) => ({
      evidenceTimeline: [
        {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }),
          ...entry
        },
        ...state.evidenceTimeline
      ].slice(0, 16)
    }))
}));
