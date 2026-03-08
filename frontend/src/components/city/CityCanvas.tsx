"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { districtThemes } from "@/mock/cityThemes";
import {
  avatarOptions,
  citizens,
  cityProps,
  districtStructures,
  districtSurfaces,
  districtZones,
  newsstands,
  pointsOfInterest,
  stockNpcProfiles,
  stockOutboundUrls,
  worldColliders
} from "@/mock/cityWorld";
import { districtConnections, districts } from "@/mock/districts";
import { districtNewsBoards, tickerNews } from "@/mock/news";
import { tickers } from "@/mock/tickers";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";
import type { District } from "@/types/district";
import type { Ticker } from "@/types/ticker";
import type { DistrictZone, NewsstandData, WorldProp, WorldStructure, WorldSurface } from "@/types/world";
import { hitTestDistrict, screenToWorld } from "./useHitTesting";
import { useCameraControls } from "./useCameraControls";

type HoverEntity =
  | { kind: "ticker"; ticker: Ticker; district: District; x: number; y: number }
  | { kind: "prop"; prop: WorldProp; district: District; x: number; y: number }
  | { kind: "newsstand"; stand: NewsstandData; district: District; x: number; y: number }
  | null;

type PluginPrompt = {
  ticker: Ticker;
  x: number;
  y: number;
};

type InteractionBubble = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type SelectedMarker = {
  id: string;
  kind: "ticker" | "prop" | "newsstand";
  x: number;
  y: number;
  label: string;
  color: string;
};

type WorldNewsBubble = {
  id: string;
  kind: "ticker" | "newsstand" | "prop";
  anchorX: number;
  anchorY: number;
  title: string;
  lines: Array<{ id: string; text: string; source?: string }>;
};

type RainDrop = {
  xSeed: number;
  ySeed: number;
  speed: number;
  opacity: number;
  length: number;
};

type DustParticle = {
  xSeed: number;
  ySeed: number;
  speed: number;
  size: number;
  alpha: number;
};

type NpcRuntime = {
  id: string;
  type: "citizen" | "stock";
  districtId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  speed: number;
  patrolRadius: number;
  facing: "up" | "down" | "left" | "right";
  bobSeed: number;
  nextDecisionAt: number;
  speechUntil: number;
  speechText: string | null;
  dialogues: string[];
  color: string;
  style: "walker" | "vendor" | "broker" | "runner";
  tickerId?: string;
};

const npcCollidesAt = (nx: number, ny: number): boolean => {
  const box = { x: nx - 8, y: ny - 12, width: 16, height: 20 };
  return worldColliders.some(
    (c) =>
      box.x < c.x + c.width &&
      box.x + box.width > c.x &&
      box.y < c.y + c.height &&
      box.y + box.height > c.y
  );
};

const TILE = 32;

const zoneShadeByVariant: Record<
  DistrictZone["tileVariant"],
  { floor: string; line: string; neon: string; shop: string; puddle: string; hazard: string }
> = {
  tech: { floor: "#111B2E", line: "#1B3352", neon: "#33F5FF", shop: "#0B2442", puddle: "#10253E", hazard: "#2D5D7B" },
  finance: { floor: "#161A27", line: "#2B3349", neon: "#FFB84D", shop: "#221A12", puddle: "#202634", hazard: "#6B5A2F" },
  energy: { floor: "#121A18", line: "#243B31", neon: "#B7FF3C", shop: "#162417", puddle: "#18261F", hazard: "#6A8618" },
  industrial: { floor: "#17161D", line: "#31293C", neon: "#FF875C", shop: "#261913", puddle: "#231F2A", hazard: "#A34E31" },
  consumer: { floor: "#15162A", line: "#2E3155", neon: "#FF3DF2", shop: "#231335", puddle: "#241C38", hazard: "#9540B6" },
  crypto: { floor: "#0F1B28", line: "#1F3A47", neon: "#33F5FF", shop: "#13293A", puddle: "#123041", hazard: "#2C7488" },
  bio: { floor: "#12201D", line: "#274A40", neon: "#7DFFB7", shop: "#123127", puddle: "#15302A", hazard: "#468563" },
  comms: { floor: "#111626", line: "#2A3155", neon: "#FF69E7", shop: "#231538", puddle: "#211D3B", hazard: "#7A3D9D" }
};

const trendIcon: Record<Ticker["trend"], string> = {
  up: "▲",
  down: "▼",
  flat: "◆"
};

const pixel = (value: number) => Math.round(value);

const hexToRgba = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  const normalized = value.length === 3 ? value.split("").map((char) => `${char}${char}`).join("") : value;
  const numeric = Number.parseInt(normalized, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, fill: string) => {
  ctx.fillStyle = fill;
  ctx.fillRect(pixel(x), pixel(y), pixel(width), pixel(height));
};

const drawPixelFrame = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(pixel(x) + 1, pixel(y) + 1, pixel(width) - 2, pixel(height) - 2);
};

const drawRing = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, pulse = 0) => {
  const ringWidth = 26 + pulse * 2;
  const ringHeight = 10 + pulse;
  ctx.strokeStyle = hexToRgba(color, 0.72);
  ctx.lineWidth = 2;
  ctx.strokeRect(pixel(x - ringWidth / 2), pixel(y - ringHeight / 2), pixel(ringWidth), pixel(ringHeight));
  ctx.strokeStyle = hexToRgba(color, 0.3);
  ctx.strokeRect(pixel(x - ringWidth / 2 - 3), pixel(y - ringHeight / 2 - 2), pixel(ringWidth + 6), pixel(ringHeight + 4));
};

const drawLightPool = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) => {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, hexToRgba(color, alpha));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
};

const drawFacadeBlock = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
  base = "#0D1320"
) => {
  drawPixelRect(ctx, x, y, width, height, base);
  drawPixelRect(ctx, x + 4, y + 4, width - 8, 10, hexToRgba(accent, 0.14));
  drawPixelRect(ctx, x + 6, y + height - 8, width - 12, 3, "#05070C");
  for (let row = 0; row < height - 24; row += 14) {
    for (let col = 0; col < width - 16; col += 14) {
      drawPixelRect(ctx, x + 8 + col, y + 18 + row, 7, 7, row % 28 === 0 ? "#D7EEFF" : "#7D96B3");
    }
  }
};

const drawPlazaCore = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  accent: string,
  time: number
) => {
  drawPixelRect(ctx, x, y, size, size, "#0E1420");
  drawPixelFrame(ctx, x, y, size, size, hexToRgba(accent, 0.42));
  drawPixelRect(ctx, x + 8, y + 8, size - 16, size - 16, "#101A28");

  for (let tileY = 0; tileY < size - 32; tileY += 16) {
    for (let tileX = 0; tileX < size - 32; tileX += 16) {
      const odd = ((tileX + tileY) / 16) % 2 === 0;
      drawPixelRect(ctx, x + 16 + tileX, y + 16 + tileY, 14, 14, odd ? "#142132" : "#17283C");
      if ((tileX + tileY) % 48 === 0) {
        drawPixelRect(ctx, x + 20 + tileX, y + 22 + tileY, 6, 2, hexToRgba(accent, 0.28));
      }
    }
  }

  const pulse = 0.18 + Math.sin(time / 220) * 0.08;
  const center = x + size / 2;
  drawPixelRect(ctx, center - 40, y + size / 2 - 6, 80, 12, hexToRgba(accent, pulse + 0.12));
  drawPixelRect(ctx, center - 6, y + size / 2 - 40, 12, 80, hexToRgba(accent, pulse + 0.12));
  drawPixelRect(ctx, center - 22, y + size / 2 - 22, 44, 44, "#09111C");
  drawPixelFrame(ctx, center - 22, y + size / 2 - 22, 44, 44, hexToRgba(accent, 0.48));
  drawPixelRect(ctx, center - 8, y + size / 2 - 8, 16, 16, "#E8FBFF");

  drawPixelRect(ctx, x + size / 2 - 54, y + 12, 108, 6, hexToRgba(accent, 0.14));
};

