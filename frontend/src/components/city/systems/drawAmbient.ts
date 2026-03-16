/**
 * drawAmbient.ts — Pure canvas drawing functions for ambient city effects.
 * Called from CityCanvas.tsx's draw loop each frame.
 * All functions accept camera/viewport for off-screen culling.
 */

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type AmbientDistrict = {
  id: string;
  centerX: number;
  centerY: number;
  accent: string;
  symbol: string;
};

const AMBIENT_DISTRICTS: AmbientDistrict[] = [
  { id: "chip-docks", centerX: 630, centerY: 570, accent: "#33F5FF", symbol: "◈" },
  { id: "bank-towers", centerX: 1590, centerY: 570, accent: "#FFB84D", symbol: "$" },
  { id: "energy-yard", centerX: 2610, centerY: 570, accent: "#B7FF3C", symbol: "⚡" },
  { id: "crypto-alley", centerX: 3670, centerY: 570, accent: "#33F5FF", symbol: "₿" },
  { id: "industrials-foundry", centerX: 660, centerY: 1450, accent: "#7DD3FC", symbol: "⚙" },
  { id: "consumer-strip", centerX: 1760, centerY: 1450, accent: "#FF3DF2", symbol: "♦" },
  { id: "bio-dome", centerX: 2860, centerY: 1450, accent: "#B7FF3C", symbol: "◎" },
  { id: "comms-neon-ridge", centerX: 3920, centerY: 1450, accent: "#FF3DF2", symbol: "◇" },
];

// Vent world positions (seeded, not random)
const STEAM_VENTS: ReadonlyArray<{ x: number; y: number }> = [
  // Industrials-foundry
  { x: 580, y: 1400 },
  { x: 640, y: 1480 },
  { x: 720, y: 1390 },
  { x: 700, y: 1510 },
  // Energy-yard
  { x: 2540, y: 520 },
  { x: 2660, y: 540 },
  { x: 2580, y: 610 },
];

// Pre-defined blinking signs (2 per district = 16 total)
const BLINKING_SIGNS: ReadonlyArray<{
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  flickerSpeed: number;
}> = [
  // chip-docks
  { x: 510, y: 490, width: 60, height: 14, text: "CHIPS", color: "#33F5FF", flickerSpeed: 1.7 },
  { x: 740, y: 640, width: 52, height: 14, text: "DATA", color: "#33F5FF", flickerSpeed: 2.3 },
  // bank-towers
  { x: 1470, y: 500, width: 56, height: 14, text: "VAULT", color: "#FFB84D", flickerSpeed: 1.4 },
  { x: 1700, y: 640, width: 60, height: 14, text: "BONDS", color: "#FFB84D", flickerSpeed: 2.8 },
  // energy-yard
  { x: 2500, y: 490, width: 48, height: 14, text: "FUEL", color: "#B7FF3C", flickerSpeed: 1.1 },
  { x: 2720, y: 630, width: 56, height: 14, text: "POWER", color: "#B7FF3C", flickerSpeed: 3.1 },
  // crypto-alley
  { x: 3560, y: 510, width: 60, height: 14, text: "CHAIN", color: "#33F5FF", flickerSpeed: 0.9 },
  { x: 3780, y: 620, width: 52, height: 14, text: "HASH", color: "#33F5FF", flickerSpeed: 2.0 },
  // industrials-foundry
  { x: 550, y: 1380, width: 56, height: 14, text: "FORGE", color: "#7DD3FC", flickerSpeed: 1.6 },
  { x: 770, y: 1520, width: 52, height: 14, text: "IRON", color: "#7DD3FC", flickerSpeed: 2.5 },
  // consumer-strip
  { x: 1640, y: 1380, width: 48, height: 14, text: "SHOP", color: "#FF3DF2", flickerSpeed: 1.2 },
  { x: 1880, y: 1520, width: 52, height: 14, text: "NEON", color: "#FF3DF2", flickerSpeed: 2.7 },
  // bio-dome
  { x: 2740, y: 1370, width: 48, height: 14, text: "GENE", color: "#B7FF3C", flickerSpeed: 1.8 },
  { x: 2970, y: 1530, width: 44, height: 14, text: "LAB", color: "#B7FF3C", flickerSpeed: 3.3 },
  // comms-neon-ridge
  { x: 3800, y: 1380, width: 56, height: 14, text: "RELAY", color: "#FF3DF2", flickerSpeed: 1.5 },
  { x: 4040, y: 1510, width: 52, height: 14, text: "WAVE", color: "#FF3DF2", flickerSpeed: 2.1 },
];

// Speech bubble phrases and seeded positions within districts
const SPEECH_PHRASES = [
  "Buy!", "Sell!", "Hold...", "Trending!", "FOMO!", "Bearish.",
  "Moon?", "Dip!", "Rally!", "Short it!", "Bullish!", "Hedge.",
];

