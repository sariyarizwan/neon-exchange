import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNeonStore } from "@/store/useNeonStore";
import { HOME_WORLD_POINT } from "@/lib/world";

// Reset Zustand store state between tests
beforeEach(() => {
  // Reset to defaults by directly setting the store state
  useNeonStore.setState({
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
    questToasts: [],
    questLog: [],
    questLogOpen: false,
    legendOverlayOpen: false,
    legendSeenOnce: false,
    portfolio: [],
    paperBalance: 100000,
    synergyBurst: { active: false, expiresAt: 0, recentTrades: [] },
    droneState: "calm",
    onboardingStep: 0,
    dock: {
      connected: true,
      micActive: false,
      transcriptLines: [],
      persona: "Market Maker",
    },
    camera: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      zoom: 1,
      viewportWidth: 1400,
      viewportHeight: 860,
      targetX: null,
      targetY: null,
    },
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      facing: "down",
      avatarId: "runner",
    },
    sound: {
      enabled: true,
      volume: 62,
      bootstrapped: false,
      needsGesture: false,
      playing: false,
      trackName: "Gemini Guide",
      mode: "guide",
    },
    guide: {
      speaking: false,
      message: null,
    },
    pluginMode: false,
    showPoiMarkers: false,
    activeNewsstandDistrictId: null,
    scenePulse: { districtId: null, startedAt: 0, expiresAt: 0, kind: null },
    evidenceTimeline: [],
    districtPopupId: null,
  });
});

// ─── SELECTION ──────────────────────────────────────────────────────────────

describe("Selection", () => {
  it("setSelectedTickerId sets tickerId and resolves districtId from mock data", () => {
    act(() => {
      useNeonStore.getState().setSelectedTickerId("nvx");
    });
    const state = useNeonStore.getState();
    expect(state.selectedTickerId).toBe("nvx");
    expect(state.selectedDistrictId).toBe("chip-docks");
    expect(state.activeRightPanelTab).toBe("scenes");
  });

  it("setSelectedTickerId with null clears ticker and sets tab to evidence", () => {
    act(() => {
      useNeonStore.getState().setSelectedTickerId("nvx");
      useNeonStore.getState().setSelectedTickerId(null);
    });
    const state = useNeonStore.getState();
    expect(state.selectedTickerId).toBeNull();
    expect(state.activeRightPanelTab).toBe("evidence");
  });

  it("setSelectedDistrictId updates districtId", () => {
    act(() => {
      useNeonStore.getState().setSelectedDistrictId("bank-towers");
    });
    expect(useNeonStore.getState().selectedDistrictId).toBe("bank-towers");
  });

  it("setSelectedDistrictId accepts null", () => {
    act(() => {
      useNeonStore.getState().setSelectedDistrictId(null);
    });
    expect(useNeonStore.getState().selectedDistrictId).toBeNull();
  });

  it("clearSelection nulls tickerId, districtId, and clears camera targets", () => {
    act(() => {
      useNeonStore.getState().setSelectedTickerId("mint");
      useNeonStore.getState().focusWorldPoint(500, 500);
      useNeonStore.getState().clearSelection();
    });
    const state = useNeonStore.getState();
    expect(state.selectedTickerId).toBeNull();
    expect(state.selectedDistrictId).toBeNull();
    expect(state.camera.targetX).toBeNull();
    expect(state.camera.targetY).toBeNull();
    expect(state.activeRightPanelTab).toBe("evidence");
    expect(state.focusRightPanelOpen).toBe(false);
  });
});

// ─── DISTRICT POPUP ──────────────────────────────────────────────────────────

describe("District popup", () => {
  it("setDistrictPopupId sets the popup id", () => {
    act(() => {
      useNeonStore.getState().setDistrictPopupId("chip-docks");
    });
    expect(useNeonStore.getState().districtPopupId).toBe("chip-docks");
  });

  it("closeDistrictPopup clears the popup id", () => {
    act(() => {
      useNeonStore.getState().setDistrictPopupId("chip-docks");
      useNeonStore.getState().closeDistrictPopup();
    });
    expect(useNeonStore.getState().districtPopupId).toBeNull();
  });
});

// ─── CAMERA ──────────────────────────────────────────────────────────────────