const drawCornerDressing = (
  ctx: CanvasRenderingContext2D,
  tileVariant: DistrictZone["tileVariant"],
  x: number,
  y: number,
  width: number,
  height: number,
  accent: string,
  time: number
) => {
  const corners = [
    [x + 18, y + 18],
    [x + width - 116, y + 18],
    [x + 18, y + height - 104],
    [x + width - 116, y + height - 104]
  ];

  corners.forEach(([cornerX, cornerY], index) => {
    drawPixelRect(ctx, cornerX, cornerY, 98, 86, "#0A101A");
    drawPixelFrame(ctx, cornerX, cornerY, 98, 86, hexToRgba(accent, 0.18));
    drawPixelRect(ctx, cornerX + 8, cornerY + 8, 82, 10, hexToRgba(accent, 0.14 + (index % 2) * 0.06));

    switch (tileVariant) {
      case "tech":
        drawPixelRect(ctx, cornerX + 14, cornerY + 26, 22, 44, "#111A2C");
        drawPixelRect(ctx, cornerX + 42, cornerY + 20, 18, 50, "#121F34");
        drawPixelRect(ctx, cornerX + 66, cornerY + 30, 14, 36, "#101A28");
        drawPixelRect(ctx, cornerX + 20, cornerY + 34, 10, 4, hexToRgba(accent, 0.4));
        drawPixelRect(ctx, cornerX + 48, cornerY + 28, 6, 24, "#D8F7FF");
        break;
      case "finance":
        drawPixelRect(ctx, cornerX + 16, cornerY + 24, 18, 48, "#161C2D");
        drawPixelRect(ctx, cornerX + 40, cornerY + 16, 20, 56, "#181F31");
        drawPixelRect(ctx, cornerX + 66, cornerY + 26, 14, 42, "#131828");
        drawPixelRect(ctx, cornerX + 14, cornerY + 74, 68, 4, hexToRgba("#F6D780", 0.32));
        break;
      case "energy":
        drawPixelRect(ctx, cornerX + 18, cornerY + 24, 58, 14, "#161E1E");
        drawPixelRect(ctx, cornerX + 24, cornerY + 42, 10, 22, hexToRgba(accent, 0.4));
        drawPixelRect(ctx, cornerX + 42, cornerY + 34, 20, 28, "#0E1615");
        drawPixelRect(ctx, cornerX + 18, cornerY + 68, 58, 4, hexToRgba("#B7FF3C", 0.26));
        break;
      case "industrial":
        drawPixelRect(ctx, cornerX + 16, cornerY + 30, 22, 20, "#2A2325");
        drawPixelRect(ctx, cornerX + 42, cornerY + 22, 18, 28, "#31272D");
        drawPixelRect(ctx, cornerX + 64, cornerY + 34, 16, 18, "#382A24");
        drawPixelRect(ctx, cornerX + 18, cornerY + 56, 60, 6, hexToRgba("#FF875C", 0.22));
        break;
      case "consumer":
        drawPixelRect(ctx, cornerX + 14, cornerY + 26, 68, 18, "#21122E");
        drawPixelRect(ctx, cornerX + 18, cornerY + 30, 60, 10, hexToRgba(accent, 0.32 + Math.sin(time / 180 + index) * 0.08));
        drawPixelRect(ctx, cornerX + 22, cornerY + 50, 14, 20, "#171D2A");
        drawPixelRect(ctx, cornerX + 44, cornerY + 50, 12, 20, "#171D2A");
        break;
      case "crypto":
        drawPixelRect(ctx, cornerX + 16, cornerY + 24, 64, 20, "#12202B");
        drawPixelRect(ctx, cornerX + 20, cornerY + 28, 56, 12, hexToRgba(accent, 0.28));
        drawPixelRect(ctx, cornerX + 26, cornerY + 52, 12, 12, "#E7FCFF");
        drawPixelRect(ctx, cornerX + 46, cornerY + 52, 12, 12, "#0D1420");
        drawPixelRect(ctx, cornerX + 66, cornerY + 52, 8, 12, "#E7FCFF");
        break;
      case "bio":
        drawPixelRect(ctx, cornerX + 18, cornerY + 24, 22, 18, "#11221B");
        drawPixelRect(ctx, cornerX + 44, cornerY + 24, 22, 18, "#143126");
        drawPixelRect(ctx, cornerX + 28, cornerY + 48, 28, 16, hexToRgba(accent, 0.22));
        drawPixelRect(ctx, cornerX + 34, cornerY + 44, 16, 6, "#C9FFE4");
        break;
      case "comms":
        drawPixelRect(ctx, cornerX + 26, cornerY + 16, 6, 48, "#111827");
        drawPixelRect(ctx, cornerX + 50, cornerY + 22, 6, 42, "#111827");
        drawPixelRect(ctx, cornerX + 20, cornerY + 20, 18, 6, hexToRgba(accent, 0.34));
        drawPixelRect(ctx, cornerX + 44, cornerY + 28, 18, 6, hexToRgba(accent, 0.34));
        break;
    }
  });
};

const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  body: string,
  trim: string,
  visor: string,
  accent: string,
  facing: "up" | "down" | "left" | "right",
  pulse = 0,
  bob = 0
) => {
  ctx.save();
  ctx.translate(pixel(x), pixel(y + bob));
  drawPixelRect(ctx, -7, 11, 14, 4, "rgba(0,0,0,0.38)");
  drawPixelRect(ctx, -5, -14, 10, 4, trim);
  drawPixelRect(ctx, -6, -10, 12, 7, body);
  drawPixelRect(ctx, -4, -8, 8, 2, visor);
  drawPixelRect(ctx, -6, -3, 4, 7, body);
  drawPixelRect(ctx, 2, -3, 4, 7, body);
  drawPixelRect(ctx, -6, 4, 4, 7, trim);
  drawPixelRect(ctx, 2, 4, 4, 7, trim);
  drawPixelRect(ctx, -8, -8, 2, 6, trim);
  drawPixelRect(ctx, 6, -8, 2, 6, trim);
  if (facing === "left") {
    drawPixelRect(ctx, -10, -7, 2, 3, accent);
  } else if (facing === "right") {
    drawPixelRect(ctx, 8, -7, 2, 3, accent);
  } else if (facing === "up") {
    drawPixelRect(ctx, -2, -14, 4, 2, accent);
  } else {
    drawPixelRect(ctx, -2, 11, 4, 2, accent);
  }
  if (pulse > 0) {
    ctx.strokeStyle = hexToRgba(accent, 0.48);
    ctx.lineWidth = 2;
    ctx.strokeRect(-10 - pulse, -18 - pulse, 20 + pulse * 2, 32 + pulse * 2);
  }
  ctx.restore();
};

const wrapPixelLines = (text: string, maxChars = 20) => {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) {
        lines.push(current);
      }
      current = word;
      return;
    }
    current = next;
  });

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 3);
};

const buildNpcRuntimes = (): NpcRuntime[] => {
  const citizenRuntimes = citizens.map((citizen, index) => ({
    id: citizen.id,
    type: "citizen" as const,
    districtId: citizen.districtId,
    x: citizen.x,
    y: citizen.y,
    homeX: citizen.x,
    homeY: citizen.y,
    targetX: citizen.x,
    targetY: citizen.y,
    speed: 0.26 + (index % 3) * 0.05,
    patrolRadius: citizen.patrolRadius,
    facing: "down" as const,
    bobSeed: index * 0.83,
    nextDecisionAt: 0,
    speechUntil: 0,
    speechText: null,
    dialogues: citizen.dialogues,
    color: citizen.color,
    style: citizen.style
  }));

  const stockRuntimes = tickers.map((ticker, index) => {
    const profile = stockNpcProfiles.find((entry) => entry.tickerId === ticker.id);
    const accent = districts.find((district) => district.id === ticker.districtId)?.accent ?? "#33F5FF";
    return {
      id: `stock-${ticker.id}`,
      type: "stock" as const,
      districtId: ticker.districtId,
      x: ticker.position.x,
      y: ticker.position.y,
      homeX: ticker.position.x,
      homeY: ticker.position.y,
      targetX: ticker.position.x,
      targetY: ticker.position.y,
      speed: 0.18,
      patrolRadius: profile?.patrolRadius ?? 14,
      facing: "down" as const,
      bobSeed: index * 0.71,
      nextDecisionAt: 0,
      speechUntil: 0,
      speechText: null,
      dialogues: profile?.dialogues ?? ["The tape is live."],
      color: accent,
      style: "broker" as const,
      tickerId: ticker.id
    };
  });

  return [...citizenRuntimes, ...stockRuntimes];
};

const billboardFrameLabel = (prop: WorldProp, frame: number) => {
  const frames = prop.adFrames ?? ["NITE", "GRID", "ALPHA"];
  return frames[frame % frames.length];
};

