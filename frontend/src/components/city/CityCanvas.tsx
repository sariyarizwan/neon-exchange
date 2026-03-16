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
import { useLiveData } from "@/components/LiveDataProvider";
import type { DistrictLiveState, LiveSignals, NeonTickerData } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useNeonStore } from "@/store/useNeonStore";
import type { District } from "@/types/district";
import type { Ticker } from "@/types/ticker";
import type { DistrictZone, NewsstandData, WorldProp, WorldStructure, WorldSurface } from "@/types/world";
import { hitTestDistrict, screenToWorld } from "./useHitTesting";
import { useCameraControls } from "./useCameraControls";
import { fastTravelGates } from "@/data/fastTravel";
import { dataChips } from "@/data/collectibles";
import { districtNpcDefs } from "@/data/npcTypes";
import { districtInteractables } from "@/data/interactables";
import { districtActivations, districtMissions } from "@/data/districtActions";
import { drawFloatingHolograms, drawSteamVents, drawBlinkingSigns, drawCourierDrones, drawAmbientSpeechBubbles } from "./systems/drawAmbient";
import { drawDistrictEffect } from "./systems/districtEffects";
import { drawHoverPrompts, type HoverPromptTarget } from "./systems/drawHoverPrompts";
import { drawInteractable } from "./systems/drawInteractables";
import { drawMissionIndicator, checkMissionProgress, processMissionResult } from "./systems/missionSystem";

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

// District image mapping: cycle blue, pink, purple, red across rows (left to right, top to bottom)
const DISTRICT_IMAGE_MAP: Record<string, string> = {
  "chip-docks": "/districts/blue.png",
  "bank-towers": "/districts/pink.png",
  "energy-yard": "/districts/purple.png",
  "crypto-alley": "/districts/red.png",
  "industrials-foundry": "/districts/blue.png",
  "consumer-strip": "/districts/pink.png",
  "bio-dome": "/districts/purple.png",
  "comms-neon-ridge": "/districts/red.png",
};

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

const drawIsoDiamond = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  height: number,
  topColor: string,
  sideColor: string
) => {
  const hw = width / 2;
  const hh = height / 2;

  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = sideColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy + hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx + hw, cy + hh * 0.7);
  ctx.lineTo(cx, cy + hh * 1.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.lineTo(cx - hw, cy + hh * 0.7);
  ctx.lineTo(cx, cy + hh * 1.7);
  ctx.closePath();
  ctx.fill();
};