describe("Camera", () => {
  it("setCamera merges partial state into camera", () => {
    act(() => {
      useNeonStore.getState().setCamera({ x: 100, y: 200 });
    });
    const cam = useNeonStore.getState().camera;
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(200);
    expect(cam.zoom).toBe(1); // unchanged
  });

  it("setZoom clamps to MIN_ZOOM (0.5) from below", () => {
    act(() => {
      useNeonStore.getState().setZoom(0.1);
    });
    expect(useNeonStore.getState().camera.zoom).toBe(0.5);
  });

  it("setZoom clamps to MAX_ZOOM (2.0) from above", () => {
    act(() => {
      useNeonStore.getState().setZoom(5.0);
    });
    expect(useNeonStore.getState().camera.zoom).toBe(2.0);
  });

  it("setZoom sets exact value within bounds", () => {
    act(() => {
      useNeonStore.getState().setZoom(1.5);
    });
    expect(useNeonStore.getState().camera.zoom).toBe(1.5);
  });

  it("zoomIn increments zoom by 0.1", () => {
    act(() => {
      useNeonStore.getState().setZoom(1.0);
      useNeonStore.getState().zoomIn();
    });
    expect(useNeonStore.getState().camera.zoom).toBeCloseTo(1.1, 5);
  });

  it("zoomIn does not exceed MAX_ZOOM (2.0)", () => {
    act(() => {
      useNeonStore.getState().setZoom(2.0);
      useNeonStore.getState().zoomIn();
    });
    expect(useNeonStore.getState().camera.zoom).toBe(2.0);
  });

  it("zoomOut decrements zoom by 0.1", () => {
    act(() => {
      useNeonStore.getState().setZoom(1.0);
      useNeonStore.getState().zoomOut();
    });
    expect(useNeonStore.getState().camera.zoom).toBeCloseTo(0.9, 5);
  });

  it("zoomOut does not go below MIN_ZOOM (0.5)", () => {
    act(() => {
      useNeonStore.getState().setZoom(0.5);
      useNeonStore.getState().zoomOut();
    });
    expect(useNeonStore.getState().camera.zoom).toBe(0.5);
  });

  it("setViewport updates viewportWidth and viewportHeight", () => {
    act(() => {
      useNeonStore.getState().setViewport(1920, 1080);
    });
    const cam = useNeonStore.getState().camera;
    expect(cam.viewportWidth).toBe(1920);
    expect(cam.viewportHeight).toBe(1080);
  });
});

// ─── NAVIGATION / FOCUS ──────────────────────────────────────────────────────

describe("Navigation", () => {
  it("focusWorldPoint sets targetX/Y based on viewport centering", () => {
    act(() => {
      useNeonStore.getState().setViewport(1400, 860);
      useNeonStore.getState().focusWorldPoint(1000, 800);
    });
    const cam = useNeonStore.getState().camera;
    // cameraTopLeftForWorldPoint(1000, 800, 1400, 860)
    // = clampCameraPosition(1000-700, 800-430, 1400, 860) = clamp(300, 370, ...)
    expect(cam.targetX).toBe(300);
    expect(cam.targetY).toBe(370);
    expect(cam.vx).toBe(0);
    expect(cam.vy).toBe(0);
  });

  it("focusDistrict sets selectedDistrictId and targetX/Y for known district", () => {
    // consumer-strip center is { x: 1760, y: 1450 }
    act(() => {
      useNeonStore.getState().setViewport(1400, 860);
      useNeonStore.getState().focusDistrict("consumer-strip");
    });
    const state = useNeonStore.getState();
    expect(state.selectedDistrictId).toBe("consumer-strip");
    expect(state.camera.targetX).not.toBeNull();
    expect(state.camera.targetY).not.toBeNull();
  });

  it("focusDistrict leaves state unchanged for unknown districtId", () => {
    const before = useNeonStore.getState().selectedDistrictId;
    act(() => {
      useNeonStore.getState().focusDistrict("does-not-exist");
    });
    expect(useNeonStore.getState().selectedDistrictId).toBe(before);
  });

  it("focusHome resets selectedDistrictId to consumer-strip", () => {
    act(() => {
      useNeonStore.getState().setSelectedDistrictId("chip-docks");
      useNeonStore.getState().focusHome();
    });
    expect(useNeonStore.getState().selectedDistrictId).toBe("consumer-strip");
  });

  it("focusHome sets targetX/Y to HOME_WORLD_POINT centered position", () => {
    act(() => {
      useNeonStore.getState().setViewport(1400, 860);
      useNeonStore.getState().focusHome();
    });
    const cam = useNeonStore.getState().camera;
    // HOME_WORLD_POINT = { x: 1760, y: 1450 }
    // topLeft = clampCameraPosition(1760-700, 1450-430, 1400, 860) = (1060, 1020)
    expect(cam.targetX).toBe(1060);
    expect(cam.targetY).toBe(1020);
  });

  it("clearCameraTarget nulls targetX and targetY", () => {
    act(() => {
      useNeonStore.getState().focusWorldPoint(500, 500);
      useNeonStore.getState().clearCameraTarget();
    });
    const cam = useNeonStore.getState().camera;
    expect(cam.targetX).toBeNull();
    expect(cam.targetY).toBeNull();
  });
});