export function CityCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controls = useCameraControls(canvasRef);
  const npcRuntimeRef = useRef<NpcRuntime[]>(buildNpcRuntimes());
  const propEffectsRef = useRef<Record<string, { type: string; until: number }>>({});
  const billboardFramesRef = useRef<Record<string, number>>({});
  const playerTrailRef = useRef<Array<{ x: number; y: number; age: number }>>([]);
  const lightningRef = useRef<{ nextAt: number; flash: number }>({ nextAt: 0, flash: 0 });
  const bubbleTimeoutRef = useRef<number | null>(null);
  const introTimeoutRef = useRef<number | null>(null);

  const [hoverEntity, setHoverEntityState] = useState<HoverEntity>(null);
  const hoverEntityRef = useRef<HoverEntity>(null);
  const [pluginPrompt, setPluginPrompt] = useState<PluginPrompt | null>(null);
  const [interactionBubble, setInteractionBubble] = useState<InteractionBubble | null>(null);
  const [worldNewsBubble, setWorldNewsBubble] = useState<WorldNewsBubble | null>(null);
  const [introTickerId, setIntroTickerIdState] = useState<string | null>(null);
  const introTickerIdRef = useRef<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);

  const setHoverEntity = (entity: HoverEntity) => {
    hoverEntityRef.current = entity;
    setHoverEntityState(entity);
  };

  const setIntroTickerId = (id: string | null) => {
    introTickerIdRef.current = id;
    setIntroTickerIdState(id);
  };

  const camera = useNeonStore((state) => state.camera);
  const player = useNeonStore((state) => state.player);
  const guide = useNeonStore((state) => state.guide);
  const showAlliances = useNeonStore((state) => state.showAlliances);
  const showPoiMarkers = useNeonStore((state) => state.showPoiMarkers);
  const pluginMode = useNeonStore((state) => state.pluginMode);
  const setSelectedTickerId = useNeonStore((state) => state.setSelectedTickerId);
  const setSelectedDistrictId = useNeonStore((state) => state.setSelectedDistrictId);
  const setActiveNewsstandDistrictId = useNeonStore((state) => state.setActiveNewsstandDistrictId);
  const setActiveRightPanelTab = useNeonStore((state) => state.setActiveRightPanelTab);

  const districtsById = useMemo(() => Object.fromEntries(districts.map((district) => [district.id, district])) as Record<string, District>, []);
  const activeAvatar = avatarOptions.find((option) => option.id === player.avatarId) ?? avatarOptions[0];

  const rainDropsRef = useRef<RainDrop[]>(
    Array.from({ length: 120 }, (_, index) => ({
      xSeed: (index * 97) % 1400,
      ySeed: (index * 191) % 1000,
      speed: 0.24 + (index % 7) * 0.05,
      opacity: 0.08 + (index % 4) * 0.02,
      length: 10 + (index % 3) * 4
    }))
  );
  const dustParticlesRef = useRef<DustParticle[]>(
    Array.from({ length: 42 }, (_, index) => ({
      xSeed: (index * 143) % 1500,
      ySeed: (index * 211) % 1000,
      speed: 0.12 + (index % 5) * 0.03,
      size: 2 + (index % 3),
      alpha: 0.05 + (index % 4) * 0.02
    }))
  );

  useEffect(() => {
    if (!pluginMode) {
      setPluginPrompt(null);
    }
  }, [pluginMode]);

  useEffect(() => {
    if (!worldNewsBubble) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setWorldNewsBubble(null);
    }, worldNewsBubble.kind === "newsstand" ? 5200 : 4200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [worldNewsBubble]);

  useEffect(() => {
    const handleInteract = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "e") {
        return;
      }

      const nearbyStock =
        npcRuntimeRef.current.find(
          (npc) => npc.type === "stock" && Math.hypot(player.x - npc.x, player.y - npc.y) < 88 && npc.tickerId
        ) ?? null;

      if (nearbyStock?.tickerId) {
        const ticker = tickers.find((entry) => entry.id === nearbyStock.tickerId);
        if (ticker) {
          setSelectedTickerId(ticker.id);
          setSelectedDistrictId(ticker.districtId);
          setActiveRightPanelTab("scenes");
          setWorldNewsBubble({
            id: `ticker-${ticker.id}`,
            kind: "ticker",
            anchorX: nearbyStock.x,
            anchorY: nearbyStock.y - 44,
            title: ticker.symbol,
            lines: tickerNews[ticker.id]?.lines.slice(0, 3) ?? []
          });
        }
        return;
      }

      const nearbyNewsstand = newsstands.find((stand) => Math.hypot(player.x - stand.x, player.y - stand.y) < 104) ?? null;
      if (nearbyNewsstand) {
        setActiveNewsstandDistrictId(nearbyNewsstand.districtId);
        setSelectedDistrictId(nearbyNewsstand.districtId);
        setWorldNewsBubble({
          id: `newsstand-${nearbyNewsstand.districtId}`,
          kind: "newsstand",
          anchorX: nearbyNewsstand.x + 18,
          anchorY: nearbyNewsstand.y - 76,
          title: `${districtsById[nearbyNewsstand.districtId].name} Newsstand`,
          lines: districtNewsBoards[nearbyNewsstand.districtId]?.lines.slice(0, 5) ?? []
        });
      }
    };

    window.addEventListener("keydown", handleInteract);
    return () => {
      window.removeEventListener("keydown", handleInteract);
    };
  }, [districtsById, player.x, player.y, setActiveNewsstandDistrictId, setActiveRightPanelTab, setSelectedDistrictId, setSelectedTickerId]);

  useEffect(
    () => () => {
      if (bubbleTimeoutRef.current !== null) {
        window.clearTimeout(bubbleTimeoutRef.current);
      }
      if (introTimeoutRef.current !== null) {
        window.clearTimeout(introTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let animationFrame = 0;
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let lastPlayerTrailAt = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      useNeonStore.getState().setViewport(rect.width, rect.height);
    };

    const drawBackground = (time: number, width: number, height: number, cameraX: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#060811");
      gradient.addColorStop(1, "#04050A");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(15, 22, 34, 0.9)";
      for (let index = 0; index < 18; index += 1) {
        const baseX = ((index * 120 - cameraX * 0.08) % (width + 180)) - 60;
        const towerHeight = 120 + (index % 4) * 70;
        drawPixelRect(ctx, baseX, 30 + (index % 2) * 22, 80, towerHeight, "#090C14");
        drawPixelRect(ctx, baseX + 14, 46 + (index % 2) * 22, 10, towerHeight - 36, "#0E1630");
        drawPixelRect(ctx, baseX + 52, 56 + (index % 2) * 22, 8, towerHeight - 52, "#112038");
      }

      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let index = 0; index < 10; index += 1) {
        const lineX = ((index * 210 - cameraX * 0.2 + time * 0.24) % (width + 320)) - 120;
        ctx.fillRect(lineX, 0, 20, height);
      }
    };

    const drawZone = (zone: DistrictZone, district: District, time: number, cameraX: number, cameraY: number) => {
      const theme = zoneShadeByVariant[zone.tileVariant];
      const x = pixel(zone.x - cameraX);
      const y = pixel(zone.y - cameraY);
      const selected = district.id === useNeonStore.getState().selectedDistrictId;
      const pulsing = district.id === useNeonStore.getState().scenePulse.districtId;
      const intensity = pulsing ? 0.68 : selected ? 0.44 : 0.24;

      drawPixelRect(ctx, x - 54, y - 54, zone.width + 108, zone.height + 108, "#0B0F16");
      drawPixelRect(ctx, x - 20, y - 20, zone.width + 40, zone.height + 40, "#0E121A");
      drawPixelRect(ctx, x, y, zone.width, zone.height, "#101621");
      drawPixelFrame(ctx, x - 4, y - 4, zone.width + 8, zone.height + 8, hexToRgba(district.accent, 0.18 + intensity * 0.2));

      drawPixelRect(ctx, x + 8, y + 8, zone.width - 16, 20, "#0A1019");
      drawPixelRect(ctx, x + 8, y + zone.height - 28, zone.width - 16, 20, "#0A1019");
      drawPixelRect(ctx, x + 8, y + 8, 20, zone.height - 16, "#0A1019");
      drawPixelRect(ctx, x + zone.width - 28, y + 8, 20, zone.height - 16, "#0A1019");

      drawPixelRect(ctx, x + zone.streetInset, y + zone.streetInset, zone.width - zone.streetInset * 2, zone.height - zone.streetInset * 2, "#17202E");

      for (let tileY = 0; tileY < zone.height - zone.streetInset * 2; tileY += TILE) {
        for (let tileX = 0; tileX < zone.width - zone.streetInset * 2; tileX += TILE) {
          const odd = ((tileX / TILE) + (tileY / TILE)) % 2 === 0;
          const selector = (tileX / TILE + tileY / TILE * 3) % 11;
          drawPixelRect(
            ctx,
            x + zone.streetInset + tileX,
            y + zone.streetInset + tileY,
            TILE - 1,
            TILE - 1,
            odd ? theme.floor : hexToRgba(theme.floor, 0.9)
          );
          if ((tileX / TILE + tileY / TILE) % 9 === 0) {
            drawPixelRect(ctx, x + zone.streetInset + tileX + 8, y + zone.streetInset + tileY + 24, 10, 1, hexToRgba(theme.line, 0.1));
          }
          if (selector === 2) {
            drawPixelRect(ctx, x + zone.streetInset + tileX + 12, y + zone.streetInset + tileY + 10, 8, 1, hexToRgba(theme.neon, 0.08));
          }
          if (selector === 5) {
            drawPixelRect(ctx, x + zone.streetInset + tileX + 7, y + zone.streetInset + tileY + 14, 16, 1, hexToRgba(theme.hazard, 0.14));
          }
          if (selector === 8) {
            drawPixelRect(ctx, x + zone.streetInset + tileX + 4, y + zone.streetInset + tileY + 18, 24, 3, hexToRgba(theme.puddle, 0.36));
            drawPixelRect(ctx, x + zone.streetInset + tileX + 8, y + zone.streetInset + tileY + 19, 12, 1, hexToRgba(theme.neon, 0.12));
          }
        }
      }

      drawPixelRect(ctx, x + zone.streetInset, y + zone.streetInset, zone.width - zone.streetInset * 2, 18, theme.line);
      drawPixelRect(ctx, x + zone.streetInset, y + zone.height - zone.streetInset - 18, zone.width - zone.streetInset * 2, 18, theme.line);
      drawPixelRect(ctx, x + zone.streetInset, y + zone.streetInset, 18, zone.height - zone.streetInset * 2, theme.line);
      drawPixelRect(ctx, x + zone.width - zone.streetInset - 18, y + zone.streetInset, 18, zone.height - zone.streetInset * 2, theme.line);
      drawPixelRect(ctx, x + zone.streetInset + 18, y + zone.streetInset + 18, zone.width - zone.streetInset * 2 - 36, 10, "#0A1018");
      drawPixelRect(ctx, x + zone.streetInset + 18, y + zone.height - zone.streetInset - 28, zone.width - zone.streetInset * 2 - 36, 10, "#0A1018");

      if (zone.tileVariant === "energy") {
        for (let index = 0; index < 6; index += 1) {
          drawPixelRect(ctx, x + zone.streetInset + 40 + index * 48, y + zone.streetInset + 34, 24, 4, theme.hazard);
          drawPixelRect(ctx, x + zone.width - zone.streetInset - 72, y + zone.streetInset + 120 + index * 36, 28, 4, theme.hazard);
        }
      }
      if (zone.tileVariant === "tech") {
        for (let index = 0; index < 5; index += 1) {
          drawPixelRect(ctx, x + zone.streetInset + 32 + index * 56, y + zone.height / 2 + 90, 30, 2, hexToRgba(theme.neon, 0.36));
        }
      }
      if (zone.tileVariant === "finance") {
        for (let index = 0; index < 4; index += 1) {
          drawPixelRect(ctx, x + zone.streetInset + 48 + index * 74, y + zone.streetInset + 24, 44, 4, hexToRgba(theme.neon, 0.24));
        }
      }

      for (let index = 0; index < 6; index += 1) {
        const cableY = y + zone.streetInset + 54 + index * 78;
        drawPixelRect(ctx, x + zone.streetInset + 26, cableY, zone.width - zone.streetInset * 2 - 52, 2, hexToRgba(theme.neon, 0.12));
      }

      for (let index = 0; index < 10; index += 1) {
        const ventX = x + zone.streetInset + 32 + (index * 68) % (zone.width - zone.streetInset * 2 - 52);
        const ventY = y + zone.streetInset + 38 + ((index * 44) % (zone.height - zone.streetInset * 2 - 40));
        drawPixelRect(ctx, ventX, ventY, 18, 6, "#0B1018");
        drawPixelRect(ctx, ventX + 3, ventY + 2, 12, 1, hexToRgba(theme.line, 0.34));
      }

      const puddlePositions = [
        [x + zone.streetInset + 54, y + zone.height - zone.streetInset - 72],
        [x + zone.width - zone.streetInset - 140, y + zone.streetInset + 102],
        [x + zone.width / 2 + 42, y + zone.height / 2 + 118]
      ];
      puddlePositions.forEach(([px, py], index) => {
        const shimmer = 0.18 + Math.sin(time / 280 + index) * 0.08;
        drawPixelRect(ctx, px, py, 48, 16, hexToRgba(theme.puddle, 0.7));
        drawPixelRect(ctx, px + 4, py + 4, 40, 4, hexToRgba(theme.neon, shimmer));
      });

      const plazaSize = district.id === "consumer-strip" ? 236 : 196;
      const plazaX = x + zone.width / 2 - plazaSize / 2;
      const plazaY = y + zone.height / 2 - plazaSize / 2;
      drawPlazaCore(ctx, plazaX, plazaY, plazaSize, district.accent, time);

      const topFacadeY = y + 16;
      for (let index = 0; index < 6; index += 1) {
        const buildingX = x + zone.streetInset + 8 + index * 108;
        drawFacadeBlock(ctx, buildingX, topFacadeY, 78, 62 + (index % 2) * 10, district.accent, theme.shop);
      }

      const leftFacadeX = x + 18;
      for (let index = 0; index < 4; index += 1) {
        drawFacadeBlock(ctx, leftFacadeX, y + zone.streetInset + 26 + index * 114, 54, 86, district.accent, "#0E1522");
      }

      for (let index = 0; index < 4; index += 1) {
        const buildingX = x + zone.width - zone.streetInset - 74;
        const buildingY = y + zone.streetInset + 30 + index * 110;
        drawFacadeBlock(ctx, buildingX, buildingY, 56, 76, district.accent, "#10192B");
      }

      drawCornerDressing(
        ctx,
        zone.tileVariant,
        x + zone.streetInset + 8,
        y + zone.streetInset + 8,
        zone.width - zone.streetInset * 2 - 16,
        zone.height - zone.streetInset * 2 - 16,
        district.accent,
        time
      );

      drawPixelRect(ctx, x + zone.width / 2 - 44, y + 10, 88, 6, hexToRgba(district.accent, 0.12 + intensity * 0.12));
    };

    const drawSurface = (surface: WorldSurface, cameraX: number, cameraY: number, time: number) => {
      const x = surface.x - cameraX;
      const y = surface.y - cameraY;
      if (x > canvas.clientWidth + 120 || y > canvas.clientHeight + 120 || x + surface.width < -120 || y + surface.height < -120) {
        return;
      }

      if (surface.kind === "road") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#161A23");
        for (let stripe = 12; stripe < surface.width; stripe += 44) {
          drawPixelRect(ctx, x + stripe, y + surface.height / 2 - 2, 18, 4, "#AFBACB");
        }
        for (let patch = 8; patch < surface.height; patch += 22) {
          drawPixelRect(ctx, x + 8, y + patch, surface.width - 16, 1, "rgba(255,255,255,0.03)");
        }
      } else if (surface.kind === "sidewalk") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#212B39");
        for (let tileY = 0; tileY < surface.height; tileY += 18) {
          for (let tileX = 0; tileX < surface.width; tileX += 18) {
            drawPixelRect(ctx, x + tileX, y + tileY, 16, 16, (tileX + tileY) % 36 === 0 ? "#263447" : "#1B2634");
          }
        }
        drawPixelRect(ctx, x, y, surface.width, 4, "#42536C");
      } else if (surface.kind === "crosswalk") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#1A202C");
        if (surface.width > surface.height) {
          for (let stripe = 2; stripe < surface.width; stripe += 12) {
            drawPixelRect(ctx, x + stripe, y + 3, 6, surface.height - 6, "#E7EEF9");
          }
        } else {
          for (let stripe = 2; stripe < surface.height; stripe += 12) {
            drawPixelRect(ctx, x + 3, y + stripe, surface.width - 6, 6, "#E7EEF9");
          }
        }
      } else if (surface.kind === "alley") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#0D1119");
        drawPixelRect(ctx, x + 4, y + 4, surface.width - 8, surface.height - 8, "#131927");
        drawPixelRect(ctx, x + surface.width / 2 - 1, y + 8, 2, surface.height - 16, hexToRgba(surface.accent, 0.16));
      } else if (surface.kind === "tunnel") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#090C12");
        drawPixelRect(ctx, x + 6, y + 6, surface.width - 12, surface.height - 12, "#0E131C");
        drawPixelRect(ctx, x + 8, y + 8, 4, surface.height - 16, hexToRgba(surface.accent, 0.24 + Math.sin(time / 140) * 0.08));
        drawPixelRect(ctx, x + surface.width - 12, y + 8, 4, surface.height - 16, hexToRgba(surface.accent, 0.24 + Math.sin(time / 160) * 0.08));
        drawPixelRect(ctx, x + 18, y + surface.height - 20, surface.width - 36, 8, "rgba(80,140,180,0.16)");
      } else if (surface.kind === "hazard") {
        drawPixelRect(ctx, x, y, surface.width, surface.height, "#141813");
        for (let stripe = -surface.height; stripe < surface.width; stripe += 18) {
          drawPixelRect(ctx, x + stripe, y + surface.height / 2 - 8, 18, 8, "#111");
          drawPixelRect(ctx, x + stripe + 8, y + surface.height / 2, 10, 8, "#A8B218");
        }
      }
    };

    const drawStructure = (structure: WorldStructure, cameraX: number, cameraY: number, time: number) => {
      const x = structure.x - cameraX;
      const y = structure.y - cameraY;
      if (x > canvas.clientWidth + 120 || y > canvas.clientHeight + 120 || x + structure.width < -120 || y + structure.height < -120) {
        return;
      }

      if (structure.kind === "building" || structure.kind === "shopfront") {
        drawPixelRect(ctx, x, y, structure.width, structure.height, structure.kind === "shopfront" ? "#141C2B" : "#0B1018");
        drawPixelFrame(ctx, x, y, structure.width, structure.height, hexToRgba(structure.accent, structure.kind === "shopfront" ? 0.22 : 0.12));
        if (structure.kind === "building") {
          for (let row = 8; row < structure.height - 12; row += 16) {
            for (let col = 10; col < structure.width - 14; col += 14) {
              drawPixelRect(ctx, x + col, y + row, 6, 6, (row + col) % 28 === 0 ? "#D8EEFF" : "#7287A6");
            }
          }
        }
      } else if (structure.kind === "fence" || structure.kind === "gate" || structure.kind === "railing") {
        drawPixelRect(ctx, x, y, structure.width, structure.height, "#101722");
        for (let post = 0; post < structure.width; post += 14) {
          drawPixelRect(ctx, x + post, y, 4, structure.height, hexToRgba(structure.accent, 0.34));
        }
      } else if (structure.kind === "tunnel-mouth") {
        drawPixelRect(ctx, x, y, structure.width, structure.height, "#0A0C12");
        drawPixelRect(ctx, x + 8, y + 10, structure.width - 16, structure.height - 18, "#05070A");
        drawPixelRect(ctx, x + 18, y + structure.height - 20, structure.width - 36, 6, hexToRgba(structure.accent, 0.2));
      } else if (structure.kind === "bridge") {
        drawPixelRect(ctx, x, y, structure.width, structure.height, "#222A37");
        drawPixelRect(ctx, x, y + structure.height - 6, structure.width, 6, "#090E15");
        drawPixelRect(ctx, x + 8, y + 8, structure.width - 16, 4, hexToRgba(structure.accent, 0.34));
        drawPixelRect(ctx, x + 8, y + structure.height - 12, structure.width - 16, 4, hexToRgba(structure.accent, 0.34));
      } else if (structure.kind === "metro-entrance") {
        drawPixelRect(ctx, x, y, structure.width, structure.height, "#111722");
        drawPixelRect(ctx, x + 8, y + 8, structure.width - 16, 18, hexToRgba(structure.accent, 0.32));
        drawPixelRect(ctx, x + structure.width / 2 - 18, y + 30, 36, structure.height - 38, "#080C12");
        drawPixelRect(ctx, x + structure.width / 2 - 24, y + structure.height - 18, 48, 8, "#2A3345");
      }
    };

    const drawProp = (
      prop: WorldProp,
      screenX: number,
      screenY: number,
      time: number,
      effect: { type: string; until: number } | undefined,
      showLabel: boolean
    ) => {
      const theme = zoneShadeByVariant[zoneShadeByVariant[districtZones.find((zone) => zone.districtId === prop.districtId)?.tileVariant ?? "tech"] ? districtZones.find((zone) => zone.districtId === prop.districtId)!.tileVariant : "tech"];
      const glow = effect?.type === "lamp" ? 0.7 : 0.35 + Math.sin(time / 280 + screenX / 18) * 0.08;
      const frame = billboardFramesRef.current[prop.id] ?? 0;
      const shake = effect?.type === "crate" ? Math.sin(time / 40) * 3 : 0;
      const flicker = effect?.type === "vending" ? 0.4 + Math.sin(time / 40) * 0.25 : glow;
      const offsetX = shake;

      switch (prop.type) {
        case "vending-machine":
          drawPixelRect(ctx, screenX + offsetX, screenY - 28, 24, 30, "#151E2E");
          drawPixelRect(ctx, screenX + offsetX + 3, screenY - 24, 18, 18, hexToRgba(prop.accent, 0.45 + flicker));
          drawPixelRect(ctx, screenX + offsetX + 4, screenY - 4, 16, 3, "#0A1118");
          drawPixelRect(ctx, screenX + offsetX + 6, screenY - 1, 12, 3, "#D7F6FF");
          drawPixelRect(ctx, screenX + offsetX + 18, screenY - 24, 2, 20, "#F5FBFF");
          break;
        case "neon-terminal":
          drawPixelRect(ctx, screenX + 6, screenY - 20, 14, 20, "#10151F");
          drawPixelRect(ctx, screenX + 8, screenY - 16, 10, 10, hexToRgba(prop.accent, 0.54 + glow * 0.1));
          drawPixelRect(ctx, screenX, screenY, 28, 6, "#1B2433");
          break;
        case "billboard":
        case "holo-sign":
        case "qr-wall":
          drawPixelRect(ctx, screenX + (prop.type === "billboard" ? 10 : 12), screenY - 10, 8, 12, "#0D1117");
          drawPixelRect(ctx, screenX - 8, screenY - 36, 44 + (prop.type === "qr-wall" ? 16 : 0), 22 + (prop.type === "qr-wall" ? 10 : 0), "#0B1220");
          drawPixelRect(ctx, screenX - 4, screenY - 32, 36 + (prop.type === "qr-wall" ? 8 : 0), 14 + (prop.type === "qr-wall" ? 6 : 0), hexToRgba(prop.accent, glow + 0.1));
          if (showLabel) {
            ctx.fillStyle = "#F7FCFF";
            ctx.font = "bold 9px monospace";
            ctx.fillText(billboardFrameLabel(prop, frame), screenX + 2, screenY - 21);
          }
          break;
        case "bench":
          drawPixelRect(ctx, screenX + 2, screenY - 10, 28, 6, "#40312D");
          drawPixelRect(ctx, screenX + 4, screenY - 4, 4, 8, "#242C38");
          drawPixelRect(ctx, screenX + 24, screenY - 4, 4, 8, "#242C38");
          break;
        case "crate":
          drawPixelRect(ctx, screenX + offsetX + 2, screenY - 12, 16, 16, "#3A2A24");
          drawPixelFrame(ctx, screenX + offsetX + 2, screenY - 12, 16, 16, hexToRgba(prop.accent, 0.3));
          if (effect?.type === "crate") {
            drawPixelRect(ctx, screenX + 18, screenY - 16, 4, 4, "#F8FF9B");
            drawPixelRect(ctx, screenX + 24, screenY - 10, 3, 3, "#33F5FF");
          }
          break;
        case "taxi":
          drawPixelRect(ctx, screenX, screenY, 46, 18, "#141821");
          drawPixelRect(ctx, screenX + 4, screenY + 2, 38, 14, prop.accent);
          drawPixelRect(ctx, screenX + 12, screenY - 4, 22, 8, "#D8EEFF");
          drawPixelRect(ctx, screenX + 8, screenY + 20, 10, 4, "#05070C");
          drawPixelRect(ctx, screenX + 28, screenY + 20, 10, 4, "#05070C");
          break;
        case "doorway":
          drawPixelRect(ctx, screenX + 4, screenY - 28, 18, 30, "#090C12");
          drawPixelRect(ctx, screenX, screenY - 34, 26, 8, hexToRgba(prop.accent, glow + 0.08));
          break;
        case "stairs":
          for (let step = 0; step < 4; step += 1) {
            drawPixelRect(ctx, screenX + step * 6, screenY - step * 3, 24 - step * 6, 4, "#202735");
          }
          break;
        case "palm-tree":
          drawPixelRect(ctx, screenX + 12, screenY - 22, 6, 24, "#3B2A22");
          drawPixelRect(ctx, screenX + 2, screenY - 30, 26, 6, "#13C98D");
          drawPixelRect(ctx, screenX + 8, screenY - 36, 14, 6, "#1DE3A1");
          break;
        case "newsstand":
          drawPixelRect(ctx, screenX, screenY - 24, 40, 26, "#171C28");
          drawPixelRect(ctx, screenX + 2, screenY - 30, 36, 8, "#0B1017");
          drawPixelRect(ctx, screenX + 4, screenY - 20, 32, 12, hexToRgba(prop.accent, glow + 0.08));
          drawPixelRect(ctx, screenX + 6, screenY - 6, 28, 4, "#D7EEFF");
          drawPixelRect(ctx, screenX + 10, screenY + 2, 20, 4, "#0B0E15");
          break;
        case "street-lamp":
          drawPixelRect(ctx, screenX + 6, screenY - 34, 4, 36, "#1D2634");
          drawPixelRect(ctx, screenX, screenY - 40, 16, 8, hexToRgba("#FFF7C2", 0.75 + glow * 0.2));
          if (effect?.type === "lamp") {
            ctx.strokeStyle = hexToRgba(prop.accent, 0.36);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(screenX + 8, screenY - 32, 18 + Math.sin(time / 50) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "drone-dock":
          drawPixelRect(ctx, screenX, screenY - 10, 34, 16, "#101723");
          drawPixelRect(ctx, screenX + 6, screenY - 6, 22, 8, hexToRgba(prop.accent, 0.38 + glow * 0.1));
          break;
        case "manhole":
          drawPixelRect(ctx, screenX + 2, screenY - 4, 18, 6, "#11161E");
          drawPixelFrame(ctx, screenX + 2, screenY - 4, 18, 6, "#2B3744");
          break;
        case "pipe-rack":
          drawPixelRect(ctx, screenX, screenY - 16, 52, 20, "#12181F");
          drawPixelRect(ctx, screenX + 4, screenY - 14, 44, 4, hexToRgba(prop.accent, 0.3 + glow * 0.1));
          drawPixelRect(ctx, screenX + 4, screenY - 8, 44, 4, "#8596AC");
          drawPixelRect(ctx, screenX + 4, screenY - 2, 44, 4, "#8596AC");
          break;
        case "ac-unit":
          drawPixelRect(ctx, screenX, screenY - 16, 24, 18, "#1A1F29");
          drawPixelRect(ctx, screenX + 4, screenY - 12, 16, 4, "#8FA2B8");
          drawPixelRect(ctx, screenX + 4, screenY - 6, 16, 4, "#8FA2B8");
          break;
        case "neon-arrow":
          drawPixelRect(ctx, screenX, screenY - 10, 30, 12, hexToRgba(prop.accent, 0.36 + glow * 0.14));
          drawPixelRect(ctx, screenX + 20, screenY - 14, 8, 20, hexToRgba(prop.accent, 0.5 + glow * 0.16));
          break;
        case "server-stack":
          drawPixelRect(ctx, screenX, screenY - 34, 38, 36, "#101724");
          drawPixelRect(ctx, screenX + 6, screenY - 28, 26, 8, hexToRgba(prop.accent, 0.35 + glow * 0.14));
          drawPixelRect(ctx, screenX + 8, screenY - 16, 22, 5, "#D7F6FF");
          drawPixelRect(ctx, screenX + 8, screenY - 8, 22, 5, "#D7F6FF");
          break;
        case "vault-sign":
          drawPixelRect(ctx, screenX + 10, screenY - 12, 8, 14, "#121722");
          drawPixelRect(ctx, screenX, screenY - 38, 34, 22, "#0D1320");
          drawPixelRect(ctx, screenX + 4, screenY - 34, 26, 14, hexToRgba("#F6D780", 0.28 + glow * 0.18));
          ctx.fillStyle = "#FFF5D8";
          ctx.font = "bold 9px monospace";
          ctx.fillText("VAULT", screenX + 2, screenY - 24);
          break;
        case "reactor-core":
          drawPixelRect(ctx, screenX + 8, screenY - 10, 24, 10, "#171F2B");
          drawPixelRect(ctx, screenX + 12, screenY - 30, 16, 18, hexToRgba(prop.accent, 0.45 + glow * 0.18));
          drawPixelRect(ctx, screenX + 10, screenY - 34, 20, 4, "#F5FFD1");
          break;
      }
    };

    const draw = (time: number) => {
      const state = useNeonStore.getState();
      const zoom = state.camera.zoom;
      const rawWidth = canvas.clientWidth;
      const rawHeight = canvas.clientHeight;
      const width = rawWidth / zoom;
      const height = rawHeight / zoom;
      const currentCamera = state.camera;
      const stormFactor = state.stormModeActive
        ? 1
        : state.scenePulse.expiresAt
          ? Math.max(0, (state.scenePulse.expiresAt - Date.now()) / Math.max(1, state.scenePulse.expiresAt - state.scenePulse.startedAt))
          : 0;

      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);

      drawBackground(time, width, height, currentCamera.x);

      if (state.showAlliances) {
        districtConnections.forEach(([fromId, toId], index) => {
          const from = districtsById[fromId];
          const to = districtsById[toId];
          const fromX = from.center.x - currentCamera.x;
          const fromY = from.center.y - currentCamera.y;
          const toX = to.center.x - currentCamera.x;
          const toY = to.center.y - currentCamera.y;
          if (
            (fromX < -300 && toX < -300) ||
            (fromY < -300 && toY < -300) ||
            (fromX > width + 300 && toX > width + 300) ||
            (fromY > height + 300 && toY > height + 300)
          ) {
            return;
          }
          ctx.strokeStyle = hexToRgba(index % 2 === 0 ? from.accent : to.accent, 0.05);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
        });
      }

      districtZones.forEach((zone) => {
        const district = districtsById[zone.districtId];
        drawZone(zone, district, time, currentCamera.x, currentCamera.y);
      });

      districtSurfaces.forEach((surface) => {
        drawSurface(surface, currentCamera.x, currentCamera.y, time);
      });

      [...districtStructures]
        .sort((left, right) => left.y - right.y)
        .forEach((structure) => {
          drawStructure(structure, currentCamera.x, currentCamera.y, time);
        });

      cityProps.forEach((prop) => {
        if (prop.lightRadius) {
          const screenX = prop.x - currentCamera.x + prop.width / 2;
          const screenY = prop.y - currentCamera.y - (prop.type === "street-lamp" ? 28 : 8);
          if (screenX > -160 && screenX < width + 160 && screenY > -160 && screenY < height + 160) {
            drawLightPool(ctx, screenX, screenY, prop.lightRadius, prop.accent, prop.type === "street-lamp" ? 0.14 : 0.12);
          }
        }
      });

      for (let droneIndex = 0; droneIndex < 3; droneIndex += 1) {
        const droneX = ((time * (0.11 + droneIndex * 0.03) + droneIndex * 420) % (width + 180)) - 90;
        const droneY = 92 + droneIndex * 84 + Math.sin(time / 420 + droneIndex) * 12;
        drawPixelRect(ctx, droneX, droneY, 16, 4, "#D8EEFF");
        drawPixelRect(ctx, droneX + 4, droneY - 4, 8, 4, "#33F5FF");
        drawPixelRect(ctx, droneX - 6, droneY + 1, 6, 2, "rgba(51,245,255,0.32)");
        drawPixelRect(ctx, droneX + 16, droneY + 1, 6, 2, "rgba(51,245,255,0.32)");
      }

      npcRuntimeRef.current.forEach((npc, index) => {
        if (time > npc.nextDecisionAt) {
          npc.targetX = npc.homeX + Math.cos(time / 320 + index * 1.7) * npc.patrolRadius;
          npc.targetY = npc.homeY + Math.sin(time / 420 + index * 1.1) * npc.patrolRadius;
          npc.nextDecisionAt = time + 1800 + (index % 4) * 500;
        }

        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const proposedX = npc.x + dx * 0.012 * npc.speed * 3.8;
        const proposedY = npc.y + dy * 0.012 * npc.speed * 3.8;
        const blockedX = npcCollidesAt(proposedX, npc.y);
        const blockedY = npcCollidesAt(npc.x, proposedY);
        npc.x = blockedX ? npc.x : proposedX;
        npc.y = blockedY ? npc.y : proposedY;
        if (blockedX || blockedY) {
          npc.nextDecisionAt = time + 200;
        }

        const playerDx = state.player.x - npc.x;
        const playerDy = state.player.y - npc.y;
        if (Math.hypot(playerDx, playerDy) < 110) {
          npc.facing = Math.abs(playerDx) > Math.abs(playerDy) ? (playerDx > 0 ? "right" : "left") : playerDy > 0 ? "down" : "up";
        } else if (Math.abs(dx) > Math.abs(dy)) {
          npc.facing = dx > 0 ? "right" : "left";
        } else {
          npc.facing = dy > 0 ? "down" : "up";
        }

        if (time > npc.speechUntil && (index + Math.floor(time / 3000)) % 14 === 0 && Math.hypot(playerDx, playerDy) < 160) {
          npc.speechText = npc.dialogues[(Math.floor(time / 3000) + index) % npc.dialogues.length];
          npc.speechUntil = time + 1800;
        }
        if (npc.speechUntil < time) {
          npc.speechText = null;
        }
      });

      const visibleProps = cityProps.filter((prop) => {
        const screenX = prop.x - currentCamera.x;
        const screenY = prop.y - currentCamera.y;
        return screenX > -120 && screenX < width + 120 && screenY > -120 && screenY < height + 120;
      });

      visibleProps.sort((left, right) => left.y - right.y);

      visibleProps.forEach((prop) => {
        const showLabel =
          (hoverEntityRef.current?.kind === "prop" && hoverEntityRef.current.prop.id === prop.id) ||
          selectedMarker?.id === prop.id ||
          Math.hypot(state.player.x - prop.x, state.player.y - prop.y) < 96;
        drawProp(prop, prop.x - currentCamera.x, prop.y - currentCamera.y, time, propEffectsRef.current[prop.id], showLabel);
        if (selectedMarker?.kind !== "ticker" && selectedMarker?.id === prop.id) {
          const markerX = prop.x - currentCamera.x + prop.width / 2;
          const markerY = prop.y - currentCamera.y + 6;
          drawLightPool(ctx, markerX, markerY, 34, selectedMarker.color, 0.16);
          drawRing(ctx, markerX, markerY, selectedMarker.color, 1.4);
          drawPixelRect(ctx, markerX - 34, markerY - 36, 68, 12, "#081019");
          drawPixelFrame(ctx, markerX - 34, markerY - 36, 68, 12, hexToRgba(selectedMarker.color, 0.34));
          ctx.fillStyle = "#F6FBFF";
          ctx.font = "bold 9px monospace";
          ctx.fillText(selectedMarker.label.slice(0, 11), markerX - 28, markerY - 27);
        }
      });

      if (selectedMarker && selectedMarker.kind === "newsstand") {
        const markerX = selectedMarker.x - currentCamera.x;
        const markerY = selectedMarker.y - currentCamera.y + 6;
        drawLightPool(ctx, markerX, markerY, 36, selectedMarker.color, 0.18);
        drawRing(ctx, markerX, markerY, selectedMarker.color, 1.6);
        drawPixelRect(ctx, markerX - 34, markerY - 36, 68, 12, "#081019");
        drawPixelFrame(ctx, markerX - 34, markerY - 36, 68, 12, hexToRgba(selectedMarker.color, 0.34));
        ctx.fillStyle = "#F6FBFF";
        ctx.font = "bold 9px monospace";
        ctx.fillText(selectedMarker.label.slice(0, 11), markerX - 28, markerY - 27);
      }

      npcRuntimeRef.current.forEach((npc) => {
        const x = npc.x - currentCamera.x;
        const y = npc.y - currentCamera.y;
        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) {
          return;
        }

        const bob = Math.sin(time / 260 + npc.bobSeed) * 1.2;
        if (npc.type === "stock") {
          const ticker = tickers.find((entry) => entry.id === npc.tickerId)!;
          const district = districtsById[ticker.districtId];
          const selected = ticker.id === state.selectedTickerId;
          const introPulse = introTickerIdRef.current === ticker.id ? 3 + Math.sin(time / 40) * 1.4 : selected ? 2 : 0;
          if (selected || introTickerIdRef.current === ticker.id) {
            drawLightPool(ctx, x, y + 10, 38 + introPulse * 5, district.accent, 0.16);
            drawRing(ctx, x, y + 11, district.accent, introPulse);
          }
          drawCharacter(
            ctx,
            x,
            y,
            selected ? hexToRgba(district.accent, 0.95) : "#1C2638",
            "#E8F6FF",
            "#09101A",
            district.accent,
            npc.facing,
            introPulse,
            bob
          );
          if (selected || introTickerIdRef.current === ticker.id || Math.hypot(state.player.x - npc.x, state.player.y - npc.y) < 140 || hoverEntityRef.current?.kind === "ticker" && hoverEntityRef.current.ticker.id === ticker.id) {
            drawPixelRect(ctx, x - 22, y - 34, 44, 11, "#081019");
            drawPixelFrame(ctx, x - 22, y - 34, 44, 11, hexToRgba(district.accent, 0.34));
            ctx.fillStyle = "#F6FBFF";
            ctx.font = "bold 10px monospace";
            ctx.fillText(ticker.symbol, x - 16, y - 25);
          }
        } else {
          const body = npc.style === "broker" ? "#22324D" : npc.style === "vendor" ? "#2C213E" : "#182433";
          const trim = npc.style === "runner" ? "#E3FFFB" : "#F8E8FF";
          drawCharacter(ctx, x, y, body, trim, "#0A0C12", npc.color, npc.facing, 0, bob);
        }

        if (npc.speechText) {
          drawPixelRect(ctx, x - 34, y - 48, 68, 16, "#081019");
          drawPixelFrame(ctx, x - 34, y - 48, 68, 16, hexToRgba(npc.color, 0.3));
          ctx.fillStyle = "#F6FBFF";
          ctx.font = "bold 8px monospace";
          ctx.fillText(npc.speechText, x - 30, y - 37);
        }
      });

      if (Math.hypot(state.player.vx, state.player.vy) > 0.14 && time - lastPlayerTrailAt > 90) {
        playerTrailRef.current.unshift({ x: state.player.x, y: state.player.y + 10, age: 1 });
        playerTrailRef.current = playerTrailRef.current.slice(0, 10);
        lastPlayerTrailAt = time;
      }
      playerTrailRef.current = playerTrailRef.current
        .map((item) => ({ ...item, age: item.age - 0.02 }))
        .filter((item) => item.age > 0);
      playerTrailRef.current.forEach((trail) => {
        drawPixelRect(ctx, trail.x - currentCamera.x - 6, trail.y - currentCamera.y, 12, 4, `rgba(8,12,18,${trail.age * 0.35})`);
      });

      const guideX = state.player.x - currentCamera.x + 34;
      const guideY = state.player.y - currentCamera.y - 22 + Math.sin(time / 220) * 2;
      drawLightPool(ctx, guideX, guideY + 16, 28, "#33F5FF", guide.speaking ? 0.2 : 0.1);
      drawPixelRect(ctx, guideX - 8, guideY - 16, 16, 16, "#081019");
      drawPixelFrame(ctx, guideX - 8, guideY - 16, 16, 16, guide.speaking ? hexToRgba("#33F5FF", 0.7) : hexToRgba("#33F5FF", 0.32));
      drawPixelRect(ctx, guideX - 5, guideY - 13, 10, 4, "#DFFAFF");
      drawPixelRect(ctx, guideX - 6, guideY - 8, 12, 8, guide.speaking ? "#16374A" : "#102232");
      drawPixelRect(ctx, guideX - 3, guideY - 6, 6, 2, "#33F5FF");
      drawPixelRect(ctx, guideX - 2, guideY + 1, 4, 4, "#33F5FF");
      drawPixelRect(ctx, guideX - 1, guideY + 5, 2, 6, "#33F5FF");

      drawCharacter(
        ctx,
        state.player.x - currentCamera.x,
        state.player.y - currentCamera.y,
        activeAvatar.body,
        activeAvatar.trim,
        activeAvatar.visor,
        activeAvatar.body,
        state.player.facing,
        1
      );

      if (guide.message) {
        const guideLines = wrapPixelLines(guide.message.replace("Gemini Guide: ", ""), 22);
        const bubbleWidth = 168;
        const bubbleHeight = 16 + guideLines.length * 12;
        const bubbleX = guideX - 18;
        const bubbleY = guideY - 72 - bubbleHeight;
        drawPixelRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, "#081019");
        drawPixelFrame(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, hexToRgba("#33F5FF", guide.speaking ? 0.46 : 0.24));
        drawPixelRect(ctx, bubbleX + 16, bubbleY + bubbleHeight, 12, 6, "#081019");
        drawPixelRect(ctx, bubbleX + 20, bubbleY + bubbleHeight + 6, 6, 6, "#081019");
        ctx.fillStyle = "#F6FBFF";
        ctx.font = "bold 9px monospace";
        guideLines.forEach((line, index) => {
          ctx.fillText(line, bubbleX + 10, bubbleY + 14 + index * 11);
        });
      }

      if (stormFactor > 0.2 && time > lightningRef.current.nextAt) {
        lightningRef.current.flash = 0.22 + stormFactor * 0.1;
        lightningRef.current.nextAt = time + 4200 + Math.random() * 3200;
      }
      lightningRef.current.flash *= 0.965;

      ctx.save();
      ctx.lineCap = "round";
      const rainCount = stormFactor > 0 ? 120 : 48;
      for (let index = 0; index < rainCount; index += 1) {
        const drop = rainDropsRef.current[index];
        const rainX = (drop.xSeed + time * drop.speed * (stormFactor > 0 ? 1.6 : 1)) % (width + 120) - 60;
        const rainY = (drop.ySeed + time * drop.speed * (stormFactor > 0 ? 3 : 1.8)) % (height + 140) - 70;
        ctx.beginPath();
        ctx.moveTo(rainX, rainY);
        ctx.lineTo(rainX + drop.length * 0.18, rainY + drop.length + stormFactor * 6);
        ctx.strokeStyle = `rgba(186, 228, 255, ${drop.opacity + stormFactor * 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      if (stormFactor < 0.35) {
        dustParticlesRef.current.forEach((particle) => {
          const dustX = (particle.xSeed + time * particle.speed) % (width + 80) - 40;
          const dustY = (particle.ySeed + time * particle.speed * 0.7) % (height + 60) - 30;
          drawPixelRect(ctx, dustX, dustY, particle.size, particle.size, `rgba(140,255,235,${particle.alpha})`);
        });
      }

      if (showPoiMarkers) {
        pointsOfInterest.forEach((poi) => {
          const x = poi.x - currentCamera.x + poi.width / 2;
          const y = poi.y - currentCamera.y - poi.height - 8;
          if (x < -30 || x > width + 30 || y < -30 || y > height + 30) {
            return;
          }
          drawPixelRect(ctx, x - 8, y - 8, 16, 16, hexToRgba(poi.accent, 0.24));
          drawPixelFrame(ctx, x - 8, y - 8, 16, 16, hexToRgba(poi.accent, 0.42));
          ctx.fillStyle = "#F6FBFF";
          ctx.font = "bold 10px monospace";
          ctx.fillText(districtThemes[poi.districtId]?.icon ?? "•", x - 4, y + 4);
        });
      }

      if (lightningRef.current.flash > 0.02) {
        ctx.fillStyle = `rgba(193, 226, 255, ${lightningRef.current.flash})`;
        ctx.fillRect(0, 0, width, height);
      }

      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, height * 0.8);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    animationFrame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [activeAvatar.body, activeAvatar.trim, activeAvatar.visor, districtsById, guide.message, guide.speaking, showAlliances, showPoiMarkers]);

  const getStockRuntimeAt = (worldX: number, worldY: number) =>
    npcRuntimeRef.current.find((npc) => npc.type === "stock" && Math.hypot(worldX - npc.x, worldY - npc.y) <= 18) ?? null;

  const getNewsstandAt = (worldX: number, worldY: number) =>
    newsstands.find((stand) => Math.abs(worldX - (stand.x + 16)) <= 24 && Math.abs(worldY - (stand.y - 6)) <= 22) ?? null;

  const getPropAt = (worldX: number, worldY: number) =>
    [...cityProps].reverse().find((prop) => worldX >= prop.x && worldX <= prop.x + prop.width && worldY >= prop.y - prop.height && worldY <= prop.y + 8) ?? null;

  const handleHover = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top, camera.x, camera.y, camera.zoom);

    const stockRuntime = getStockRuntimeAt(world.x, world.y);
    if (stockRuntime?.tickerId) {
      const ticker = tickers.find((entry) => entry.id === stockRuntime.tickerId)!;
      const district = districtsById[ticker.districtId];
      setHoverEntity({ kind: "ticker", ticker, district, x: event.clientX - rect.left, y: event.clientY - rect.top });
      return;
    }

    const newsstand = getNewsstandAt(world.x, world.y);
    if (newsstand) {
      const district = districtsById[newsstand.districtId];
      setHoverEntity({ kind: "newsstand", stand: newsstand, district, x: event.clientX - rect.left, y: event.clientY - rect.top });
      return;
    }

    const prop = getPropAt(world.x, world.y);
    if (prop) {
      const district = districtsById[prop.districtId];
      setHoverEntity({ kind: "prop", prop, district, x: event.clientX - rect.left, y: event.clientY - rect.top });
      return;
    }

    setHoverEntity(null);
  };

  const showBubble = (id: string, label: string, x: number, y: number) => {
    setInteractionBubble({ id, label, x, y });
    if (bubbleTimeoutRef.current !== null) {
      window.clearTimeout(bubbleTimeoutRef.current);
    }
    bubbleTimeoutRef.current = window.setTimeout(() => {
      setInteractionBubble(null);
    }, 1400);
  };

  const triggerPropEffect = (propId: string, type: string, duration = 900) => {
    propEffectsRef.current[propId] = { type, until: performance.now() + duration };
    window.setTimeout(() => {
      if (propEffectsRef.current[propId]?.until && propEffectsRef.current[propId].until <= performance.now()) {
        delete propEffectsRef.current[propId];
      }
    }, duration + 32);
  };

  const openTickerBubble = (ticker: Ticker, runtimeX: number, runtimeY: number) => {
    setWorldNewsBubble({
      id: `ticker-${ticker.id}`,
      kind: "ticker",
      anchorX: runtimeX,
      anchorY: runtimeY - 44,
      title: ticker.symbol,
      lines: tickerNews[ticker.id]?.lines.slice(0, 3) ?? []
    });
  };

  const openNewsstandBubble = (stand: NewsstandData) => {
    setWorldNewsBubble({
      id: `newsstand-${stand.districtId}`,
      kind: "newsstand",
      anchorX: stand.x + 18,
      anchorY: stand.y - 76,
      title: `${districtsById[stand.districtId].name} Newsstand`,
      lines: districtNewsBoards[stand.districtId]?.lines.slice(0, 5) ?? []
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    controls.onPointerMove(event);
    if (event.buttons !== 0 || controls.gestureMovedRef.current.moved) {
      setHoverEntity(null);
      return;
    }
    handleHover(event);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    setHoverEntity(null);
    setWorldNewsBubble(null);
    controls.onPointerDown(event);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const moved = controls.gestureMovedRef.current.moved;
    controls.onPointerUp(event);

    if (moved) {
      controls.gestureMovedRef.current.moved = false;
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top, camera.x, camera.y, camera.zoom);
    const stockRuntime = getStockRuntimeAt(world.x, world.y);
    if (stockRuntime?.tickerId) {
      const ticker = tickers.find((entry) => entry.id === stockRuntime.tickerId)!;
      const district = districtsById[ticker.districtId];
      setIntroTickerId(ticker.id);
      setSelectedDistrictId(ticker.districtId);
      setSelectedMarker({
        id: ticker.id,
        kind: "ticker",
        x: stockRuntime.x,
        y: stockRuntime.y,
        label: ticker.symbol,
        color: district.accent
      });
      showBubble(ticker.id, `${ticker.symbol} online`, stockRuntime.x, stockRuntime.y - 26);
      if (introTimeoutRef.current !== null) {
        window.clearTimeout(introTimeoutRef.current);
      }
      introTimeoutRef.current = window.setTimeout(() => {
        setSelectedTickerId(ticker.id);
        setActiveRightPanelTab("scenes");
        setIntroTickerId(null);
        setPluginPrompt(pluginMode ? { ticker, x: event.clientX - rect.left, y: event.clientY - rect.top } : null);
        useNeonStore.getState().triggerDistrictPulse(district.id, "scene", 1200);
        openTickerBubble(ticker, stockRuntime.x, stockRuntime.y);
      }, 280);
      return;
    }

    const newsstand = getNewsstandAt(world.x, world.y);
    if (newsstand) {
      setActiveNewsstandDistrictId(newsstand.districtId);
      setSelectedDistrictId(newsstand.districtId);
      setSelectedMarker({
        id: newsstand.id,
        kind: "newsstand",
        x: newsstand.x + 18,
        y: newsstand.y,
        label: "Newsstand",
        color: districtsById[newsstand.districtId].accent
      });
      showBubble(newsstand.id, "Newsstand open", newsstand.x, newsstand.y - 34);
      openNewsstandBubble(newsstand);
      return;
    }

    const prop = getPropAt(world.x, world.y);
    if (prop && prop.interactive) {
      setSelectedMarker({
        id: prop.id,
        kind: "prop",
        x: prop.x + prop.width / 2,
        y: prop.y,
        label: prop.label,
        color: prop.accent
      });
      if (prop.landmarkTitle) {
        triggerPropEffect(prop.id, "landmark", 1200);
        setWorldNewsBubble({
          id: `prop-${prop.id}`,
          kind: "prop",
          anchorX: prop.x + prop.width / 2,
          anchorY: prop.y - prop.height - 14,
          title: prop.landmarkTitle,
          lines: [
            { id: `${prop.id}-line-1`, text: prop.landmarkText ?? "A district landmark pulses with mock lore and future event hooks." },
            { id: `${prop.id}-line-2`, text: `${districtsById[prop.districtId].name} landmark. Follow the nearby streets and alleys for more activity.` }
          ]
        });
        showBubble(prop.id, prop.label, prop.x, prop.y - prop.height - 14);
        return;
      }

      switch (prop.behavior) {
        case "vending":
          triggerPropEffect(prop.id, "vending", 1100);
          showBubble(prop.id, "Dispensing...", prop.x, prop.y - prop.height - 10);
          break;
        case "terminal":
          triggerPropEffect(prop.id, "terminal", 1000);
          setWorldNewsBubble({
            id: `prop-${prop.id}`,
            kind: "prop",
            anchorX: prop.x + prop.width / 2,
            anchorY: prop.y - prop.height - 12,
            title: "Data Node",
            lines: [
              { id: `${prop.id}-line-1`, text: "Mock terminal uplink. Future agent feeds, market notes, and plugin outputs can render here." },
              { id: `${prop.id}-line-2`, text: `${districtsById[prop.districtId].name} node is waiting for a live city event stream.` }
            ]
          });
          break;
        case "billboard":
          billboardFramesRef.current[prop.id] = (billboardFramesRef.current[prop.id] ?? 0) + 1;
          showBubble(prop.id, "Ad cycle", prop.x, prop.y - prop.height - 10);
          break;
        case "lamp":
          triggerPropEffect(prop.id, "lamp", 900);
          showBubble(prop.id, "Lamp surge", prop.x, prop.y - prop.height - 10);
          break;
        case "crate":
          triggerPropEffect(prop.id, "crate", 700);
          showBubble(prop.id, "Static crackle", prop.x, prop.y - prop.height - 10);
          break;
        case "newsstand":
          setActiveNewsstandDistrictId(prop.districtId);
          {
            const stand = newsstands.find((entry) => entry.districtId === prop.districtId);
            if (stand) {
              openNewsstandBubble(stand);
            }
          }
          break;
      }
      return;
    }

    const district = hitTestDistrict(world.x, world.y, districts);
    if (district) {
      setSelectedDistrictId(district.id);
      setPluginPrompt(null);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className={cn("h-full w-full touch-none bg-transparent", controls.isDragging ? "cursor-grabbing" : "cursor-grab")}
        aria-label="Living pixel-art cyberpunk city map"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={controls.onPointerCancel}
        onLostPointerCapture={controls.onLostPointerCapture}
        onPointerLeave={() => setHoverEntity(null)}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(51,245,255,0.06),transparent_30%),radial-gradient(circle_at_85%_12%,rgba(255,61,242,0.08),transparent_24%)]" />

      <div className="absolute bottom-4 right-[220px] z-30 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => useNeonStore.getState().zoomIn()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/35 bg-slate-950/88 text-sm font-bold text-cyan-100 transition hover:bg-neon-cyan/14"
        >
          +
        </button>
        <div className="text-center text-[10px] font-semibold tabular-nums text-slate-400">
          {Math.round(camera.zoom * 100)}%
        </div>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => useNeonStore.getState().zoomOut()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neon-cyan/35 bg-slate-950/88 text-sm font-bold text-cyan-100 transition hover:bg-neon-cyan/14"
        >
          -
        </button>
      </div>

      {pluginMode && pluginPrompt ? (
        <div
          className="absolute z-30 rounded-2xl border border-neon-cyan/30 bg-slate-950/92 p-3 shadow-neon-cyan"
          style={{ left: pluginPrompt.x, top: pluginPrompt.y, transform: "translate(18px, -40%)" }}
          data-ignore-camera-keys="true"
        >
          <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">Plugin Hook</div>
          <div className="mt-1 text-sm text-white">{pluginPrompt.ticker.symbol}</div>
          <a
            href={stockOutboundUrls[pluginPrompt.ticker.id]}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex rounded-full border border-neon-cyan/40 bg-neon-cyan/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-neon-cyan/18"
          >
            Open official stock page
          </a>
        </div>
      ) : null}

      {interactionBubble ? (
        <div
          className="pointer-events-none absolute z-20 rounded-full border border-neon-magenta/25 bg-slate-950/88 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-fuchsia-100"
          style={{
            left: interactionBubble.x - camera.x,
            top: interactionBubble.y - camera.y,
            transform: "translate(-50%, -100%)"
          }}
        >
          {interactionBubble.label}
        </div>
      ) : null}

      {worldNewsBubble ? (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 border-2 border-cyan-300/30 bg-[#020617] px-4 py-4 text-left shadow-[0_0_28px_rgba(51,245,255,0.14)] backdrop-blur-md",
            worldNewsBubble.kind === "newsstand" ? "w-[320px]" : "w-[280px]"
          )}
        >
          <div className="mb-2 font-['Orbitron','Rajdhani','Arial_Narrow',sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            {worldNewsBubble.title}
          </div>
          <div className="space-y-2 text-[11px] leading-5 text-slate-200">
            {worldNewsBubble.lines.map((line) => (
              <div key={line.id} className="rounded-xl border border-white/6 bg-white/[0.03] px-2.5 py-2">
                <div>{line.text}</div>
                {line.source ? <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-cyan-200/72">{line.source}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hoverEntity ? (
        <Tooltip x={hoverEntity.x} y={hoverEntity.y}>
          {hoverEntity.kind === "ticker" ? (
            <>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">Stock Character</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{hoverEntity.ticker.symbol}</span>
                <span className="text-xs text-slate-400">{hoverEntity.ticker.fullName}</span>
              </div>
              <div className="mt-2 text-xs text-slate-300">
                {hoverEntity.district.name} · {hoverEntity.ticker.mood}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Trend {trendIcon[hoverEntity.ticker.trend]} · Click for intro pulse
              </div>
            </>
          ) : hoverEntity.kind === "newsstand" ? (
            <>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">Newsstand</div>
              <div className="mt-1 text-sm font-semibold text-white">{hoverEntity.district.name}</div>
              <div className="mt-2 text-[11px] text-slate-400">Click to open district headlines and source placeholders.</div>
            </>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{hoverEntity.prop.label}</div>
              <div className="mt-2 text-[11px] text-slate-400">{hoverEntity.district.name} interactable block</div>
            </>
          )}
        </Tooltip>
      ) : null}
    </div>
  );
}
