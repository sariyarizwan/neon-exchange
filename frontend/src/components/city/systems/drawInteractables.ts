// ---------------------------------------------------------------------------
// drawInteractables.ts – Pixel-art interactive world objects for the canvas
// ---------------------------------------------------------------------------

export type InteractableRenderData = {
  type: string; // "terminal", "scanner", "news-board", etc.
  x: number; // screen x (already camera-adjusted)
  y: number; // screen y (already camera-adjusted)
  width: number;
  height: number;
  accent: string;
  label: string;
  isHovered: boolean;
  isActive: boolean; // currently being interacted with
  glowIntensity: number; // 0–1, pulsing
};

// ── helpers ----------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function px(v: number): number {
  return Math.round(v);
}

/** Draw a filled rect at pixel-perfect coords. */
function fillBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(px(x), px(y), px(w), px(h));
}

/** Draw a stroked rect at pixel-perfect coords. */
function strokeBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lineWidth: number = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(px(x), px(y), px(w), px(h));
}

// ── shared hover/active effects -------------------------------------------

function drawHoverGlow(
  ctx: CanvasRenderingContext2D,
  data: InteractableRenderData,
): void {
  if (!data.isHovered) return;
  const cx = px(data.x + data.width / 2);
  const cy = px(data.y + data.height / 2);
  const radius = Math.max(data.width, data.height) * 0.9;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, hexToRgba(data.accent, 0.18));
  grad.addColorStop(1, hexToRgba(data.accent, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(
    px(data.x - radius / 2),
    px(data.y - radius / 2),
    px(data.width + radius),
    px(data.height + radius),
  );
}

function drawActivePulse(
  ctx: CanvasRenderingContext2D,
  data: InteractableRenderData,
  time: number,
): void {
  if (!data.isActive) return;
  const cx = px(data.x + data.width / 2);
  const cy = px(data.y + data.height / 2);
  const pulse = (Math.sin(time * 0.006) + 1) * 0.5;
  const radius = Math.max(data.width, data.height) * (0.7 + pulse * 0.4);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(data.accent, 0.5 + pulse * 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawActiveLabel(
  ctx: CanvasRenderingContext2D,
  data: InteractableRenderData,
): void {
  if (!data.isActive) return;
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#F6FBFF";
  ctx.fillText(data.label, px(data.x + data.width / 2), px(data.y - 6));
}

// ── type-specific draw functions ------------------------------------------

function drawTerminal(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Body
  fillBox(ctx, x, y, 28, 32, "#10151F");
  strokeBox(ctx, x, y, 28, 32, "#1A2030");

  // Screen
  fillBox(ctx, x + 3, y + 3, 22, 18, hexToRgba(accent, 0.15 + glowIntensity * 0.3));
  strokeBox(ctx, x + 3, y + 3, 22, 18, hexToRgba(accent, 0.6 + glowIntensity * 0.4));

  // Flickering data lines
  const lineCount = 4;
  for (let i = 0; i < lineCount; i++) {
    const ly = px(y + 6 + i * 4);
    const flicker = Math.sin(time * 0.008 + i * 2.1) > -0.3 ? 1 : 0.2;
    const lineW = 8 + ((i * 7 + Math.floor(time * 0.002)) % 10);
    fillBox(ctx, x + 5, ly, Math.min(lineW, 18), 1, hexToRgba(accent, flicker * 0.7));
  }

  // Keyboard shelf
  fillBox(ctx, x + 2, y + 24, 24, 6, "#0C1018");
  for (let k = 0; k < 5; k++) {
    fillBox(ctx, x + 4 + k * 4, y + 25, 3, 2, "#1E2840");
  }
}

function drawScanner(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity, isActive } = d;

  // Body
  fillBox(ctx, x, y, 24, 28, "#10151F");
  strokeBox(ctx, x, y, 24, 28, "#1A2030");

  // Scan window
  fillBox(ctx, x + 3, y + 3, 18, 16, "#080C14");

  // Sweeping scan beam
  const sweep = (Math.sin(time * 0.004) + 1) * 0.5; // 0..1
  const beamY = px(y + 4 + sweep * 14);
  ctx.fillStyle = hexToRgba(accent, 0.6 + glowIntensity * 0.4);
  ctx.fillRect(px(x + 4), beamY, 16, 2);

  // Indicator light
  const lightColor = isActive ? "#00FF66" : "#FF3344";
  fillBox(ctx, x + 10, y + 22, 4, 4, lightColor);
}

function drawNewsBoard(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Board body
  fillBox(ctx, x, y, 48, 36, "#10151F");
  strokeBox(ctx, x, y, 48, 36, "#1A2030");

  // Header bar
  fillBox(ctx, x + 2, y + 2, 44, 6, hexToRgba(accent, 0.5 + glowIntensity * 0.3));

  // Text line slots
  for (let i = 0; i < 4; i++) {
    const ly = px(y + 11 + i * 6);
    const scrollOffset = ((time * 0.02 + i * 30) % 60) - 10;
    const lineW = 20 + (i % 3) * 8;
    fillBox(ctx, x + 4 + px(scrollOffset * 0.1), ly, lineW, 2, hexToRgba(accent, 0.3 + glowIntensity * 0.2));
  }
}

function drawBillboardScreen(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Frame
  fillBox(ctx, x, y, 54, 30, "#10151F");
  strokeBox(ctx, x, y, 54, 30, hexToRgba(accent, 0.4));

  // Screen with cycling brightness
  const cycle = (Math.sin(time * 0.002) + 1) * 0.5;
  fillBox(ctx, x + 2, y + 2, 50, 26, hexToRgba(accent, 0.12 + cycle * 0.15 + glowIntensity * 0.2));

  // Dark text area
  fillBox(ctx, x + 6, y + 8, 42, 14, "rgba(0,0,0,0.5)");

  // Content lines
  for (let i = 0; i < 3; i++) {
    fillBox(ctx, x + 8, y + 10 + i * 4, 18 + (i * 5) % 20, 2, hexToRgba(accent, 0.5));
  }
}

function drawPowerNode(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity, isActive } = d;

  // Pillar
  fillBox(ctx, x + 4, y, 12, 24, "#10151F");
  strokeBox(ctx, x + 4, y, 12, 24, "#1A2030");

  // Energy core (center)
  const pulse = (Math.sin(time * 0.005) + 1) * 0.5;
  const coreAlpha = 0.4 + pulse * 0.4 + glowIntensity * 0.2;
  fillBox(ctx, x + 6, y + 8, 8, 8, hexToRgba(accent, coreAlpha));

  // Electric arcs when active
  if (isActive) {
    ctx.strokeStyle = hexToRgba(accent, 0.7);
    ctx.lineWidth = 1;
    for (let a = 0; a < 3; a++) {
      const arcAngle = time * 0.01 + a * 2.1;
      const ax1 = px(x + 10 + Math.cos(arcAngle) * 6);
      const ay1 = px(y + 12 + Math.sin(arcAngle) * 6);
      const ax2 = px(x + 10 + Math.cos(arcAngle + 1) * 10);
      const ay2 = px(y + 12 + Math.sin(arcAngle + 1) * 10);
      ctx.beginPath();
      ctx.moveTo(px(x + 10), px(y + 12));
      ctx.lineTo(ax1, ay1);
      ctx.lineTo(ax2, ay2);
      ctx.stroke();
    }
  }
}

function drawControlConsole(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Console body
  fillBox(ctx, x, y, 36, 28, "#10151F");
  strokeBox(ctx, x, y, 36, 28, "#1A2030");

  // Central display
  fillBox(ctx, x + 10, y + 3, 16, 10, hexToRgba(accent, 0.2 + glowIntensity * 0.3));
  strokeBox(ctx, x + 10, y + 3, 16, 10, hexToRgba(accent, 0.5));

  // Button array (light up in sequence)
  const activeBtn = Math.floor(time * 0.003) % 6;
  for (let b = 0; b < 6; b++) {
    const bx = px(x + 4 + b * 5);
    const by = px(y + 18);
    const isLit = b === activeBtn;
    fillBox(ctx, bx, by, 3, 3, isLit ? hexToRgba(accent, 0.9) : "#1A2030");
  }
}

function drawDataKiosk(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Base
  fillBox(ctx, x + 4, y + 22, 18, 8, "#0C1018");

  // Angled screen body
  fillBox(ctx, x, y, 26, 22, "#10151F");
  strokeBox(ctx, x, y, 26, 22, "#1A2030");

  // Screen
  fillBox(ctx, x + 3, y + 3, 20, 14, hexToRgba(accent, 0.12 + glowIntensity * 0.2));

  // Map/chart pattern
  const barCount = 5;
  for (let i = 0; i < barCount; i++) {
    const barH = 3 + ((Math.sin(time * 0.003 + i * 1.5) + 1) * 4);
    fillBox(ctx, x + 5 + i * 4, y + 15 - barH, 2, barH, hexToRgba(accent, 0.5 + glowIntensity * 0.3));
  }
}

function drawHologramTotem(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Pillar
  fillBox(ctx, x + 6, y + 16, 10, 24, "#10151F");
  strokeBox(ctx, x + 6, y + 16, 10, 24, "#1A2030");

  // Hologram projection area
  const cx = px(x + 11);
  const cy = px(y + 8);
  const rotAngle = time * 0.003;
  const holoAlpha = 0.3 + glowIntensity * 0.4 + (Math.sin(time * 0.004) + 1) * 0.15;

  // Rotating holographic diamond
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotAngle);
  ctx.fillStyle = hexToRgba(accent, holoAlpha);
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, holoAlpha + 0.2);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Projection beam lines
  ctx.strokeStyle = hexToRgba(accent, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px(x + 8), px(y + 16));
  ctx.lineTo(cx, cy);
  ctx.moveTo(px(x + 14), px(y + 16));
  ctx.lineTo(cx, cy);
  ctx.stroke();
}