// ─── PLAYER ──────────────────────────────────────────────────────────────────

describe("Player", () => {
  it("setPlayerPosition updates x and y", () => {
    act(() => {
      useNeonStore.getState().setPlayerPosition(300, 400);
    });
    const player = useNeonStore.getState().player;
    expect(player.x).toBe(300);
    expect(player.y).toBe(400);
  });

  it("setPlayerPosition preserves other player fields", () => {
    act(() => {
      useNeonStore.getState().setPlayerFacing("up");
      useNeonStore.getState().setPlayerPosition(100, 200);
    });
    expect(useNeonStore.getState().player.facing).toBe("up");
  });

  it("setPlayerFacing sets facing to up", () => {
    act(() => {
      useNeonStore.getState().setPlayerFacing("up");
    });
    expect(useNeonStore.getState().player.facing).toBe("up");
  });

  it("setPlayerFacing sets facing to down", () => {
    act(() => {
      useNeonStore.getState().setPlayerFacing("down");
    });
    expect(useNeonStore.getState().player.facing).toBe("down");
  });

  it("setPlayerFacing sets facing to left", () => {
    act(() => {
      useNeonStore.getState().setPlayerFacing("left");
    });
    expect(useNeonStore.getState().player.facing).toBe("left");
  });

  it("setPlayerFacing sets facing to right", () => {
    act(() => {
      useNeonStore.getState().setPlayerFacing("right");
    });
    expect(useNeonStore.getState().player.facing).toBe("right");
  });

  it("setAvatarId updates the avatar", () => {
    act(() => {
      useNeonStore.getState().setAvatarId("ghost");
    });
    expect(useNeonStore.getState().player.avatarId).toBe("ghost");
  });
});

// ─── MIC / SOUND ─────────────────────────────────────────────────────────────

describe("Mic and Sound", () => {
  it("toggleMic flips micActive from false to true", () => {
    act(() => {
      useNeonStore.getState().toggleMic();
    });
    expect(useNeonStore.getState().dock.micActive).toBe(true);
  });

  it("toggleMic flips micActive from true to false", () => {
    act(() => {
      useNeonStore.getState().toggleMic();
      useNeonStore.getState().toggleMic();
    });
    expect(useNeonStore.getState().dock.micActive).toBe(false);
  });

  it("interruptMic sets micActive to false", () => {
    act(() => {
      useNeonStore.getState().toggleMic();
      useNeonStore.getState().interruptMic();
    });
    expect(useNeonStore.getState().dock.micActive).toBe(false);
  });

  it("interruptMic appends an interrupt message to transcript", () => {
    act(() => {
      useNeonStore.getState().toggleMic();
      useNeonStore.getState().interruptMic();
    });
    const lines = useNeonStore.getState().dock.transcriptLines;
    expect(lines[0]).toContain("Interrupt received");
  });

  it("setSoundEnabled sets enabled to false and clears needsGesture", () => {
    act(() => {
      useNeonStore.setState((s) => ({ sound: { ...s.sound, needsGesture: true } }));
      useNeonStore.getState().setSoundEnabled(false);
    });
    const sound = useNeonStore.getState().sound;
    expect(sound.enabled).toBe(false);
    expect(sound.needsGesture).toBe(false);
  });

  it("setSoundEnabled to true preserves existing needsGesture", () => {
    act(() => {
      useNeonStore.setState((s) => ({ sound: { ...s.sound, needsGesture: true, enabled: false } }));
      useNeonStore.getState().setSoundEnabled(true);
    });
    // When enabling, needsGesture keeps its value
    expect(useNeonStore.getState().sound.enabled).toBe(true);
    expect(useNeonStore.getState().sound.needsGesture).toBe(true);
  });

  it("setSoundVolume sets the volume value", () => {
    act(() => {
      useNeonStore.getState().setSoundVolume(80);
    });
    expect(useNeonStore.getState().sound.volume).toBe(80);
  });
});

