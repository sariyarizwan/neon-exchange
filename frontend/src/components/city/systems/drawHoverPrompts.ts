// ---------------------------------------------------------------------------
// drawHoverPrompts.ts – In-world hover prompt labels above NPCs / objects
// ---------------------------------------------------------------------------

export type HoverPromptTarget = {
  x: number; // world x
  y: number; // world y
  label: string; // e.g. "Click to talk", "Inspect terminal"
  accent: string; // district accent color (hex)
  kind: "npc" | "object" | "district";
};

// ── helpers ----------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function distanceBetween(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── main draw function -----------------------------------------------------

/**
 * Draws hover prompts for targets near the player.
 * Shows animated, accent-colored pill labels above entities.
 */
export function drawHoverPrompts(
  ctx: CanvasRenderingContext2D,
  time: number,
  targets: ReadonlyArray<HoverPromptTarget>,
  playerX: number,
  playerY: number,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number,
  proximityRadius: number = 120,
): void {
  if (targets.length === 0) return;

  const LABEL_OFFSET_Y = -52;
  const PILL_PAD_X = 8;
  const PILL_PAD_Y = 4;
  const FONT_SIZE = 8;
  const POINTER_SIZE = 4;
  const BG_COLOR = "#081019";
  const TEXT_COLOR = "#F6FBFF";
  const FLOAT_AMP = 2; // ±2 px sin wave
  const BORDER_WIDTH = 1.5;
  const CORNER_RADIUS = 4;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const dist = distanceBetween(target.x, target.y, playerX, playerY);
    if (dist > proximityRadius) continue;

    // Screen position
    const sx = Math.round(target.x - cameraX);
    const sy = Math.round(target.y - cameraY);

    // Cull off-screen (generous margin for the pill)
    if (sx < -80 || sx > viewWidth + 80 || sy < -80 || sy > viewHeight + 80) {
      continue;
    }

    // Opacity: closer = more opaque (1 at dist 0, 0 at proximityRadius)
    const proximity = 1 - dist / proximityRadius;
    const alpha = Math.min(1, Math.max(0, proximity));
    if (alpha < 0.02) continue;

    // Animated float offset
    const floatY = Math.sin(time * 0.003 + i * 1.7) * FLOAT_AMP;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Measure text
    ctx.font = `bold ${FONT_SIZE}px monospace`;
    const metrics = ctx.measureText(target.label);
    const textW = Math.ceil(metrics.width);
    const pillW = textW + PILL_PAD_X * 2;
    const pillH = FONT_SIZE + PILL_PAD_Y * 2;
    const pillX = Math.round(sx - pillW / 2);
    const pillY = Math.round(sy + LABEL_OFFSET_Y + floatY);

    // Draw pill background
    ctx.beginPath();
    roundRect(ctx, pillX, pillY, pillW, pillH, CORNER_RADIUS);
    ctx.fillStyle = hexToRgba(BG_COLOR, 0.88);
    ctx.fill();

    // Accent border
    ctx.strokeStyle = hexToRgba(target.accent, 0.9);
    ctx.lineWidth = BORDER_WIDTH;
    ctx.stroke();

    // Small triangle pointer below pill
    const triX = Math.round(sx);
    const triTopY = pillY + pillH;
    ctx.beginPath();
    ctx.moveTo(triX - POINTER_SIZE, triTopY);
    ctx.lineTo(triX + POINTER_SIZE, triTopY);
    ctx.lineTo(triX, triTopY + POINTER_SIZE);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(BG_COLOR, 0.88);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(target.accent, 0.9);
    ctx.lineWidth = BORDER_WIDTH;
    ctx.stroke();

    // Fill over the top edge of the triangle where it meets the pill
    ctx.beginPath();
    ctx.moveTo(triX - POINTER_SIZE - 1, triTopY);
    ctx.lineTo(triX + POINTER_SIZE + 1, triTopY);
    ctx.lineWidth = BORDER_WIDTH + 1;
    ctx.strokeStyle = hexToRgba(BG_COLOR, 0.88);
    ctx.stroke();

    // Label text
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      target.label,
      Math.round(sx),
      Math.round(pillY + pillH / 2),
    );

    ctx.restore();
  }
}

// ── rounded rect helper (works on all modern Canvas) -----------------------

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