function drawSentimentScreen(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Frame
  fillBox(ctx, x, y, 40, 28, "#10151F");
  strokeBox(ctx, x, y, 40, 28, "#1A2030");

  // Screen
  fillBox(ctx, x + 2, y + 2, 36, 24, "#080C14");

  // Green/red indicator bars
  const barCount = 6;
  for (let i = 0; i < barCount; i++) {
    const val = Math.sin(time * 0.002 + i * 1.3);
    const isPositive = val > 0;
    const barH = Math.abs(val) * 10 + 2;
    const barColor = isPositive ? "#00FF66" : "#FF3344";
    const bx = px(x + 5 + i * 6);
    const by = px(y + 14 - (isPositive ? barH : 0));
    fillBox(ctx, bx, by, 4, barH, hexToRgba(barColor, 0.5 + glowIntensity * 0.3));
  }

  // Header accent
  fillBox(ctx, x + 2, y + 2, 36, 4, hexToRgba(accent, 0.3));
}

function drawLabScanner(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Body
  fillBox(ctx, x, y, 28, 24, "#10151F");
  strokeBox(ctx, x, y, 28, 24, "#1A2030");

  // Specimen slot
  fillBox(ctx, x + 4, y + 14, 10, 8, "#080C14");
  strokeBox(ctx, x + 4, y + 14, 10, 8, "#1A2838");

  // Readout screen
  fillBox(ctx, x + 16, y + 3, 10, 12, hexToRgba(accent, 0.15 + glowIntensity * 0.2));
  strokeBox(ctx, x + 16, y + 3, 10, 12, hexToRgba(accent, 0.4));

  // Pulsing green scan line
  const scanY = px(y + 15 + ((Math.sin(time * 0.005) + 1) * 0.5) * 6);
  ctx.fillStyle = hexToRgba("#00FF66", 0.5 + glowIntensity * 0.4);
  ctx.fillRect(px(x + 5), scanY, 8, 1);
}