// ─── ONBOARDING ──────────────────────────────────────────────────────────────

describe("Onboarding", () => {
  it("starts at step 0", () => {
    expect(useNeonStore.getState().onboardingStep).toBe(0);
  });

  it("advanceOnboarding increments from 0 to 1", () => {
    act(() => {
      useNeonStore.getState().advanceOnboarding();
    });
    expect(useNeonStore.getState().onboardingStep).toBe(1);
  });

  it("advanceOnboarding increments through 0→1→2→3→4", () => {
    act(() => {
      useNeonStore.getState().advanceOnboarding();
      useNeonStore.getState().advanceOnboarding();
      useNeonStore.getState().advanceOnboarding();
      useNeonStore.getState().advanceOnboarding();
    });
    expect(useNeonStore.getState().onboardingStep).toBe(4);
  });

  it("advanceOnboarding caps at 4 and does not exceed it", () => {
    act(() => {
      for (let i = 0; i < 10; i++) {
        useNeonStore.getState().advanceOnboarding();
      }
    });
    expect(useNeonStore.getState().onboardingStep).toBe(4);
  });
});

// ─── EVIDENCE ────────────────────────────────────────────────────────────────

describe("Evidence timeline", () => {
  it("addEvidence appends an item with generated id and timestamp", () => {
    act(() => {
      useNeonStore.getState().addEvidence({ text: "NVDA spiked", districtId: "chip-docks" });
    });
    const items = useNeonStore.getState().evidenceTimeline;
    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("NVDA spiked");
    expect(items[0].id).toMatch(/^ev-/);
    expect(items[0].timestamp).toBeTruthy();
  });

  it("addEvidence prepends so newest item is at index 0", () => {
    act(() => {
      useNeonStore.getState().addEvidence({ text: "first" });
      useNeonStore.getState().addEvidence({ text: "second" });
    });
    expect(useNeonStore.getState().evidenceTimeline[0].text).toBe("second");
  });

  it("addEvidence caps at 16 items with FIFO eviction", () => {
    act(() => {
      for (let i = 0; i < 20; i++) {
        useNeonStore.getState().addEvidence({ text: `item-${i}` });
      }
    });
    const items = useNeonStore.getState().evidenceTimeline;
    expect(items).toHaveLength(16);
    // Oldest entries should be evicted; newest (item-19) should be at front
    expect(items[0].text).toBe("item-19");
  });
});

// ─── QUEST TOASTS ────────────────────────────────────────────────────────────

describe("Quest toasts", () => {
  it("addQuestToast adds a toast entry with text and type", () => {
    act(() => {
      useNeonStore.getState().addQuestToast("New intel available", "info", "chip-docks");
    });
    const toasts = useNeonStore.getState().questToasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].text).toBe("New intel available");
    expect(toasts[0].type).toBe("info");
  });

  it("addQuestToast also logs to questLog with active=true", () => {
    act(() => {
      useNeonStore.getState().addQuestToast("Quest started", "quest", "bank-towers");
    });
    const log = useNeonStore.getState().questLog;
    expect(log).toHaveLength(1);
    expect(log[0].active).toBe(true);
    expect(log[0].districtId).toBe("bank-towers");
  });

  it("dismissQuestToast removes the toast by id", () => {
    act(() => {
      useNeonStore.getState().addQuestToast("Remove me", "info");
    });
    const id = useNeonStore.getState().questToasts[0].id;
    act(() => {
      useNeonStore.getState().dismissQuestToast(id);
    });
    expect(useNeonStore.getState().questToasts).toHaveLength(0);
  });

  it("dismissQuestToast with unknown id leaves toasts unchanged", () => {
    act(() => {
      useNeonStore.getState().addQuestToast("Stay", "info");
    });
    act(() => {
      useNeonStore.getState().dismissQuestToast("non-existent-id");
    });
    expect(useNeonStore.getState().questToasts).toHaveLength(1);
  });

  it("toggleQuestLog flips questLogOpen", () => {
    expect(useNeonStore.getState().questLogOpen).toBe(false);
    act(() => {
      useNeonStore.getState().toggleQuestLog();
    });
    expect(useNeonStore.getState().questLogOpen).toBe(true);
    act(() => {
      useNeonStore.getState().toggleQuestLog();
    });
    expect(useNeonStore.getState().questLogOpen).toBe(false);
  });

  it("markQuestInactive sets active=false for the matching entry", () => {
    act(() => {
      useNeonStore.getState().addQuestToast("Mark me done", "quest");
    });
    const id = useNeonStore.getState().questLog[0].id;
    act(() => {
      useNeonStore.getState().markQuestInactive(id);
    });
    const entry = useNeonStore.getState().questLog.find((e) => e.id === id);
    expect(entry!.active).toBe(false);
  });
});