const drawVillageHouse = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  depth: number,
  height: number,
  accent: string
) => {
  const roofHeight = Math.max(12, height * 0.32);
  const bodyHeight = height - roofHeight;
  const rx = x + width * 0.5;
  const ry = y - height;

  ctx.fillStyle = hexToRgba(accent, 0.65);
  ctx.beginPath();
  ctx.moveTo(rx, ry - roofHeight);
  ctx.lineTo(rx + width * 0.58, ry - roofHeight * 0.2);
  ctx.lineTo(rx, ry + roofHeight * 0.6);
  ctx.lineTo(rx - width * 0.58, ry - roofHeight * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hexToRgba("#101722", 0.95);
  ctx.beginPath();
  ctx.moveTo(rx - width * 0.48, ry + roofHeight * 0.35);
  ctx.lineTo(rx, ry + roofHeight * 0.75);
  ctx.lineTo(rx, ry + roofHeight * 0.75 + bodyHeight);
  ctx.lineTo(rx - width * 0.48, ry + roofHeight * 0.35 + bodyHeight * 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hexToRgba("#0C121C", 0.98);
  ctx.beginPath();
  ctx.moveTo(rx + width * 0.48, ry + roofHeight * 0.35);
  ctx.lineTo(rx, ry + roofHeight * 0.75);
  ctx.lineTo(rx, ry + roofHeight * 0.75 + bodyHeight);
  ctx.lineTo(rx + width * 0.48, ry + roofHeight * 0.35 + bodyHeight * 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hexToRgba("#D7EEFF", 0.72);
  ctx.fillRect(rx - 4, ry + roofHeight + bodyHeight * 0.48, 8, 12);
  ctx.fillStyle = hexToRgba(accent, 0.46);
  ctx.fillRect(rx - 10, ry + roofHeight + bodyHeight * 0.22, 20, 6);

  drawIsoDiamond(ctx, x + width * 0.5, y, width + 4, depth, hexToRgba(accent, 0.22), hexToRgba(accent, 0.1));
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
  ctx.translate(x, y + bob);

  const legSwing = Math.sin(performance.now() / 120 + x * 0.03) * 1.8;
  const facingOffset = facing === "left" ? -2 : facing === "right" ? 2 : 0;

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 13, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 8);
  ctx.lineTo(-3 + legSwing, 13);
  ctx.moveTo(3, 8);
  ctx.lineTo(3 - legSwing, 13);
  ctx.stroke();

  const torsoGradient = ctx.createLinearGradient(0, -10, 0, 8);
  torsoGradient.addColorStop(0, hexToRgba(trim, 0.8));
  torsoGradient.addColorStop(1, body);
  ctx.fillStyle = torsoGradient;
  ctx.beginPath();
  ctx.roundRect(-6, -8, 12, 16, 4);
  ctx.fill();

  ctx.fillStyle = visor;
  ctx.beginPath();
  ctx.roundRect(-4 + facingOffset * 0.2, -5, 8, 3, 2);
  ctx.fill();

  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.arc(0, -12, 5.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(accent, 0.8);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (facing === "left") {
    ctx.moveTo(-9, -4);
    ctx.lineTo(-6, -4);
  } else if (facing === "right") {
    ctx.moveTo(6, -4);
    ctx.lineTo(9, -4);
  } else if (facing === "up") {
    ctx.moveTo(-1.5, -17);
    ctx.lineTo(1.5, -17);
  } else {
    ctx.moveTo(-1.5, 12);
    ctx.lineTo(1.5, 12);
  }
  ctx.stroke();
  if (pulse > 0) {
    ctx.strokeStyle = hexToRgba(accent, 0.48);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 + pulse * 1.5, 19 + pulse * 1.8, 0, 0, Math.PI * 2);
    ctx.stroke();
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

  // Live data refs — updated by React, read by animation frame (no re-render)
  const { tickers: liveTickers, districtStates, signals, news: liveNews } = useLiveData();
  const liveTickersRef = useRef<Record<string, NeonTickerData> | null>(null);
  const districtStatesRef = useRef<Record<string, DistrictLiveState> | null>(null);
  const signalsRef = useRef<LiveSignals | null>(null);
  const liveNewsRef = useRef<typeof liveNews>(null);
  liveTickersRef.current = liveTickers ?? null;
  districtStatesRef.current = districtStates ?? null;
  signalsRef.current = signals ?? null;
  liveNewsRef.current = liveNews ?? null;
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

      // E-key near citizen: trigger citizen interaction
      const nearbyCitizen = npcRuntimeRef.current.find(
        (npc) => npc.type === "citizen" && Math.hypot(player.x - npc.x, player.y - npc.y) < 88
      ) ?? null;
      if (nearbyCitizen) {
        const defs = districtNpcDefs[nearbyCitizen.districtId];
        if (defs && defs.length > 0) {
          const citizenIdx = Math.abs(nearbyCitizen.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % defs.length;
          const def = defs[citizenIdx];
          nearbyCitizen.speechText = def.dialogues[Math.floor(Date.now() / 3000) % def.dialogues.length];
          nearbyCitizen.speechUntil = performance.now() + 3000;
          if (def.clickAction.type === "speak") {
            nearbyCitizen.speechText = def.clickAction.line;
            nearbyCitizen.speechUntil = performance.now() + 3500;
          } else if (def.clickAction.type === "reveal-rumor") {
            useNeonStore.getState().addQuestToast(def.clickAction.rumor, "rumor", nearbyCitizen.districtId);
          } else if (def.clickAction.type === "trigger-pulse") {
            useNeonStore.getState().triggerDistrictPulse(def.clickAction.districtId, "scene", 1500);
          } else if (def.clickAction.type === "start-mission") {
            const mission = districtMissions[def.clickAction.missionId];
            if (mission) {
              useNeonStore.getState().startMission(mission.id, mission.districtId, mission.steps.length);
              useNeonStore.getState().addQuestToast(`Mission: ${mission.title}`, "mission-start", mission.districtId);
            }
          } else if (def.clickAction.type === "open-panel") {
            setActiveRightPanelTab("scenes");
          }
          // Check mission progress
          const currentActiveMission = useNeonStore.getState().activeMission;
          if (currentActiveMission) {
            const mission = districtMissions[currentActiveMission.missionId];
            if (mission) {
              const result = checkMissionProgress(currentActiveMission, "npc", def.role, undefined, mission.steps);
              if (result.matched) {
                processMissionResult(result as { matched: true; advanceOrComplete: "advance" | "complete"; message: string }, {
                  districtId: mission.districtId,
                  effectType: districtActivations[mission.districtId]?.effectType ?? "glitch-surge",
                  duration: districtActivations[mission.districtId]?.duration ?? 2000,
                  primaryColor: districtActivations[mission.districtId]?.color ?? "#33F5FF",
                  secondaryColor: districtActivations[mission.districtId]?.secondaryColor ?? "#FF3DF2",
                });
              }
            }
          }
          return;
        }
      }

      // E-key near interactable: trigger interactable interaction
      const nearbyInteractable = districtInteractables.find(
        (obj) => Math.hypot(player.x - obj.x, player.y - obj.y) < 88
      ) ?? null;
      if (nearbyInteractable) {
        useNeonStore.getState().setActiveInteractableId(nearbyInteractable.id);
        const effect = nearbyInteractable.clickEffect;
        if (effect.type === "panel") {
          setWorldNewsBubble({
            id: `interactable-${nearbyInteractable.id}`,
            kind: "prop",
            anchorX: nearbyInteractable.x + nearbyInteractable.width / 2,
            anchorY: nearbyInteractable.y - nearbyInteractable.height - 12,
            title: effect.title,
            lines: effect.lines.map((text, i) => ({ id: `${nearbyInteractable.id}-line-${i}`, text })),
          });
        } else if (effect.type === "district-activate") {
          const distActivation = districtActivations[nearbyInteractable.districtId];
          if (distActivation) {
            useNeonStore.getState().activateDistrict(
              distActivation.districtId, distActivation.effectType, distActivation.duration,
              distActivation.color, distActivation.secondaryColor
            );
          }
        } else if (effect.type === "reveal") {
          useNeonStore.getState().addQuestToast(effect.message, "insight", nearbyInteractable.districtId);
        } else if (effect.type === "pulse") {
          useNeonStore.getState().triggerDistrictPulse(nearbyInteractable.districtId, "scene", 1200);
        }
        // Check mission progress
        const currentActiveMission = useNeonStore.getState().activeMission;
        if (currentActiveMission) {
          const mission = districtMissions[currentActiveMission.missionId];
          if (mission) {
            const result = checkMissionProgress(currentActiveMission, "object", undefined, nearbyInteractable.type, mission.steps);
            if (result.matched) {
              processMissionResult(result as { matched: true; advanceOrComplete: "advance" | "complete"; message: string }, {
                districtId: mission.districtId,
                effectType: districtActivations[mission.districtId]?.effectType ?? "glitch-surge",
                duration: districtActivations[mission.districtId]?.duration ?? 2000,
                primaryColor: districtActivations[mission.districtId]?.color ?? "#33F5FF",
                secondaryColor: districtActivations[mission.districtId]?.secondaryColor ?? "#FF3DF2",
              });
            }
          }
        }
        setTimeout(() => {
          if (useNeonStore.getState().activeInteractableId === nearbyInteractable.id) {
            useNeonStore.getState().setActiveInteractableId(null);
          }
        }, 2000);
        return;
      }

      // E-key near fast travel gate: teleport player
      const nearbyGate = fastTravelGates.find(
        (gate) => Math.hypot(player.x - (gate.x + gate.width / 2), player.y - (gate.y + gate.height / 2)) < 60
      ) ?? null;
      if (nearbyGate) {
        const targetDistrict = districts.find((d) => d.id === nearbyGate.targetDistrictId);
        useNeonStore.getState().fastTravel(nearbyGate.targetDistrictId);
        useNeonStore.getState().addQuestToast(
          `Traveled to ${targetDistrict?.name ?? nearbyGate.targetDistrictId}`,
          "fast-travel",
          nearbyGate.targetDistrictId,
        );
        return;
      }

      // E-key near data chip: collect it
      const storeState = useNeonStore.getState();
      const nearbyChip = dataChips.find(
        (chip) => !storeState.collectedChips.includes(chip.id) && Math.hypot(player.x - chip.x, player.y - chip.y) < 30
      ) ?? null;
      if (nearbyChip) {
        useNeonStore.getState().collectChip(nearbyChip.id, nearbyChip.insight);
        useNeonStore.getState().addQuestToast(nearbyChip.insight, "data-chip", nearbyChip.districtId);
        return;
      }

      // Newsstand E-key interaction (live news via overlay)
      const nearbyNewsstand = newsstands.find(
        (stand) => Math.hypot(player.x - stand.x, player.y - stand.y) < 104
      ) ?? null;
      if (nearbyNewsstand) {
        setActiveNewsstandDistrictId(nearbyNewsstand.districtId);
        setSelectedDistrictId(nearbyNewsstand.districtId);
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
      ctx.imageSmoothingEnabled = true;
      useNeonStore.getState().setViewport(rect.width, rect.height);
    };

    // Preload district background images
    const districtImages: Record<string, HTMLImageElement> = {};
    const districtImagesLoaded: Record<string, boolean> = {};
    const uniqueSources = [...new Set(Object.values(DISTRICT_IMAGE_MAP))];
    const sourceToImage: Record<string, HTMLImageElement> = {};
    uniqueSources.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        sourceToImage[src] = img;
        // Map to all districts using this source
        for (const [districtId, distSrc] of Object.entries(DISTRICT_IMAGE_MAP)) {
          if (distSrc === src) {
            districtImages[districtId] = img;
            districtImagesLoaded[districtId] = true;
          }
        }
      };
      sourceToImage[src] = img;
    });

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

    const drawVariantAccents = (zone: DistrictZone, x: number, y: number, theme: { floor: string; line: string; neon: string; shop: string; puddle: string; hazard: string }) => {
      if (zone.tileVariant === "energy") {
        for (let index = 0; index < 6; index += 1) {
          drawPixelRect(ctx, x + zone.streetInset + 40 + index * 48, y + zone.streetInset + 34, 24, 4, theme.hazard);
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
    };

    const drawZone = (zone: DistrictZone, district: District, time: number, cameraX: number, cameraY: number) => {
      const theme = zoneShadeByVariant[zone.tileVariant];
      const x = pixel(zone.x - cameraX);
      const y = pixel(zone.y - cameraY);

      // Off-screen culling
      if (x + zone.width + 80 < 0 || y + zone.height + 80 < 0 || x - 80 > canvas.clientWidth / (useNeonStore.getState().camera.zoom || 1) || y - 80 > canvas.clientHeight / (useNeonStore.getState().camera.zoom || 1)) {
        return;
      }

      const selected = district.id === useNeonStore.getState().selectedDistrictId;
      const pulsing = district.id === useNeonStore.getState().scenePulse.districtId;
      const intensity = pulsing ? 0.62 : selected ? 0.34 : 0.16;

      const baseGradient = ctx.createLinearGradient(x, y, x, y + zone.height);
      baseGradient.addColorStop(0, "#0F1524");
      baseGradient.addColorStop(1, "#0A1019");
      ctx.fillStyle = baseGradient;
      ctx.fillRect(x - 40, y - 40, zone.width + 80, zone.height + 80);

      drawIsoDiamond(
        ctx,
        x + zone.width / 2,
        y + zone.height / 2,
        zone.width - 12,
        zone.height - 12,
        hexToRgba(theme.floor, 0.66),
        hexToRgba(theme.floor, 0.26)
      );

      drawPixelRect(ctx, x, y, zone.width, zone.height, hexToRgba("#101928", 0.92));
      drawPixelFrame(ctx, x - 1, y - 1, zone.width + 2, zone.height + 2, hexToRgba(district.accent, 0.12 + intensity * 0.2));

      const innerX = x + zone.streetInset;
      const innerY = y + zone.streetInset;
      const innerW = zone.width - zone.streetInset * 2;
      const innerH = zone.height - zone.streetInset * 2;
      drawPixelRect(ctx, innerX, innerY, innerW, innerH, hexToRgba(theme.floor, 0.82));

      for (let row = 0; row < 5; row += 1) {
        const roadY = innerY + 24 + row * ((innerH - 48) / 4);
        ctx.strokeStyle = hexToRgba(theme.line, 0.24);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(innerX + 24, roadY);
        ctx.lineTo(innerX + innerW - 24, roadY);
        ctx.stroke();
      }

      drawPixelRect(ctx, x + zone.streetInset + 6, y + zone.streetInset + 6, zone.width - zone.streetInset * 2 - 12, 10, hexToRgba(theme.line, 0.72));
      drawPixelRect(
        ctx,
        x + zone.streetInset + 6,
        y + zone.height - zone.streetInset - 16,
        zone.width - zone.streetInset * 2 - 12,
        10,
        hexToRgba(theme.line, 0.72)
      );
      drawPixelRect(ctx, x + zone.streetInset + 6, y + zone.streetInset + 6, 10, zone.height - zone.streetInset * 2 - 12, hexToRgba(theme.line, 0.72));
      drawPixelRect(
        ctx,
        x + zone.width - zone.streetInset - 16,
        y + zone.streetInset + 6,
        10,
        zone.height - zone.streetInset * 2 - 12,
        hexToRgba(theme.line, 0.72)
      );

      drawVariantAccents(zone, x, y, theme);

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

      const topFacadeY = y + 90;
      for (let index = 0; index < 5; index += 1) {
        const buildingX = x + zone.streetInset + 34 + index * (innerW / 5);
        drawVillageHouse(ctx, buildingX, topFacadeY, 46, 18, 74 + (index % 2) * 8, district.accent);
      }

      const leftFacadeX = x + 34;
      for (let index = 0; index < 3; index += 1) {
        drawVillageHouse(ctx, leftFacadeX, y + zone.streetInset + 186 + index * 120, 38, 16, 62, district.accent);
      }

      for (let index = 0; index < 3; index += 1) {
        const buildingX = x + zone.width - zone.streetInset - 92;
        const buildingY = y + zone.streetInset + 186 + index * 120;
        drawVillageHouse(ctx, buildingX, buildingY, 38, 16, 62, district.accent);
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

      if (selected) {
        drawPixelRect(ctx, x + zone.width / 2 - 44, y + 10, 88, 6, hexToRgba(district.accent, 0.16 + intensity * 0.18));
      }
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
        drawVillageHouse(
          ctx,
          x,
          y + structure.height,
          Math.max(26, Math.min(72, structure.width * 0.9)),
          Math.max(12, Math.min(24, structure.width * 0.28)),
          Math.max(42, Math.min(98, structure.height * 1.1)),
          structure.accent
        );
      } else if (structure.kind === "fence" || structure.kind === "gate" || structure.kind === "railing") {
        const fenceGradient = ctx.createLinearGradient(x, y, x, y + structure.height);
        fenceGradient.addColorStop(0, hexToRgba(structure.accent, 0.4));
        fenceGradient.addColorStop(1, "#0B1119");
        ctx.fillStyle = fenceGradient;
        ctx.fillRect(x, y, structure.width, structure.height);
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
        case "newsstand": {
          // Vault-style stall: wider body with sign board and pillar columns
          const stallW = 70;
          const stallH = 50;
          // Main body
          drawPixelRect(ctx, screenX, screenY - stallH, stallW, stallH, "#171C28");
          // Pillar columns
          drawPixelRect(ctx, screenX, screenY - stallH, 4, stallH - 4, "#242C3A");
          drawPixelRect(ctx, screenX + stallW - 4, screenY - stallH, 4, stallH - 4, "#242C3A");
          // Sign board on top
          drawPixelRect(ctx, screenX - 2, screenY - stallH - 12, stallW + 4, 14, "#0B1017");
          drawPixelRect(ctx, screenX + 4, screenY - stallH - 10, stallW - 8, 10, hexToRgba(prop.accent, 0.32 + glow * 0.14));
          ctx.fillStyle = "#FFF5D8";
          ctx.font = "bold 9px monospace";
          ctx.fillText("NEWS", screenX + stallW / 2 - 12, screenY - stallH - 2);
          // Counter / display area
          drawPixelRect(ctx, screenX + 8, screenY - stallH + 16, stallW - 16, 14, hexToRgba(prop.accent, glow + 0.1));
          // Shelf
          drawPixelRect(ctx, screenX + 10, screenY - 10, stallW - 20, 4, "#D7EEFF");
          // Base
          drawPixelRect(ctx, screenX + 14, screenY - 2, stallW - 28, 4, "#0B0E15");
          break;
        }
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
      // Storm factor: combine scene pulse with live district weather
      const ds = districtStatesRef.current;
      const anyDistrictStorm = ds ? Object.values(ds).some((d) => d.weather === "storm") : false;
      const stormFactor = state.stormModeActive
        ? 1
        : anyDistrictStorm
          ? 0.6
          : state.scenePulse.expiresAt
            ? Math.max(0, (state.scenePulse.expiresAt - Date.now()) / Math.max(1, state.scenePulse.expiresAt - state.scenePulse.startedAt))
            : 0;

      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, width, height);

      drawBackground(time, width, height, currentCamera.x);

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
        ctx.strokeStyle = "rgba(8,12,18,0.9)";
        ctx.lineWidth = 24;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.strokeStyle = hexToRgba(index % 2 === 0 ? from.accent : to.accent, state.showAlliances ? 0.18 : 0.08);
        ctx.lineWidth = state.showAlliances ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
      });

      // --- Alliance cables from live correlations ---
      const sigs = signalsRef.current;
      if (sigs?.correlations?.top_positive) {
        const districtForSector = Object.fromEntries(districts.map((d) => [d.sector.toLowerCase(), d]));
        sigs.correlations.top_positive.forEach((pair) => {
          if (pair.r < 0.5) return;
          // Find districts for the correlated tickers
          const tickerA = liveTickersRef.current?.[pair.a.toLowerCase()];
          const tickerB = liveTickersRef.current?.[pair.b.toLowerCase()];
          if (!tickerA?.districtId || !tickerB?.districtId || tickerA.districtId === tickerB.districtId) return;
          const distA = districtsById[tickerA.districtId];
          const distB = districtsById[tickerB.districtId];
          if (!distA || !distB) return;
          const ax = distA.center.x - currentCamera.x;
          const ay = distA.center.y - currentCamera.y;
          const bx = distB.center.x - currentCamera.x;
          const by = distB.center.y - currentCamera.y;
          if ((ax < -300 && bx < -300) || (ay < -300 && by < -300) || (ax > width + 300 && bx > width + 300)) return;
          const opacity = 0.3 + (pair.r - 0.5) * 1.0; // 0.5->0.3, 1.0->0.8
          const pulse = 0.8 + Math.sin(time / 600 + pair.r * 10) * 0.2;
          ctx.strokeStyle = hexToRgba(distA.accent, opacity * pulse);
          ctx.lineWidth = 2 + pair.r * 3;
          ctx.lineCap = "round";
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      // Draw district background images (replacing procedural drawZone)
      districtZones.forEach((zone) => {
        const district = districtsById[zone.districtId];
        const x = pixel(zone.x - currentCamera.x);
        const y = pixel(zone.y - currentCamera.y);

        // Off-screen culling
        if (x + zone.width + 80 < 0 || y + zone.height + 80 < 0 || x - 80 > width || y - 80 > height) {
          return;
        }

        const selected = district.id === useNeonStore.getState().selectedDistrictId;
        const pulsing = district.id === useNeonStore.getState().scenePulse.districtId;
        // Use live glow_intensity from backend when available
        const liveGlow = ds?.[district.id]?.glow_intensity ?? 0.5;
        const baseIntensity = 0.1 + liveGlow * 0.2; // 0.1-0.3 from live data
        const intensity = pulsing ? 0.62 : selected ? 0.34 : baseIntensity;

        const img = districtImages[zone.districtId];
        if (img && districtImagesLoaded[zone.districtId]) {
          // Draw the district image scaled to fit the zone
          ctx.drawImage(img, x, y, zone.width, zone.height);

          // Selection/pulse glow overlay
          if (selected || pulsing) {
            ctx.fillStyle = hexToRgba(district.accent, intensity * 0.15);
            ctx.fillRect(x, y, zone.width, zone.height);
          }

          // Accent border frame
          ctx.strokeStyle = hexToRgba(district.accent, 0.12 + intensity * 0.2);
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, zone.width - 2, zone.height - 2);
        } else {
          // Fallback: dark rectangle while image loads
          drawPixelRect(ctx, x, y, zone.width, zone.height, "#0A1019");
          drawPixelFrame(ctx, x, y, zone.width, zone.height, hexToRgba(district.accent, 0.15));
        }
      });

      // District name labels
      if (zoom >= 0.6) {
        districtZones.forEach((zone) => {
          const district = districtsById[zone.districtId];
          const theme = districtThemes[zone.districtId];
          const labelX = district.center.x - currentCamera.x;
          const labelY = district.center.y - currentCamera.y;
          if (labelX < -200 || labelX > width + 200 || labelY < -200 || labelY > height + 200) return;
          const prevAlign = ctx.textAlign;
          ctx.textAlign = "center";
          // Label background for readability over image
          const labelText = `${theme?.icon ?? ""} ${district.name}`;
          const textWidth = ctx.measureText(labelText).width + 16;
          ctx.fillStyle = "rgba(8, 16, 25, 0.7)";
          ctx.fillRect(labelX - textWidth / 2, labelY - 20, textWidth, 36);
          ctx.font = "bold 13px monospace";
          ctx.fillStyle = hexToRgba(district.accent, 0.85);
          ctx.fillText(labelText, labelX, labelY - 8);
          ctx.font = "10px monospace";
          ctx.fillStyle = hexToRgba(district.accent, 0.55);
          ctx.fillText(district.sector, labelX, labelY + 8);
          ctx.textAlign = prevAlign;
        });
      }

      // --- District Activation Effects ---
      const activation = useNeonStore.getState().districtActivation;
      if (activation && Date.now() < activation.startedAt + activation.duration) {
        const zone = districtZones.find(z => z.districtId === activation.districtId);
        if (zone) {
          drawDistrictEffect(activation.effectType, {
            ctx, time, startTime: activation.startedAt, duration: activation.duration,
            zone: { x: zone.x, y: zone.y, width: zone.width, height: zone.height, accent: districtsById[zone.districtId]?.accent ?? "#33F5FF" },
            cameraX: currentCamera.x, cameraY: currentCamera.y,
            primaryColor: activation.primaryColor, secondaryColor: activation.secondaryColor,
          });
        }
      } else if (activation) {
        useNeonStore.getState().clearDistrictActivation();
      }

      // Old procedural surfaces/structures commented out — replaced by district images
      // districtSurfaces.forEach((surface) => {
      //   drawSurface(surface, currentCamera.x, currentCamera.y, time);
      // });

      // [...districtStructures]
      //   .sort((left, right) => left.y - right.y)
      //   .forEach((structure) => {
      //     drawStructure(structure, currentCamera.x, currentCamera.y, time);
      //   });

      // cityProps light pools disabled
      // cityProps.forEach((prop) => {
      //   if (prop.lightRadius) {
      //     const screenX = prop.x - currentCamera.x + prop.width / 2;
      //     const screenY = prop.y - currentCamera.y - (prop.type === "street-lamp" ? 28 : 8);
      //     if (screenX > -160 && screenX < width + 160 && screenY > -160 && screenY < height + 160) {
      //       drawLightPool(ctx, screenX, screenY, prop.lightRadius, prop.accent, prop.type === "street-lamp" ? 0.14 : 0.12);
      //     }
      //   }
      // });

      for (let droneIndex = 0; droneIndex < 3; droneIndex += 1) {
        const droneX = ((time * (0.11 + droneIndex * 0.03) + droneIndex * 420) % (width + 180)) - 90;
        const droneY = 92 + droneIndex * 84 + Math.sin(time / 420 + droneIndex) * 12;
        drawPixelRect(ctx, droneX, droneY, 16, 4, "#D8EEFF");
        drawPixelRect(ctx, droneX + 4, droneY - 4, 8, 4, "#33F5FF");
        drawPixelRect(ctx, droneX - 6, droneY + 1, 6, 2, "rgba(51,245,255,0.32)");
        drawPixelRect(ctx, droneX + 16, droneY + 1, 6, 2, "rgba(51,245,255,0.32)");
      }

      npcRuntimeRef.current.forEach((npc, index) => {
        // Scale citizen speed by live traffic: low=0.5x, normal=1x, heavy=1.6x, gridlock=2x
        const trafficMultiplier = npc.type === "citizen" && ds?.[npc.districtId]
          ? ({ low: 0.5, normal: 1, heavy: 1.6, gridlock: 2.0 }[ds[npc.districtId].traffic] ?? 1)
          : 1;
        // For stock NPCs, scale patrol radius by momentum (high momentum = restless)
        const liveTicker = npc.type === "stock" && npc.tickerId ? liveTickersRef.current?.[npc.tickerId] : null;
        const momentumBoost = liveTicker ? 1 + Math.abs(liveTicker.momentum ?? 0) * 2 : 1;

        if (time > npc.nextDecisionAt) {
          const effectiveRadius = npc.patrolRadius * momentumBoost;
          npc.targetX = npc.homeX + Math.cos(time / 320 + index * 1.7) * effectiveRadius;
          npc.targetY = npc.homeY + Math.sin(time / 420 + index * 1.1) * effectiveRadius;
          npc.nextDecisionAt = time + 1800 + (index % 4) * 500;
        }

        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const effectiveSpeed = npc.speed * trafficMultiplier;
        const proposedX = npc.x + dx * 0.012 * effectiveSpeed * 3.8;
        const proposedY = npc.y + dy * 0.012 * effectiveSpeed * 3.8;
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
          // For stock NPCs, prefer live news headlines over static dialogues
          const npcLive = npc.type === "stock" && npc.tickerId ? liveTickersRef.current?.[npc.tickerId] : null;
          const newsItems = liveNewsRef.current;
          const tickerObj = npc.type === "stock" && npc.tickerId ? tickers.find((t) => t.id === npc.tickerId) : null;
          const matchingNews = newsItems && tickerObj
            ? newsItems.find((n) => n.sector?.toLowerCase() === districts.find((d) => d.id === tickerObj.districtId)?.sector?.toLowerCase())
            : null;
          if (matchingNews) {
            // Show news headline as speech (truncated to 24 chars)
            npc.speechText = matchingNews.headline.length > 24 ? matchingNews.headline.slice(0, 22) + ".." : matchingNews.headline;
          } else if (npcLive) {
            // Show live mood/price as speech
            const pctStr = npcLive.changePct >= 0 ? `+${npcLive.changePct.toFixed(1)}%` : `${npcLive.changePct.toFixed(1)}%`;
            npc.speechText = `${npcLive.mood} ${pctStr}`;
          } else {
            npc.speechText = npc.dialogues[(Math.floor(time / 3000) + index) % npc.dialogues.length];
          }
          npc.speechUntil = time + 2400;
        }
        if (npc.speechUntil < time) {
          npc.speechText = null;
        }
      });

      // Props rendering
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
        if (prop.type === "newsstand") {
          const vendorX = prop.x + 50 - currentCamera.x;
          const vendorY = prop.y - currentCamera.y;
          const bob = Math.sin(time / 300) * 0.8;
          drawCharacter(ctx, vendorX, vendorY, "#2C213E", "#F8E8FF", "#0A0C12", prop.accent, "left", 0, bob);
        }
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

      // Newsstand selected marker
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

        // Live mood drives bob speed + jitter for stock NPCs
        const liveNpc = npc.type === "stock" && npc.tickerId ? liveTickersRef.current?.[npc.tickerId] : null;
        const npcMood = liveNpc?.mood ?? "calm";
        const bobSpeed = npcMood === "erratic" ? 140 : npcMood === "nervous" ? 200 : 260;
        const jitter = npcMood === "erratic" ? (Math.random() - 0.5) * 1.4 : 0;
        const bob = Math.sin(time / bobSpeed + npc.bobSeed) * 1.2 + jitter;
        if (npc.type === "stock") {
          const ticker = tickers.find((entry) => entry.id === npc.tickerId)!;
          const district = districtsById[ticker.districtId];
          const selected = ticker.id === state.selectedTickerId;
          const introPulse = introTickerIdRef.current === ticker.id ? 3 + Math.sin(time / 40) * 1.4 : selected ? 2 : 0;
          // Live mood drives aura: confident=bright, nervous=dim, erratic=flickering
          const moodAuraAlpha = npcMood === "confident" ? 0.25 : npcMood === "erratic" ? 0.12 + Math.sin(time / 80) * 0.1 : npcMood === "nervous" ? 0.08 : 0.16;
          const moodAuraSize = npcMood === "confident" ? 46 : npcMood === "nervous" ? 30 : 38;
          if (selected || introTickerIdRef.current === ticker.id) {
            drawLightPool(ctx, x, y + 10, moodAuraSize + introPulse * 5, district.accent, moodAuraAlpha);
            drawRing(ctx, x, y + 11, district.accent, introPulse);
          } else if (liveNpc) {
            // Always show a subtle aura for live-connected NPCs
            drawLightPool(ctx, x, y + 10, moodAuraSize, district.accent, moodAuraAlpha * 0.5);
          }
          // Body color: confident=accent tint, nervous=darker, erratic=flicker
          const bodyColor = selected
            ? hexToRgba(district.accent, 0.95)
            : npcMood === "confident" ? hexToRgba(district.accent, 0.5) : npcMood === "erratic" ? hexToRgba(district.accent, 0.3 + Math.sin(time / 60) * 0.15) : "#1C2638";
          drawCharacter(
            ctx,
            x,
            y,
            bodyColor,
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
          // Citizen NPC rendering with role-based enhancements
          const citizenDefs = districtNpcDefs[npc.districtId];
          const citizenIdx = citizenDefs && citizenDefs.length > 0
            ? Math.abs(npc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % citizenDefs.length
            : -1;
          const citizenDef = citizenIdx >= 0 && citizenDefs ? citizenDefs[citizenIdx] : null;

          // Subtle glow for citizens with hover prompts when player is nearby
          const citizenPlayerDist = Math.hypot(state.player.x - npc.x, state.player.y - npc.y);
          if (citizenDef && citizenPlayerDist < 100) {
            const proximityAlpha = (1 - citizenPlayerDist / 100) * 0.12;
            drawLightPool(ctx, x, y + 10, 28, citizenDef.trimColor, proximityAlpha);
          }

          const body = citizenDef ? citizenDef.bodyColor : (npc.style === "broker" ? "#22324D" : npc.style === "vendor" ? "#2C213E" : "#182433");
          const trim = citizenDef ? citizenDef.trimColor : (npc.style === "runner" ? "#E3FFFB" : "#F8E8FF");
          drawCharacter(ctx, x, y, body, trim, "#0A0C12", npc.color, npc.facing, 0, bob);

          // Show role-based hover prompt text when player is within 100px
          if (citizenDef && citizenPlayerDist < 100) {
            const promptAlpha = (1 - citizenPlayerDist / 100) * 0.7;
            ctx.save();
            ctx.globalAlpha = promptAlpha;
            ctx.fillStyle = "#081019";
            const promptText = citizenDef.hoverPrompt;
            const promptW = promptText.length * 5.5 + 12;
            ctx.fillRect(x - promptW / 2, y - 62, promptW, 12);
            ctx.strokeStyle = hexToRgba(citizenDef.trimColor, 0.4);
            ctx.lineWidth = 1;
            ctx.strokeRect(x - promptW / 2, y - 62, promptW, 12);
            ctx.fillStyle = "#F6FBFF";
            ctx.font = "bold 7px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(promptText, x, y - 56);
            ctx.textAlign = "start";
            ctx.restore();
          }
        }

        if (npc.speechText) {
          drawPixelRect(ctx, x - 34, y - 48, 68, 16, "#081019");
          drawPixelFrame(ctx, x - 34, y - 48, 68, 16, hexToRgba(npc.color, 0.3));
          ctx.fillStyle = "#F6FBFF";
          ctx.font = "bold 8px monospace";
          ctx.fillText(npc.speechText, x - 30, y - 37);
        }
      });

      // --- Interactable Objects Rendering ---
      const activeInteractId = useNeonStore.getState().activeInteractableId;
      districtInteractables.forEach((obj) => {
        const sx = obj.x - currentCamera.x;
        const sy = obj.y - currentCamera.y;
        // Off-screen cull
        if (sx + obj.width < -80 || sx > width + 80 || sy + obj.height < -80 || sy > height + 80) return;
        const playerDist = Math.hypot(state.player.x - obj.x, state.player.y - obj.y);
        const glowPulse = (Math.sin(time * 0.003) + 1) * 0.5;
        drawInteractable(ctx, {
          type: obj.type,
          x: sx,
          y: sy,
          width: obj.width,
          height: obj.height,
          accent: obj.accent,
          label: obj.label,
          isHovered: playerDist < 100,
          isActive: activeInteractId === obj.id,
          glowIntensity: glowPulse * (playerDist < 100 ? 1 : 0.4),
        }, time);
      });

      // --- Fast Travel Gates ---
      for (const gate of fastTravelGates) {
        const gx = gate.x - currentCamera.x;
        const gy = gate.y - currentCamera.y;
        // Off-screen cull
        if (gx + gate.width < -60 || gx > width + 60 || gy + gate.height < -60 || gy > height + 60) continue;

        const playerDist = Math.hypot(state.player.x - gate.x, state.player.y - gate.y);
        const pulse = (Math.sin(time * 0.004) + 1) * 0.5;

        // Draw arch base
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(gx, gy + gate.height);
        ctx.lineTo(gx, gy + 6);
        ctx.quadraticCurveTo(gx + gate.width / 2, gy - 10, gx + gate.width, gy + 6);
        ctx.lineTo(gx + gate.width, gy + gate.height);
        ctx.strokeStyle = gate.accent;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = gate.accent;
        ctx.shadowBlur = 8 + pulse * 8;
        ctx.stroke();

        // Scanner beam inside arch
        const beamY = gy + 6 + ((time * 0.02) % (gate.height - 6));
        ctx.beginPath();
        ctx.moveTo(gx + 3, beamY);
        ctx.lineTo(gx + gate.width - 3, beamY);
        ctx.strokeStyle = gate.accent;
        ctx.globalAlpha = 0.3 + pulse * 0.4;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Show label when player is nearby
        if (playerDist < 100) {
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = gate.accent;
          ctx.shadowColor = gate.accent;
          ctx.shadowBlur = 6;
          ctx.fillText("FAST TRAVEL", gx + gate.width / 2, gy - 6);
          ctx.font = "7px monospace";
          ctx.fillStyle = "#fff";
          ctx.shadowBlur = 0;
          ctx.fillText(gate.label, gx + gate.width / 2, gy - 16);
          // E-key prompt
          ctx.fillStyle = gate.accent;
          ctx.fillText("[E]", gx + gate.width / 2, gy + gate.height + 12);
        }
        ctx.restore();
      }

      // --- Data Chips ---
      const collectedChips = useNeonStore.getState().collectedChips;
      for (const chip of dataChips) {
        if (collectedChips.includes(chip.id)) continue;

        const cx = chip.x - currentCamera.x;
        const cy = chip.y - currentCamera.y;
        // Off-screen cull
        if (cx < -20 || cx > width + 20 || cy < -20 || cy > height + 20) continue;

        // Floating animation
        const floatOffset = Math.sin(time * 0.003 + chip.x * 0.01) * 4;
        const drawY = cy + floatOffset;
        const chipPulse = (Math.sin(time * 0.005 + chip.y * 0.02) + 1) * 0.5;

        // Find district accent for glow color
        const chipDistrict = districts.find(d => d.id === chip.districtId);
        const chipAccent = chipDistrict?.accent ?? "#33F5FF";

        ctx.save();
        // Diamond shape (10x10)
        ctx.beginPath();
        ctx.moveTo(cx, drawY - 5);
        ctx.lineTo(cx + 5, drawY);
        ctx.lineTo(cx, drawY + 5);
        ctx.lineTo(cx - 5, drawY);
        ctx.closePath();

        ctx.fillStyle = chipAccent;
        ctx.shadowColor = chipAccent;
        ctx.shadowBlur = 6 + chipPulse * 10;
        ctx.globalAlpha = 0.7 + chipPulse * 0.3;
        ctx.fill();

        // Inner highlight
        ctx.beginPath();
        ctx.moveTo(cx, drawY - 2.5);
        ctx.lineTo(cx + 2.5, drawY);
        ctx.lineTo(cx, drawY + 2.5);
        ctx.lineTo(cx - 2.5, drawY);
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.5 + chipPulse * 0.3;
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // --- Ambient Effects ---
      const districtCentersMap = Object.fromEntries(districts.map(d => [d.id, { x: d.center.x, y: d.center.y }]));
      drawFloatingHolograms(ctx, time, null, currentCamera.x, currentCamera.y, width, height);
      drawSteamVents(ctx, time, currentCamera.x, currentCamera.y, width, height);
      drawBlinkingSigns(ctx, time, currentCamera.x, currentCamera.y, width, height);
      drawCourierDrones(ctx, time, districtConnections, districtCentersMap, currentCamera.x, currentCamera.y, width, height);
      drawAmbientSpeechBubbles(ctx, time, currentCamera.x, currentCamera.y, width, height);

      // --- Hover Prompts ---
      const hoverTargets: HoverPromptTarget[] = [];
      // Add nearby interactables
      districtInteractables.forEach(obj => {
        if (Math.hypot(state.player.x - obj.x, state.player.y - obj.y) < 140) {
          hoverTargets.push({ x: obj.x, y: obj.y, label: obj.hoverLabel, accent: obj.accent, kind: "object" });
        }
      });
      // Add nearby citizens with hover prompts from district NPC defs
      npcRuntimeRef.current.forEach(npc => {
        if (npc.type === "citizen" && Math.hypot(state.player.x - npc.x, state.player.y - npc.y) < 140) {
          const defs = districtNpcDefs[npc.districtId];
          if (defs && defs.length > 0) {
            // Pick a def based on NPC index hash
            const citizenIdx = Math.abs(npc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % defs.length;
            const def = defs[citizenIdx];
            hoverTargets.push({ x: npc.x, y: npc.y, label: def.hoverPrompt, accent: def.trimColor, kind: "npc" });
          }
        }
      });
      drawHoverPrompts(ctx, time, hoverTargets, state.player.x, state.player.y, currentCamera.x, currentCamera.y, width, height);

      // --- Mission Indicator ---
      drawMissionIndicator(ctx, useNeonStore.getState().activeMission, currentCamera.x, currentCamera.y, districtCentersMap, time);

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

      // === Pet Sentinel Drone (Neon Sentinel) ===
      // Determine player's current district for color matching
      const playerDistrict = hitTestDistrict(state.player.x, state.player.y, districts);
      const droneAccent = playerDistrict?.accent ?? "#33F5FF";
      const playerDistrictState = playerDistrict && ds ? ds[playerDistrict.id] : null;
      // Drone state: glitch in storms, alert in choppy/rain, calm otherwise
      const droneMode: "calm" | "alert" | "glitch" =
        playerDistrictState?.weather === "storm" || state.stormModeActive ? "glitch" :
        playerDistrictState?.weather === "rain" || playerDistrictState?.mood === "tense" ? "alert" : "calm";
      const glitchOffset = droneMode === "glitch" ? (Math.random() - 0.5) * 3 : 0;
      const alertPulse = droneMode === "alert" ? 0.5 + Math.sin(time / 150) * 0.3 : 0;

      const guideX = state.player.x - currentCamera.x + 34 + glitchOffset;
      const guideY = state.player.y - currentCamera.y - 22 + Math.sin(time / 220) * 2;
      // Glow color matches district
      const glowAlpha = droneMode === "glitch" ? 0.15 + Math.sin(time / 80) * 0.1 : guide.speaking ? 0.2 : 0.1;
      drawLightPool(ctx, guideX, guideY + 16, droneMode === "alert" ? 32 : 28, droneAccent, glowAlpha);
      // Body
      const bodyColor = droneMode === "glitch" ? hexToRgba(droneAccent, 0.5 + Math.sin(time / 60) * 0.3) : "#081019";
      drawPixelRect(ctx, guideX - 8, guideY - 16, 16, 16, bodyColor);
      const frameAlpha = droneMode === "glitch" ? 0.6 + Math.sin(time / 40) * 0.3 : guide.speaking ? 0.7 : 0.32;
      drawPixelFrame(ctx, guideX - 8, guideY - 16, 16, 16, hexToRgba(droneAccent, frameAlpha));
      drawPixelRect(ctx, guideX - 5, guideY - 13, 10, 4, "#DFFAFF");
      drawPixelRect(ctx, guideX - 6, guideY - 8, 12, 8, droneMode === "glitch" ? hexToRgba(droneAccent, 0.4) : guide.speaking ? "#16374A" : "#102232");
      drawPixelRect(ctx, guideX - 3, guideY - 6, 6, 2, droneAccent);
      drawPixelRect(ctx, guideX - 2, guideY + 1, 4, 4, droneAccent);
      drawPixelRect(ctx, guideX - 1, guideY + 5, 2, 6, droneAccent);
      // Alert ring for alert mode
      if (droneMode === "alert") {
        drawRing(ctx, guideX, guideY, droneAccent, alertPulse);
      }

      // Drone metaphor translation bubble
      const droneBubble = (() => {
        if (!playerDistrictState) return null;
        if (playerDistrictState.weather === "storm") return "Volatility spiking\u2014stay sharp!";
        if (playerDistrictState.weather === "rain") return "Choppy\u2014moderate risk ahead.";
        if (playerDistrictState.traffic === "low") return "Thin liquidity\u2014spreads wide.";
        if (playerDistrictState.traffic === "gridlock") return "Deep liquidity\u2014tight spreads.";
        if (playerDistrictState.mood === "panic") return "Market fear\u2014possible selloff.";
        if (playerDistrictState.mood === "euphoric") return "Euphoria\u2014watch for reversal.";
        return null;
      })();
      // Show bubble briefly on state change (every ~5 seconds)
      if (droneBubble && Math.floor(time / 5000) % 3 === 0) {
        const bubbleW = Math.min(droneBubble.length * 5.5 + 12, 160);
        drawPixelRect(ctx, guideX - bubbleW / 2, guideY - 36, bubbleW, 14, "#081019");
        drawPixelFrame(ctx, guideX - bubbleW / 2, guideY - 36, bubbleW, 14, hexToRgba(droneAccent, 0.4));
        ctx.fillStyle = "#F6FBFF";
        ctx.font = "bold 7px monospace";
        ctx.textAlign = "center";
        ctx.fillText(droneBubble.slice(0, 28), guideX, guideY - 27);
        ctx.textAlign = "start";
      }

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
      // Scale rain density by live weather data
      const weatherStorms = ds ? Object.values(ds).filter((d) => d.weather === "storm").length : 0;
      const weatherRain = ds ? Object.values(ds).filter((d) => d.weather === "rain").length : 0;
      const weatherBoost = weatherStorms * 20 + weatherRain * 8;
      const rainCount = Math.min(stormFactor > 0 ? 120 + weatherBoost : 48 + weatherBoost, rainDropsRef.current.length);
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

    // --- Citizen Click Interaction ---
    const citizenRuntime = npcRuntimeRef.current.find(
      npc => npc.type === "citizen" && Math.hypot(world.x - npc.x, world.y - npc.y) <= 20
    );
    if (citizenRuntime) {
      const defs = districtNpcDefs[citizenRuntime.districtId];
      if (defs && defs.length > 0) {
        const citizenIdx = Math.abs(citizenRuntime.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % defs.length;
        const def = defs[citizenIdx];
        // Show speech bubble
        citizenRuntime.speechText = def.dialogues[Math.floor(Date.now() / 3000) % def.dialogues.length];
        citizenRuntime.speechUntil = performance.now() + 3000;
        // Process click action
        if (def.clickAction.type === "speak") {
          citizenRuntime.speechText = def.clickAction.line;
          citizenRuntime.speechUntil = performance.now() + 3500;
        } else if (def.clickAction.type === "reveal-rumor") {
          useNeonStore.getState().addQuestToast(def.clickAction.rumor, "rumor", citizenRuntime.districtId);
        } else if (def.clickAction.type === "trigger-pulse") {
          useNeonStore.getState().triggerDistrictPulse(def.clickAction.districtId, "scene", 1500);
        } else if (def.clickAction.type === "start-mission") {
          const mission = districtMissions[def.clickAction.missionId];
          if (mission) {
            useNeonStore.getState().startMission(mission.id, mission.districtId, mission.steps.length);
            useNeonStore.getState().addQuestToast(`Mission: ${mission.title}`, "mission-start", mission.districtId);
          }
        } else if (def.clickAction.type === "open-panel") {
          useNeonStore.getState().setActiveRightPanelTab("scenes");
        }
        // Show interaction bubble
        showBubble(citizenRuntime.id, def.hoverPrompt, citizenRuntime.x, citizenRuntime.y - 30);

        // Check mission progress
        const currentActiveMission = useNeonStore.getState().activeMission;
        if (currentActiveMission) {
          const mission = districtMissions[currentActiveMission.missionId];
          if (mission) {
            const result = checkMissionProgress(currentActiveMission, "npc", def.role, undefined, mission.steps);
            if (result.matched) {
              processMissionResult(result as { matched: true; advanceOrComplete: "advance" | "complete"; message: string }, {
                districtId: mission.districtId,
                effectType: districtActivations[mission.districtId]?.effectType ?? "glitch-surge",
                duration: districtActivations[mission.districtId]?.duration ?? 2000,
                primaryColor: districtActivations[mission.districtId]?.color ?? "#33F5FF",
                secondaryColor: districtActivations[mission.districtId]?.secondaryColor ?? "#FF3DF2",
              });
            }
          }
        }
        return;
      }
    }

    // --- Interactable Click Handling ---
    const clickedInteractable = districtInteractables.find(
      obj => world.x >= obj.x && world.x <= obj.x + obj.width && world.y >= obj.y - obj.height && world.y <= obj.y + 8
    );
    if (clickedInteractable) {
      useNeonStore.getState().setActiveInteractableId(clickedInteractable.id);
      showBubble(clickedInteractable.id, clickedInteractable.dialogueOnClick, clickedInteractable.x, clickedInteractable.y - clickedInteractable.height - 14);

      // Handle click effect
      const effect = clickedInteractable.clickEffect;
      if (effect.type === "panel") {
        setWorldNewsBubble({
          id: `interactable-${clickedInteractable.id}`,
          kind: "prop",
          anchorX: clickedInteractable.x + clickedInteractable.width / 2,
          anchorY: clickedInteractable.y - clickedInteractable.height - 12,
          title: effect.title,
          lines: effect.lines.map((text, i) => ({ id: `${clickedInteractable.id}-line-${i}`, text })),
        });
      } else if (effect.type === "district-activate") {
        const distActivation = districtActivations[clickedInteractable.districtId];
        if (distActivation) {
          useNeonStore.getState().activateDistrict(
            distActivation.districtId, distActivation.effectType, distActivation.duration,
            distActivation.color, distActivation.secondaryColor
          );
        }
      } else if (effect.type === "reveal") {
        useNeonStore.getState().addQuestToast(effect.message, "insight", clickedInteractable.districtId);
      } else if (effect.type === "pulse") {
        useNeonStore.getState().triggerDistrictPulse(clickedInteractable.districtId, "scene", 1200);
      }

      // Check mission progress
      const currentActiveMission = useNeonStore.getState().activeMission;
      if (currentActiveMission) {
        const mission = districtMissions[currentActiveMission.missionId];
        if (mission) {
          const result = checkMissionProgress(currentActiveMission, "object", undefined, clickedInteractable.type, mission.steps);
          if (result.matched) {
            processMissionResult(result as { matched: true; advanceOrComplete: "advance" | "complete"; message: string }, {
              districtId: mission.districtId,
              effectType: districtActivations[mission.districtId]?.effectType ?? "glitch-surge",
              duration: districtActivations[mission.districtId]?.duration ?? 2000,
              primaryColor: districtActivations[mission.districtId]?.color ?? "#33F5FF",
              secondaryColor: districtActivations[mission.districtId]?.secondaryColor ?? "#FF3DF2",
            });
          }
        }
      }

      // Clear after 2 seconds
      setTimeout(() => {
        if (useNeonStore.getState().activeInteractableId === clickedInteractable.id) {
          useNeonStore.getState().setActiveInteractableId(null);
        }
      }, 2000);
      return;
    }

    // --- Fast Travel Gate Click ---
    const clickedGate = fastTravelGates.find(
      (gate) => world.x >= gate.x && world.x <= gate.x + gate.width && world.y >= gate.y && world.y <= gate.y + gate.height
    );
    if (clickedGate) {
      const targetDistrict = districts.find((d) => d.id === clickedGate.targetDistrictId);
      useNeonStore.getState().fastTravel(clickedGate.targetDistrictId);
      useNeonStore.getState().addQuestToast(
        `Traveled to ${targetDistrict?.name ?? clickedGate.targetDistrictId}`,
        "fast-travel",
        clickedGate.targetDistrictId,
      );
      return;
    }

    // --- Data Chip Click ---
    const clickStoreState = useNeonStore.getState();
    const clickedChip = dataChips.find(
      (chip) => !clickStoreState.collectedChips.includes(chip.id) && Math.hypot(world.x - chip.x, world.y - chip.y) < 15
    );
    if (clickedChip) {
      useNeonStore.getState().collectChip(clickedChip.id, clickedChip.insight);
      useNeonStore.getState().addQuestToast(clickedChip.insight, "data-chip", clickedChip.districtId);
      return;
    }

    const district = hitTestDistrict(world.x, world.y, districts);
    if (district) {
      setSelectedDistrictId(district.id);
      setPluginPrompt(null);
      // Trigger district activation effect
      const distActivation = districtActivations[district.id];
      if (distActivation) {
        useNeonStore.getState().activateDistrict(
          distActivation.districtId, distActivation.effectType, distActivation.duration,
          distActivation.color, distActivation.secondaryColor
        );
      }
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className={cn("h-full w-full touch-none bg-transparent", controls.isDragging ? "cursor-grabbing" : "cursor-grab")}
        aria-label="Living district village city map"
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