function drawReactorConsole(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Heavy body
  fillBox(ctx, x, y, 34, 30, "#10151F");
  strokeBox(ctx, x, y, 34, 30, "#1A2030");

  // Central display
  fillBox(ctx, x + 8, y + 3, 18, 12, hexToRgba(accent, 0.15 + glowIntensity * 0.25));

  // Warning lights (alternating)
  const warnPhase = Math.floor(time * 0.004) % 2;
  fillBox(ctx, x + 3, y + 4, 4, 4, warnPhase === 0 ? "#FFAA00" : "#442200");
  fillBox(ctx, x + 27, y + 4, 4, 4, warnPhase === 1 ? "#FF3344" : "#331111");

  // Control levers
  for (let i = 0; i < 3; i++) {
    const leverY = px(y + 18 + Math.sin(time * 0.002 + i) * 2);
    fillBox(ctx, x + 6 + i * 10, leverY, 3, 8, "#2A3040");
    fillBox(ctx, x + 6 + i * 10, leverY, 3, 2, hexToRgba(accent, 0.6));
  }
}

function drawRouteMap(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Board
  fillBox(ctx, x, y, 44, 32, "#10151F");
  strokeBox(ctx, x, y, 44, 32, "#1A2030");

  // Map background
  fillBox(ctx, x + 2, y + 2, 40, 28, "#080C14");

  // Route lines (animated)
  ctx.strokeStyle = hexToRgba(accent, 0.4 + glowIntensity * 0.3);
  ctx.lineWidth = 1;

  // Horizontal route
  ctx.beginPath();
  ctx.moveTo(px(x + 5), px(y + 12));
  ctx.lineTo(px(x + 20), px(y + 12));
  ctx.lineTo(px(x + 28), px(y + 20));
  ctx.lineTo(px(x + 38), px(y + 20));
  ctx.stroke();

  // Vertical route
  ctx.beginPath();
  ctx.moveTo(px(x + 22), px(y + 5));
  ctx.lineTo(px(x + 22), px(y + 26));
  ctx.stroke();

  // Moving dots along route
  const dotProgress = (time * 0.003) % 1;
  const dotX = px(x + 5 + dotProgress * 33);
  const dotY = dotProgress < 0.45
    ? px(y + 12)
    : dotProgress < 0.7
      ? px(y + 12 + (dotProgress - 0.45) * 32)
      : px(y + 20);
  ctx.fillStyle = hexToRgba(accent, 0.9);
  ctx.fillRect(dotX - 1, dotY - 1, 3, 3);
}