// ─── TRADING ─────────────────────────────────────────────────────────────────

describe("Trading", () => {
  it("acquireUplink deducts cost from paperBalance", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 5);
    });
    // cost = 100 * 5 = 500; 100000 - 500 = 99500
    expect(useNeonStore.getState().paperBalance).toBe(99500);
  });

  it("acquireUplink adds a new position to portfolio", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 5);
    });
    const positions = useNeonStore.getState().portfolio;
    expect(positions).toHaveLength(1);
    expect(positions[0].tickerId).toBe("nvx");
    expect(positions[0].shares).toBe(5);
    expect(positions[0].avgPrice).toBe(100);
  });

  it("acquireUplink adds shares to an existing position and recalculates avgPrice", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 10);
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 200, 10);
    });
    const pos = useNeonStore.getState().portfolio.find((p) => p.tickerId === "nvx")!;
    expect(pos.shares).toBe(20);
    // avgPrice = (100*10 + 200*10) / 20 = 150
    expect(pos.avgPrice).toBe(150);
  });

  it("acquireUplink rejects trade when cost exceeds paperBalance", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 200000, 1);
    });
    expect(useNeonStore.getState().portfolio).toHaveLength(0);
    expect(useNeonStore.getState().paperBalance).toBe(100000);
  });

  it("extractPosition adds proceeds to paperBalance", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 10);
      useNeonStore.getState().extractPosition("nvx", 150, 5);
    });
    // After buy: balance = 99000; after sell 5 at 150: 99000 + 750 = 99750
    expect(useNeonStore.getState().paperBalance).toBe(99750);
  });

  it("extractPosition removes position entirely when all shares sold", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 5);
      useNeonStore.getState().extractPosition("nvx", 110, 5);
    });
    expect(useNeonStore.getState().portfolio).toHaveLength(0);
  });

  it("extractPosition reduces shares when partially sold", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 10);
      useNeonStore.getState().extractPosition("nvx", 110, 4);
    });
    const pos = useNeonStore.getState().portfolio.find((p) => p.tickerId === "nvx")!;
    expect(pos.shares).toBe(6);
  });

  it("extractPosition rejects sell when position does not exist", () => {
    const balanceBefore = useNeonStore.getState().paperBalance;
    act(() => {
      useNeonStore.getState().extractPosition("nvx", 100, 5);
    });
    expect(useNeonStore.getState().paperBalance).toBe(balanceBefore);
  });

  it("extractPosition rejects sell when shares exceed holding", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 100, 5);
    });
    const balanceBefore = useNeonStore.getState().paperBalance;
    act(() => {
      useNeonStore.getState().extractPosition("nvx", 100, 10);
    });
    expect(useNeonStore.getState().paperBalance).toBe(balanceBefore);
    expect(useNeonStore.getState().portfolio[0].shares).toBe(5);
  });

  it("synergyBurst fires when 3+ unique tickers are traded within 60s", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 10, 1);
      useNeonStore.getState().acquireUplink("mint", "MINT", "bank-towers", 10, 1);
      useNeonStore.getState().acquireUplink("flux", "FLUX", "energy-yard", 10, 1);
    });
    expect(useNeonStore.getState().synergyBurst.active).toBe(true);
  });

  it("synergyBurst does not fire with only 2 unique tickers", () => {
    act(() => {
      useNeonStore.getState().acquireUplink("nvx", "NVX", "chip-docks", 10, 1);
      useNeonStore.getState().acquireUplink("mint", "MINT", "bank-towers", 10, 1);
    });
    expect(useNeonStore.getState().synergyBurst.active).toBe(false);
  });
});

// ─── IMMUTABILITY ─────────────────────────────────────────────────────────────