const SPEECH_ANCHORS: ReadonlyArray<{ x: number; y: number; color: string }> = [
  { x: 600, y: 550, color: "#33F5FF" },
  { x: 1620, y: 590, color: "#FFB84D" },
  { x: 2650, y: 550, color: "#B7FF3C" },
  { x: 3700, y: 580, color: "#33F5FF" },
  { x: 690, y: 1470, color: "#7DD3FC" },
  { x: 1800, y: 1430, color: "#FF3DF2" },
  { x: 2900, y: 1460, color: "#B7FF3C" },
  { x: 3950, y: 1440, color: "#FF3DF2" },
];

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

const pixel = (v: number): number => Math.round(v);

const hexToRgba = (hex: string, alpha: number): string => {
  const raw = hex.replace("#", "");
  const norm =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : raw;
  const n = Number.parseInt(norm, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** Returns true when a world-space rect is outside the visible viewport. */
const isOffScreen = (
  wx: number,
  wy: number,
  w: number,
  h: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
  margin = 80,
): boolean => {
  const sx = wx - camX;
  const sy = wy - camY;
  return sx + w < -margin || sx > vw + margin || sy + h < -margin || sy > vh + margin;
};

// ---------------------------------------------------------------------------
// 1. Floating holograms
// ---------------------------------------------------------------------------

export function drawFloatingHolograms(
  ctx: CanvasRenderingContext2D,
  time: number,
  _districts: unknown, // kept for caller compat; we use AMBIENT_DISTRICTS
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
): void {
  const symbolSize = 22;

  for (let i = 0; i < AMBIENT_DISTRICTS.length; i++) {
    const d = AMBIENT_DISTRICTS[i];

    // Off-screen cull (generous margin because glow can be wide)
    if (isOffScreen(d.centerX - 30, d.centerY - 60, 60, 60, cameraX, cameraY, viewWidth, viewHeight, 100)) {
      continue;
    }

    const floatY = Math.sin(time * 0.001 + i * 1.3) * 8;
    const alpha = 0.15 + 0.1 * (0.5 + 0.5 * Math.sin(time * 0.0015 + i * 0.9));

    const sx = pixel(d.centerX - cameraX);
    const sy = pixel(d.centerY - 40 + floatY - cameraY);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow
    ctx.shadowColor = d.accent;
    ctx.shadowBlur = 12;

    // Slow rotation via transform
    const angle = (time * 0.0003 + i * 0.8) % (Math.PI * 2);
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    ctx.font = `${symbolSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = d.accent;
    ctx.fillText(d.symbol, 0, 0);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 2. Steam vents
// ---------------------------------------------------------------------------

/** Number of steam particles per vent, recycled via modulo. */
const PARTICLES_PER_VENT = 6;
const PARTICLE_CYCLE_MS = 3000;

export function drawSteamVents(
  ctx: CanvasRenderingContext2D,
  time: number,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
): void {
  for (let v = 0; v < STEAM_VENTS.length; v++) {
    const vent = STEAM_VENTS[v];

    if (isOffScreen(vent.x - 20, vent.y - 60, 40, 80, cameraX, cameraY, viewWidth, viewHeight)) {
      continue;
    }

    ctx.save();

    for (let p = 0; p < PARTICLES_PER_VENT; p++) {
      // Stagger each particle within the cycle
      const offset = (p / PARTICLES_PER_VENT) * PARTICLE_CYCLE_MS;
      const t = ((time + offset + v * 743) % PARTICLE_CYCLE_MS) / PARTICLE_CYCLE_MS; // 0..1

      // Rise from vent upward
      const riseY = t * 50;
      // Slight horizontal drift using a seeded sin
      const driftX = Math.sin(t * Math.PI * 2 + v * 1.7 + p * 0.5) * 6;

      const alpha = (1 - t) * 0.35; // fade as it rises
      const w = 3 + t * 2;
      const h = 2 + t * 1;

      const sx = pixel(vent.x + driftX - cameraX - w / 2);
      const sy = pixel(vent.y - riseY - cameraY - h / 2);

      ctx.fillStyle = hexToRgba("#C8D6E5", alpha);
      ctx.fillRect(sx, sy, pixel(w), pixel(h));
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 3. Blinking signs
// ---------------------------------------------------------------------------

export function drawBlinkingSigns(
  ctx: CanvasRenderingContext2D,
  time: number,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
): void {
  for (let i = 0; i < BLINKING_SIGNS.length; i++) {
    const sign = BLINKING_SIGNS[i];

    if (isOffScreen(sign.x, sign.y, sign.width, sign.height, cameraX, cameraY, viewWidth, viewHeight)) {
      continue;
    }

    // Flicker alpha: base 0.6 + sin wave, with occasional glitch-off
    const wave = Math.sin(time * 0.001 * sign.flickerSpeed + i * 2.1);
    const glitch = Math.sin(time * 0.017 + i * 13.7);
    const isGlitchOff = glitch > 0.92; // ~4 % of the time fully off

    const alpha = isGlitchOff ? 0 : 0.55 + wave * 0.3;

    if (alpha <= 0) continue;

    const sx = pixel(sign.x - cameraX);
    const sy = pixel(sign.y - cameraY);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = hexToRgba(sign.color, 0.12);
    ctx.fillRect(sx, sy, sign.width, sign.height);

    // Border
    ctx.strokeStyle = sign.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, sign.width - 1, sign.height - 1);

    // Text
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = sign.color;
    ctx.shadowColor = sign.color;
    ctx.shadowBlur = 6;
    ctx.fillText(sign.text, sx + sign.width / 2, sy + sign.height / 2);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 4. Courier drones
// ---------------------------------------------------------------------------

export function drawCourierDrones(
  ctx: CanvasRenderingContext2D,
  time: number,
  districtConnections: ReadonlyArray<[string, string]>,
  districtCenters: Readonly<Record<string, { x: number; y: number }>>,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
): void {
  const bodyW = 12;
  const bodyH = 4;
  const wingW = 6;
  const wingH = 2;

  for (let c = 0; c < districtConnections.length; c++) {
    const [idA, idB] = districtConnections[c];
    const a = districtCenters[idA];
    const b = districtCenters[idB];
    if (!a || !b) continue;

    // Ping-pong t: 0 → 1 → 0, cycle ~8 s, stagger per connection
    const cycle = 8000;
    const raw = ((time + c * 1117) % cycle) / cycle; // 0..1
    const t = raw < 0.5 ? raw * 2 : 2 - raw * 2; // ping-pong

    const wx = a.x + (b.x - a.x) * t;
    const wy = a.y + (b.y - a.y) * t;

    if (isOffScreen(wx - 10, wy - 10, 20, 20, cameraX, cameraY, viewWidth, viewHeight)) {
      continue;
    }

    const sx = pixel(wx - cameraX);
    const sy = pixel(wy - cameraY);

    ctx.save();

    // Glow trail (small elongated rect behind drone)
    const trailAlpha = 0.2;
    ctx.fillStyle = hexToRgba("#33F5FF", trailAlpha);
    ctx.fillRect(sx - 8, sy + 1, 6, 2);

    // Body
    ctx.fillStyle = "#1A2A3A";
    ctx.fillRect(sx - bodyW / 2, sy - bodyH / 2, bodyW, bodyH);

    // Wings (top)
    ctx.fillStyle = hexToRgba("#33F5FF", 0.6);
    ctx.fillRect(sx - bodyW / 2 - wingW, sy - bodyH / 2 - wingH, wingW, wingH);
    ctx.fillRect(sx + bodyW / 2, sy - bodyH / 2 - wingH, wingW, wingH);

    // LED dot center
    ctx.fillStyle = "#33F5FF";
    ctx.fillRect(sx - 1, sy - 1, 2, 2);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 5. Ambient speech bubbles
// ---------------------------------------------------------------------------

/** Max bubbles visible at once across the whole map. */
const MAX_BUBBLES = 4;
/** Duration each bubble is visible (ms). */
const BUBBLE_DURATION = 2000;
/** Gap between successive bubble spawns (ms). */
const BUBBLE_GAP = 2800;

export function drawAmbientSpeechBubbles(
  ctx: CanvasRenderingContext2D,
  time: number,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
): void {
  for (let i = 0; i < MAX_BUBBLES; i++) {
    // Stagger each slot
    const slotStart = i * BUBBLE_GAP;
    const totalCycle = MAX_BUBBLES * BUBBLE_GAP + BUBBLE_DURATION;
    const localTime = ((time + slotStart) % totalCycle);

    // Bubble is only visible during [0, BUBBLE_DURATION]
    if (localTime > BUBBLE_DURATION) continue;

    const progress = localTime / BUBBLE_DURATION; // 0..1

    // Pick anchor & phrase deterministically based on slot + cycle index
    const cycleIndex = Math.floor((time + slotStart) / totalCycle);
    const anchorIdx = (i + cycleIndex * 3) % SPEECH_ANCHORS.length;
    const phraseIdx = (i + cycleIndex * 7) % SPEECH_PHRASES.length;

    const anchor = SPEECH_ANCHORS[anchorIdx];
    const phrase = SPEECH_PHRASES[phraseIdx];

    // Fade in first 20 %, fade out last 20 %
    let alpha: number;
    if (progress < 0.2) {
      alpha = progress / 0.2;
    } else if (progress > 0.8) {
      alpha = (1 - progress) / 0.2;
    } else {
      alpha = 1;
    }
    alpha *= 0.8; // cap max

    // Slight float upward
    const floatY = -progress * 10;

    const textWidth = phrase.length * 6 + 8; // approximate 6px per char + padding
    const boxW = textWidth;
    const boxH = 14;

    const wx = anchor.x;
    const wy = anchor.y + floatY;

    if (isOffScreen(wx - boxW / 2, wy - boxH, boxW, boxH, cameraX, cameraY, viewWidth, viewHeight)) {
      continue;
    }

    const sx = pixel(wx - cameraX - boxW / 2);
    const sy = pixel(wy - cameraY - boxH);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Background
    ctx.fillStyle = hexToRgba("#081019", 0.85);
    ctx.fillRect(sx, sy, boxW, boxH);

    // Border
    ctx.strokeStyle = anchor.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, boxW - 1, boxH - 1);

    // Text
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = anchor.color;
    ctx.fillText(phrase, sx + boxW / 2, sy + boxH / 2);

    ctx.restore();
  }
}