function drawMachineConsole(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity } = d;

  // Body
  fillBox(ctx, x, y, 32, 26, "#10151F");
  strokeBox(ctx, x, y, 32, 26, "#1A2030");

  // Gauges
  for (let i = 0; i < 2; i++) {
    const gx = px(x + 4 + i * 14);
    const gy = px(y + 4);
    strokeBox(ctx, gx, gy, 10, 10, hexToRgba(accent, 0.4));
    // Gauge needle
    const angle = Math.sin(time * 0.002 + i * 1.5) * 0.8;
    const nx = px(gx + 5 + Math.cos(angle) * 4);
    const ny = px(gy + 5 + Math.sin(angle) * 4);
    ctx.strokeStyle = hexToRgba(accent, 0.7 + glowIntensity * 0.3);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px(gx + 5), px(gy + 5));
    ctx.lineTo(nx, ny);
    ctx.stroke();
  }

  // Switches
  for (let s = 0; s < 4; s++) {
    fillBox(ctx, x + 4 + s * 7, y + 18, 4, 6, "#1A2838");
    fillBox(ctx, x + 4 + s * 7, y + 18, 4, 2, hexToRgba(accent, 0.3));
  }
}

function drawCargoGate(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity, isActive } = d;

  // Gate frame (left pillar)
  fillBox(ctx, x, y, 6, 40, "#10151F");
  // Gate frame (right pillar)
  fillBox(ctx, x + 44, y, 6, 40, "#10151F");
  // Top bar
  fillBox(ctx, x, y, 50, 4, "#10151F");

  strokeBox(ctx, x, y, 50, 40, "#1A2030");

  // Barrier bar (open/closed)
  const openAmount = isActive ? 0.9 : 0.1;
  const barrierY = px(y + 6 + openAmount * 28);
  fillBox(ctx, x + 8, barrierY, 34, 3, hexToRgba(accent, 0.6 + glowIntensity * 0.3));

  // Indicator lights
  const isOpen = isActive;
  fillBox(ctx, x + 2, y + 6, 3, 3, isOpen ? "#00FF66" : "#FF3344");
  fillBox(ctx, x + 45, y + 6, 3, 3, isOpen ? "#00FF66" : "#FF3344");

  // Hazard stripes on pillars
  for (let i = 0; i < 3; i++) {
    const sy = px(y + 14 + i * 8);
    fillBox(ctx, x + 1, sy, 4, 2, "#FFAA00");
    fillBox(ctx, x + 45, sy, 4, 2, "#FFAA00");
  }
}