describe("Immutability", () => {
  it("setPlayerPosition returns a new player object reference", () => {
    const playerBefore = useNeonStore.getState().player;
    act(() => {
      useNeonStore.getState().setPlayerPosition(999, 999);
    });
    const playerAfter = useNeonStore.getState().player;
    expect(playerAfter).not.toBe(playerBefore);
  });

  it("setCamera returns a new camera object reference", () => {
    const cameraBefore = useNeonStore.getState().camera;
    act(() => {
      useNeonStore.getState().setCamera({ x: 500 });
    });
    const cameraAfter = useNeonStore.getState().camera;
    expect(cameraAfter).not.toBe(cameraBefore);
  });

  it("addEvidence returns a new evidenceTimeline array reference", () => {
    const before = useNeonStore.getState().evidenceTimeline;
    act(() => {
      useNeonStore.getState().addEvidence({ text: "new item" });
    });
    const after = useNeonStore.getState().evidenceTimeline;
    expect(after).not.toBe(before);
  });
});

// ─── RENDEROOK INTEGRATION ───────────────────────────────────────────────────

describe("renderHook integration", () => {
  it("exposes setSelectedTickerId via hook and reflects updated state", () => {
    const { result } = renderHook(() => useNeonStore());
    act(() => {
      result.current.setSelectedTickerId("vault");
    });
    expect(result.current.selectedTickerId).toBe("vault");
    expect(result.current.selectedDistrictId).toBe("bank-towers");
  });

  it("exposes advanceOnboarding via hook", () => {
    const { result } = renderHook(() => useNeonStore());
    act(() => {
      result.current.advanceOnboarding();
      result.current.advanceOnboarding();
    });
    expect(result.current.onboardingStep).toBe(2);
  });
});

// ─── FOCUS MODE ──────────────────────────────────────────────────────────────

describe("Focus mode", () => {
  it("toggleFocusMode flips focusMode from false to true", () => {
    act(() => {
      useNeonStore.getState().toggleFocusMode();
    });
    expect(useNeonStore.getState().focusMode).toBe(true);
  });

  it("toggleFocusMode flips focusMode from true to false and clears focusRightPanelOpen", () => {
    act(() => {
      useNeonStore.setState({ focusMode: true, focusRightPanelOpen: true });
      useNeonStore.getState().toggleFocusMode();
    });
    const state = useNeonStore.getState();
    expect(state.focusMode).toBe(false);
    expect(state.focusRightPanelOpen).toBe(false);
  });

  it("setFocusRightPanelOpen sets the open flag", () => {
    act(() => {
      useNeonStore.getState().setFocusRightPanelOpen(true);
    });
    expect(useNeonStore.getState().focusRightPanelOpen).toBe(true);
  });
});

// ─── FILTER TOGGLES ──────────────────────────────────────────────────────────

describe("Filter toggles", () => {
  it("setFilterToggle sets showAlliances to true", () => {
    act(() => {
      useNeonStore.getState().setFilterToggle("showAlliances", true);
    });
    expect(useNeonStore.getState().showAlliances).toBe(true);
  });

  it("setFilterToggle sets showStorms to false", () => {
    act(() => {
      useNeonStore.getState().setFilterToggle("showStorms", false);
    });
    expect(useNeonStore.getState().showStorms).toBe(false);
  });

  it("setFilterToggle sets showRumors to false", () => {
    act(() => {
      useNeonStore.getState().setFilterToggle("showRumors", false);
    });
    expect(useNeonStore.getState().showRumors).toBe(false);
  });
});

// ─── PERSONA AND TRANSCRIPT ───────────────────────────────────────────────────

describe("Persona and transcript", () => {
  it("setPersona changes persona and prepends a switch message to transcript", () => {
    act(() => {
      useNeonStore.getState().setPersona("Whale");
    });
    const dock = useNeonStore.getState().dock;
    expect(dock.persona).toBe("Whale");
    expect(dock.transcriptLines[0]).toContain("Whale");
  });

  it("appendTranscriptLine prepends a line and caps at 12", () => {
    act(() => {
      for (let i = 0; i < 15; i++) {
        useNeonStore.getState().appendTranscriptLine(`line-${i}`);
      }
    });
    const lines = useNeonStore.getState().dock.transcriptLines;
    expect(lines).toHaveLength(12);
    expect(lines[0]).toBe("line-14");
  });
});

// ─── WORLD MOTION ─────────────────────────────────────────────────────────────

describe("World motion", () => {
  it("markWorldMotion sets overlaysDimmed to true", () => {
    act(() => {
      useNeonStore.getState().markWorldMotion();
    });
    expect(useNeonStore.getState().overlaysDimmed).toBe(true);
  });
});

// ─── VIEWPORT WITH EXISTING TARGET ───────────────────────────────────────────

describe("setViewport with camera target", () => {
  it("recalculates clamped target when a camera target is set", () => {
    act(() => {
      useNeonStore.getState().focusWorldPoint(1000, 800);
      useNeonStore.getState().setViewport(1400, 860);
    });
    const cam = useNeonStore.getState().camera;
    expect(cam.targetX).not.toBeNull();
    expect(cam.targetY).not.toBeNull();
  });

  it("preserves null targets when no camera target was set", () => {
    act(() => {
      useNeonStore.getState().setViewport(1920, 1080);
    });
    const cam = useNeonStore.getState().camera;
    expect(cam.targetX).toBeNull();
    expect(cam.targetY).toBeNull();
  });
});

// ─── PLAYER PARTIAL UPDATE ────────────────────────────────────────────────────

describe("Player partial update", () => {
  it("setPlayer merges partial state without clobbering other fields", () => {
    act(() => {
      useNeonStore.getState().setPlayer({ x: 777, y: 888 });
    });
    const player = useNeonStore.getState().player;
    expect(player.x).toBe(777);
    expect(player.y).toBe(888);
    expect(player.facing).toBe("down"); // preserved
  });
});

// ─── SOUND EXTENDED ──────────────────────────────────────────────────────────

describe("Sound extended", () => {
  it("setSoundMode changes mode and updates trackName", () => {
    act(() => {
      useNeonStore.getState().setSoundMode("music");
    });
    const sound = useNeonStore.getState().sound;
    expect(sound.mode).toBe("music");
    expect(sound.trackName).toBe("neon-rain.wav");
  });

  it("setSoundMode to guide sets trackName to Gemini Guide", () => {
    act(() => {
      useNeonStore.getState().setSoundMode("guide");
    });
    expect(useNeonStore.getState().sound.trackName).toBe("Gemini Guide");
  });

  it("setAudioBootstrapped sets bootstrapped flag", () => {
    act(() => {
      useNeonStore.getState().setAudioBootstrapped(true);
    });
    expect(useNeonStore.getState().sound.bootstrapped).toBe(true);
  });

  it("setAudioNeedsGesture sets needsGesture flag", () => {
    act(() => {
      useNeonStore.getState().setAudioNeedsGesture(true);
    });
    expect(useNeonStore.getState().sound.needsGesture).toBe(true);
  });

  it("setAudioPlaying sets playing flag to true", () => {
    act(() => {
      useNeonStore.getState().setAudioPlaying(true);
    });
    expect(useNeonStore.getState().sound.playing).toBe(true);
  });
});

// ─── GUIDE STATE ─────────────────────────────────────────────────────────────

describe("Guide state", () => {
  it("setGuideSpeaking sets the speaking flag", () => {
    act(() => {
      useNeonStore.getState().setGuideSpeaking(true);
    });
    expect(useNeonStore.getState().guide.speaking).toBe(true);
  });

  it("setGuideMessage sets the guide message", () => {
    act(() => {
      useNeonStore.getState().setGuideMessage("Hello trader");
    });
    expect(useNeonStore.getState().guide.message).toBe("Hello trader");
  });

  it("setGuideMessage accepts null to clear the message", () => {
    act(() => {
      useNeonStore.getState().setGuideMessage(null);
    });
    expect(useNeonStore.getState().guide.message).toBeNull();
  });
});

// ─── MISC FLAGS ───────────────────────────────────────────────────────────────

describe("Misc flags", () => {
  it("setPluginMode sets pluginMode active", () => {
    act(() => {
      useNeonStore.getState().setPluginMode(true);
    });
    expect(useNeonStore.getState().pluginMode).toBe(true);
  });

  it("setShowPoiMarkers sets showPoiMarkers active", () => {
    act(() => {
      useNeonStore.getState().setShowPoiMarkers(true);
    });
    expect(useNeonStore.getState().showPoiMarkers).toBe(true);
  });

  it("setActiveNewsstandDistrictId sets the active newsstand district", () => {
    act(() => {
      useNeonStore.getState().setActiveNewsstandDistrictId("chip-docks");
    });
    expect(useNeonStore.getState().activeNewsstandDistrictId).toBe("chip-docks");
  });

  it("setDroneState changes drone state to alert", () => {
    act(() => {
      useNeonStore.getState().setDroneState("alert");
    });
    expect(useNeonStore.getState().droneState).toBe("alert");
  });

  it("setDroneState changes drone state to glitch", () => {
    act(() => {
      useNeonStore.getState().setDroneState("glitch");
    });
    expect(useNeonStore.getState().droneState).toBe("glitch");
  });
});