function drawTransitGate(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
  time: number,
): void {
  const { x, y, accent, glowIntensity, isActive } = d;

  // Sleek frame (left)
  fillBox(ctx, x, y, 4, 36, "#10151F");
  // Sleek frame (right)
  fillBox(ctx, x + 38, y, 4, 36, "#10151F");
  // Top arch
  fillBox(ctx, x, y, 42, 3, "#10151F");

  strokeBox(ctx, x, y, 42, 36, hexToRgba(accent, 0.3));

  // Cyan accent lights on sides
  for (let i = 0; i < 4; i++) {
    const ly = px(y + 6 + i * 8);
    fillBox(ctx, x + 1, ly, 2, 4, hexToRgba(accent, 0.4 + glowIntensity * 0.4));
    fillBox(ctx, x + 39, ly, 2, 4, hexToRgba(accent, 0.4 + glowIntensity * 0.4));
  }

  // Scanner beam
  if (isActive) {
    const beamSweep = (Math.sin(time * 0.005) + 1) * 0.5;
    const beamX = px(x + 6 + beamSweep * 28);
    ctx.fillStyle = hexToRgba(accent, 0.3 + glowIntensity * 0.4);
    ctx.fillRect(beamX, px(y + 4), 2, 28);
  }
}

// Generic fallback for unknown types
function drawGenericInteractable(
  ctx: CanvasRenderingContext2D,
  d: InteractableRenderData,
): void {
  fillBox(ctx, d.x, d.y, d.width, d.height, "#10151F");
  strokeBox(ctx, d.x, d.y, d.width, d.height, hexToRgba(d.accent, 0.4));
}

// ── draw dispatch map -----------------------------------------------------

const DRAW_MAP: Record<
  string,
  (ctx: CanvasRenderingContext2D, d: InteractableRenderData, t: number) => void
> = {
  terminal: drawTerminal,
  scanner: drawScanner,
  "news-board": drawNewsBoard,
  "billboard-screen": drawBillboardScreen,
  "power-node": drawPowerNode,
  "control-console": drawControlConsole,
  "data-kiosk": drawDataKiosk,
  "hologram-totem": drawHologramTotem,
  "sentiment-screen": drawSentimentScreen,
  "lab-scanner": drawLabScanner,
  "reactor-console": drawReactorConsole,
  "route-map": drawRouteMap,
  "machine-console": drawMachineConsole,
  "cargo-gate": drawCargoGate,
  "transit-gate": drawTransitGate,
};

// ── public entry point ----------------------------------------------------

/**
 * Draw a single interactable object with type-specific pixel art,
 * hover glow, active pulse, and label.
 */
export function drawInteractable(
  ctx: CanvasRenderingContext2D,
  data: InteractableRenderData,
  time: number,
): void {
  ctx.save();

  // Hover glow (under the object)
  drawHoverGlow(ctx, data);

  // Type-specific rendering
  const drawFn = DRAW_MAP[data.type];
  if (drawFn) {
    drawFn(ctx, data, time);
  } else {
    drawGenericInteractable(ctx, data);
  }

  // Active pulse ring + label (over the object)
  drawActivePulse(ctx, data, time);
  drawActiveLabel(ctx, data);

  ctx.restore();
}