// ─── STORM MODE AND PULSE ─────────────────────────────────────────────────────

describe("Storm mode and scene pulse", () => {
  it("triggerDistrictPulse activates storm mode and sets scenePulse", () => {
    act(() => {
      useNeonStore.getState().triggerDistrictPulse("chip-docks", "scene");
    });
    const state = useNeonStore.getState();
    expect(state.stormModeActive).toBe(true);
    expect(state.selectedDistrictId).toBe("chip-docks");
    expect(state.scenePulse.districtId).toBe("chip-docks");
    expect(state.scenePulse.kind).toBe("scene");
    expect(state.scenePulse.expiresAt).toBeGreaterThan(Date.now());
  });

  it("triggerDistrictPulse with kind=rumor adds News Desk transcript line", () => {
    act(() => {
      useNeonStore.getState().triggerDistrictPulse("bank-towers", "rumor");
    });
    const lines = useNeonStore.getState().dock.transcriptLines;
    expect(lines[0]).toContain("News Desk");
  });

  it("triggerDistrictPulse with kind=scene adds Market Maker transcript line", () => {
    act(() => {
      useNeonStore.getState().triggerDistrictPulse("bank-towers", "scene");
    });
    const lines = useNeonStore.getState().dock.transcriptLines;
    expect(lines[0]).toContain("Market Maker");
  });

  it("clearStormMode deactivates stormModeActive", () => {
    act(() => {
      useNeonStore.getState().triggerDistrictPulse("chip-docks", "scene");
      useNeonStore.getState().clearStormMode();
    });
    expect(useNeonStore.getState().stormModeActive).toBe(false);
  });
});

// ─── LEGEND OVERLAY ───────────────────────────────────────────────────────────

describe("Legend overlay", () => {
  it("toggleLegendOverlay flips legendOverlayOpen from false to true", () => {
    act(() => {
      useNeonStore.getState().toggleLegendOverlay();
    });
    expect(useNeonStore.getState().legendOverlayOpen).toBe(true);
  });

  it("toggleLegendOverlay flips legendOverlayOpen back to false", () => {
    act(() => {
      useNeonStore.getState().toggleLegendOverlay();
      useNeonStore.getState().toggleLegendOverlay();
    });
    expect(useNeonStore.getState().legendOverlayOpen).toBe(false);
  });

  it("setLegendSeenOnce sets legendSeenOnce to true", () => {
    act(() => {
      useNeonStore.getState().setLegendSeenOnce();
    });
    expect(useNeonStore.getState().legendSeenOnce).toBe(true);
  });
});

// ─── ACTIVE RIGHT PANEL TAB ───────────────────────────────────────────────────

describe("Right panel tab", () => {
  it("setActiveRightPanelTab changes the active tab to alliances", () => {
    act(() => {
      useNeonStore.getState().setActiveRightPanelTab("alliances");
    });
    expect(useNeonStore.getState().activeRightPanelTab).toBe("alliances");
  });

  it("setActiveRightPanelTab changes the active tab to evidence", () => {
    act(() => {
      useNeonStore.getState().setActiveRightPanelTab("evidence");
    });
    expect(useNeonStore.getState().activeRightPanelTab).toBe("evidence");
  });
});

// ─── FOCUS DISTRICT WITH FOCUS MODE ──────────────────────────────────────────

describe("focusDistrict with focusMode", () => {
  it("focusDistrict with focusMode=true does not set focusRightPanelOpen", () => {
    act(() => {
      useNeonStore.setState({ focusMode: true, focusRightPanelOpen: true });
      useNeonStore.getState().focusDistrict("consumer-strip");
    });
    // When focusMode is true the expression is: state.focusMode ? false : state.focusRightPanelOpen
    expect(useNeonStore.getState().focusRightPanelOpen).toBe(false);
  });
});
