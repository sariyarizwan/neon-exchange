// District signature activation effects
// Each district has a unique visual overlay triggered on activation (2-3 seconds)

type DistrictZoneInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
};

type EffectParams = {
  ctx: CanvasRenderingContext2D;
  time: number;
  startTime: number;
  duration: number;
  zone: DistrictZoneInfo;
  cameraX: number;
  cameraY: number;
  primaryColor: string;
  secondaryColor: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Seeded pseudo-random from an integer seed (deterministic per frame chunk). */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Returns true when the zone is at least partially on screen. */
function isZoneVisible(
  zone: DistrictZoneInfo,
  cameraX: number,
  cameraY: number,
  ctx: CanvasRenderingContext2D,
): boolean {
  const screenX = Math.round(zone.x - cameraX);
  const screenY = Math.round(zone.y - cameraY);
  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;
  return (
    screenX + zone.width > 0 &&
    screenX < canvasW &&
    screenY + zone.height > 0 &&
    screenY < canvasH
  );
}

// ---------------------------------------------------------------------------
// 1. Glitch Surge — Crypto Alley (~2000ms)
// ---------------------------------------------------------------------------

export function drawGlitchSurge(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor, secondaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  const intensity = 1 - progress;
  if (intensity <= 0) return;

  ctx.save();

  const sx = Math.round(zone.x - cameraX);
  const sy = Math.round(zone.y - cameraY);
  const sw = zone.width;
  const sh = zone.height;

  // Brightness flash that fades
  ctx.globalAlpha = intensity * 0.25;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx, sy, sw, sh);

  // Flickering scan lines
  const scanLineCount = 12;
  ctx.globalAlpha = intensity * 0.4;
  ctx.strokeStyle = hexToRgba(primaryColor, intensity * 0.6);
  ctx.lineWidth = 1;
  for (let i = 0; i < scanLineCount; i++) {
    const seed = Math.floor(time / 50) * 100 + i;
    const yOff = seededRandom(seed) * sh;
    const lineY = Math.round(sy + yOff);
    const shakeX = Math.round((seededRandom(seed + 1) - 0.5) * 10 * intensity);
    ctx.beginPath();
    ctx.moveTo(sx + shakeX, lineY);
    ctx.lineTo(sx + sw + shakeX, lineY);
    ctx.stroke();
  }

  // Random glitch artifact rectangles
  const artifactCount = Math.floor(intensity * 18);
  for (let i = 0; i < artifactCount; i++) {
    const seed = Math.floor(time / 33) * 200 + i;
    const rx = Math.round(sx + seededRandom(seed) * sw);
    const ry = Math.round(sy + seededRandom(seed + 1) * sh);
    const rw = Math.round(4 + seededRandom(seed + 2) * 30);
    const rh = Math.round(2 + seededRandom(seed + 3) * 6);
    const useSecondary = seededRandom(seed + 4) > 0.5;
    ctx.globalAlpha = intensity * (0.3 + seededRandom(seed + 5) * 0.5);
    ctx.fillStyle = useSecondary ? secondaryColor : primaryColor;
    ctx.fillRect(rx, ry, rw, rh);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 2. Factory Wake Up — Industrials Foundry (~2500ms)
// ---------------------------------------------------------------------------

export function drawFactoryWakeUp(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor, secondaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  const intensity = progress < 0.8 ? 1 : 1 - (progress - 0.8) / 0.2;
  if (intensity <= 0) return;

  ctx.save();

  const cx = Math.round(zone.x + zone.width / 2 - cameraX);
  const cy = Math.round(zone.y + zone.height / 2 - cameraY);
  const maxLen = Math.max(zone.width, zone.height) * 0.6;

  // 8 light bars at 45-degree intervals
  const barCount = 8;
  const barLength = maxLen * easeOut(Math.min(progress * 1.5, 1));
  const barWidth = 3;

  for (let i = 0; i < barCount; i++) {
    const angle = (i * Math.PI) / 4;
    const endX = Math.round(cx + Math.cos(angle) * barLength);
    const endY = Math.round(cy + Math.sin(angle) * barLength);

    // Color transition from primary to secondary
    const colorMix = progress;
    const gradient = ctx.createLinearGradient(cx, cy, endX, endY);
    gradient.addColorStop(0, hexToRgba(primaryColor, intensity * 0.9));
    gradient.addColorStop(1, hexToRgba(secondaryColor, intensity * 0.3));

    ctx.globalAlpha = intensity;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = barWidth;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Pulsing glow at center
  const pulsePhase = Math.sin(time * 0.008) * 0.5 + 0.5;
  const glowRadius = 15 + pulsePhase * 10;
  const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
  glowGradient.addColorStop(0, hexToRgba(primaryColor, intensity * 0.8));
  glowGradient.addColorStop(1, hexToRgba(primaryColor, 0));
  ctx.globalAlpha = intensity;
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3. Reactor Pulse — Energy Yard (~2000ms)
// ---------------------------------------------------------------------------

export function drawReactorPulse(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const cx = Math.round(zone.x + zone.width / 2 - cameraX);
  const cy = Math.round(zone.y + zone.height / 2 - cameraY);
  const maxRadius = Math.max(zone.width, zone.height) * 0.55;

  // 3 concentric expanding rings with staggered starts (0ms, 400ms, 800ms)
  const ringOffsets = [0, 400, 800];
  const ringColors = ['#00e5ff', '#00c853', '#18ffff'];

  for (let i = 0; i < 3; i++) {
    const elapsed = time - startTime - ringOffsets[i];
    if (elapsed < 0) continue;

    const ringDuration = duration - ringOffsets[i];
    const ringProgress = clamp01(elapsed / ringDuration);
    const ringRadius = Math.round(easeOut(ringProgress) * maxRadius);
    const ringAlpha = (1 - ringProgress) * 0.7;

    if (ringAlpha <= 0) continue;

    ctx.globalAlpha = ringAlpha;
    ctx.strokeStyle = ringColors[i];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lightning arcs during first 60% of effect
  if (progress < 0.6) {
    const arcIntensity = 1 - progress / 0.6;
    const arcCount = Math.floor(arcIntensity * 5);
    ctx.globalAlpha = arcIntensity * 0.6;
    ctx.strokeStyle = '#b2ff59';
    ctx.lineWidth = 1;

    for (let a = 0; a < arcCount; a++) {
      const seed = Math.floor(time / 60) * 50 + a;
      const angle = seededRandom(seed) * Math.PI * 2;
      const dist = seededRandom(seed + 1) * maxRadius * 0.6;
      const startX = Math.round(cx + Math.cos(angle) * dist * 0.3);
      const startY = Math.round(cy + Math.sin(angle) * dist * 0.3);

      ctx.beginPath();
      ctx.moveTo(startX, startY);

      const segments = 4 + Math.floor(seededRandom(seed + 2) * 4);
      let px = startX;
      let py = startY;
      for (let s = 0; s < segments; s++) {
        const jx = Math.round(px + (seededRandom(seed + 10 + s) - 0.5) * 20);
        const jy = Math.round(py + (seededRandom(seed + 20 + s) - 0.5) * 20);
        ctx.lineTo(jx, jy);
        px = jx;
        py = jy;
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. Market Briefing — Bank Towers (~3000ms)
// ---------------------------------------------------------------------------

export function drawMarketBriefing(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const sx = Math.round(zone.x - cameraX);
  const sy = Math.round(zone.y - cameraY);
  const sw = zone.width;
  const sh = zone.height;

  const labels = ['SECTOR FLOW', 'SENTIMENT', 'ROTATION', 'YIELD CURVE'];
  const panelW = 80;
  const panelH = 28;
  const panelGap = 8;
  const totalW = labels.length * (panelW + panelGap) - panelGap;
  const baseX = Math.round(sx + (sw - totalW) / 2);
  const baseY = Math.round(sy + sh * 0.6);

  // Fade out in last 20%
  const fadeOut = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

  for (let i = 0; i < labels.length; i++) {
    // Staggered appearance (300ms apart)
    const panelDelay = i * 300;
    const panelElapsed = time - startTime - panelDelay;
    if (panelElapsed < 0) continue;

    const panelProgress = clamp01(panelElapsed / 500);
    const slideUp = (1 - easeOut(panelProgress)) * 20;
    const panelAlpha = easeOut(panelProgress) * fadeOut;

    if (panelAlpha <= 0) continue;

    const px = Math.round(baseX + i * (panelW + panelGap));
    const py = Math.round(baseY + slideUp);

    ctx.globalAlpha = panelAlpha;

    // Dark fill
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    ctx.fillRect(px, py, panelW, panelH);

    // Thin accent border (amber/gold)
    ctx.strokeStyle = hexToRgba(primaryColor, panelAlpha);
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, panelW, panelH);

    // Label text
    ctx.fillStyle = hexToRgba(primaryColor, panelAlpha);
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], Math.round(px + panelW / 2), Math.round(py + panelH / 2));
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. Research Reveal — Bio Dome (~2500ms)
// ---------------------------------------------------------------------------

export function drawResearchReveal(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const sx = Math.round(zone.x - cameraX);
  const sy = Math.round(zone.y - cameraY);
  const sw = zone.width;
  const sh = zone.height;
  const cx = Math.round(sx + sw / 2);

  // Fade out in last 20%
  const fadeOut = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;
  const fadeIn = easeOut(Math.min(progress * 3, 1));
  const alpha = fadeIn * fadeOut;

  if (alpha <= 0) {
    ctx.restore();
    return;
  }

  // Gentle float offset
  const floatY = Math.sin(time * 0.003) * 4;

  // DNA helix pattern
  const helixCenterY = Math.round(sy + sh * 0.3 + floatY);
  const helixWidth = sw * 0.5;
  const helixStartX = Math.round(cx - helixWidth / 2);
  const steps = 30;

  ctx.globalAlpha = alpha * 0.6;
  ctx.lineWidth = 1.5;

  // Two sine waves
  ctx.beginPath();
  ctx.strokeStyle = hexToRgba(primaryColor, alpha * 0.7);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(helixStartX + t * helixWidth);
    const y = Math.round(helixCenterY + Math.sin(t * Math.PI * 4 + time * 0.004) * 12);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = hexToRgba(primaryColor, alpha * 0.5);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(helixStartX + t * helixWidth);
    const y = Math.round(helixCenterY + Math.sin(t * Math.PI * 4 + time * 0.004 + Math.PI) * 12);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Connecting rungs
  ctx.strokeStyle = hexToRgba(primaryColor, alpha * 0.3);
  ctx.lineWidth = 1;
  for (let i = 0; i <= steps; i += 3) {
    const t = i / steps;
    const x = Math.round(helixStartX + t * helixWidth);
    const y1 = Math.round(helixCenterY + Math.sin(t * Math.PI * 4 + time * 0.004) * 12);
    const y2 = Math.round(helixCenterY + Math.sin(t * Math.PI * 4 + time * 0.004 + Math.PI) * 12);
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  // Holographic panels with labels
  const panelLabels = ['PHASE 3', 'BIOMARKERS', 'PIPELINE'];
  const panelW = 65;
  const panelH = 22;
  const panelSpacing = 12;
  const totalPanelW = panelLabels.length * (panelW + panelSpacing) - panelSpacing;
  const panelBaseX = Math.round(cx - totalPanelW / 2);
  const panelBaseY = Math.round(sy + sh * 0.55 + floatY);

  for (let i = 0; i < panelLabels.length; i++) {
    const px = Math.round(panelBaseX + i * (panelW + panelSpacing));
    const py = Math.round(panelBaseY);

    ctx.globalAlpha = alpha * 0.7;

    // Green-tinted panel fill
    ctx.fillStyle = 'rgba(0, 40, 20, 0.75)';
    ctx.fillRect(px, py, panelW, panelH);

    // Scan-line overlay on panel
    ctx.strokeStyle = hexToRgba(primaryColor, alpha * 0.15);
    ctx.lineWidth = 1;
    for (let line = 0; line < panelH; line += 3) {
      ctx.beginPath();
      ctx.moveTo(px, Math.round(py + line));
      ctx.lineTo(px + panelW, Math.round(py + line));
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = hexToRgba(primaryColor, alpha * 0.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, panelW, panelH);

    // Label
    ctx.globalAlpha = alpha;
    ctx.fillStyle = primaryColor;
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(panelLabels[i], Math.round(px + panelW / 2), Math.round(py + panelH / 2));
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 6. Route Activation — Comms Neon Ridge (~3000ms)
// ---------------------------------------------------------------------------

export function drawRouteActivation(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor, secondaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const originX = Math.round(zone.x + zone.width / 2 - cameraX);
  const originY = Math.round(zone.y + zone.height / 2 - cameraY);

  // Fade out in last 15%
  const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

  // Target district approximate centers (world coords)
  const targets = [
    { x: 3670, y: 570 },   // crypto-alley
    { x: 2860, y: 1450 },  // bio-dome
    { x: 1760, y: 1450 },  // consumer-strip
  ];

  for (let i = 0; i < targets.length; i++) {
    const tx = Math.round(targets[i].x - cameraX);
    const ty = Math.round(targets[i].y - cameraY);

    const dx = tx - originX;
    const dy = ty - originY;
    const totalDist = Math.sqrt(dx * dx + dy * dy);

    // Line draws itself outward
    const drawProgress = easeOut(clamp01(progress * 1.8 - i * 0.15));
    const lineLen = drawProgress * totalDist;

    if (lineLen <= 0) continue;

    const endX = Math.round(originX + (dx / totalDist) * lineLen);
    const endY = Math.round(originY + (dy / totalDist) * lineLen);

    // Dashed line
    ctx.globalAlpha = fadeOut * 0.7;
    ctx.strokeStyle = hexToRgba(primaryColor, fadeOut * 0.8);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pulse dot traveling along the line
    if (drawProgress > 0.1) {
      const dotT = ((time * 0.002 + i * 0.3) % 1);
      const dotDist = dotT * lineLen;
      const dotX = Math.round(originX + (dx / totalDist) * dotDist);
      const dotY = Math.round(originY + (dy / totalDist) * dotDist);

      ctx.globalAlpha = fadeOut * 0.9;
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Glow around dot
      const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
      dotGlow.addColorStop(0, hexToRgba(secondaryColor, fadeOut * 0.4));
      dotGlow.addColorStop(1, hexToRgba(secondaryColor, 0));
      ctx.fillStyle = dotGlow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 7. Tech Overclock — Chip Docks (~2000ms)
// ---------------------------------------------------------------------------

export function drawTechOverclock(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const sx = Math.round(zone.x - cameraX);
  const sy = Math.round(zone.y - cameraY);
  const sw = zone.width;
  const sh = zone.height;

  // Intensity peaks at 50%, then fades
  const intensity = progress < 0.5
    ? easeInOut(progress * 2)
    : 1 - easeInOut((progress - 0.5) * 2);

  // Flash at peak
  if (progress > 0.45 && progress < 0.55) {
    const flashAlpha = (1 - Math.abs(progress - 0.5) / 0.05) * 0.3;
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, sw, sh);
  }

  // Cascading server light columns
  const cols = 10;
  const rows = 6;
  const cellW = sw / cols;
  const cellH = sh / rows;
  const lightSize = 3;

  for (let col = 0; col < cols; col++) {
    // Each column activates sequentially
    const colActivation = clamp01((progress * cols * 1.5 - col) / 1.5);
    if (colActivation <= 0) continue;

    for (let row = 0; row < rows; row++) {
      const seed = col * 100 + row;
      const brightness = seededRandom(seed) * colActivation * intensity;
      if (brightness < 0.1) continue;

      const lx = Math.round(sx + col * cellW + cellW / 2);
      const ly = Math.round(sy + row * cellH + cellH / 2);

      ctx.globalAlpha = brightness * 0.8;
      ctx.fillStyle = primaryColor;
      ctx.fillRect(lx - lightSize / 2, ly - lightSize / 2, lightSize, lightSize);
    }
  }

  // Matrix-rain-style data stream within district
  const dropCount = Math.floor(intensity * 25);
  for (let i = 0; i < dropCount; i++) {
    const seed = Math.floor(time / 40) * 300 + i;
    const dx = Math.round(sx + seededRandom(seed) * sw);
    const speed = 0.5 + seededRandom(seed + 1) * 1.5;
    const dy = Math.round(sy + ((time * speed * 0.1 + seededRandom(seed + 2) * sh) % sh));
    const dw = Math.round(2 + seededRandom(seed + 3) * 3);
    const dh = Math.round(3 + seededRandom(seed + 4) * 6);

    ctx.globalAlpha = intensity * (0.3 + seededRandom(seed + 5) * 0.5);
    ctx.fillStyle = seededRandom(seed + 6) > 0.7 ? '#ffffff' : primaryColor;
    ctx.fillRect(dx, dy, dw, dh);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 8. Consumer Frenzy — Consumer Strip (~2500ms)
// ---------------------------------------------------------------------------

export function drawConsumerFrenzy(params: EffectParams): void {
  const { ctx, time, startTime, duration, zone, cameraX, cameraY, primaryColor, secondaryColor } = params;
  if (!isZoneVisible(zone, cameraX, cameraY, ctx)) return;

  const progress = clamp01((time - startTime) / duration);
  if (progress >= 1) return;

  ctx.save();

  const sx = Math.round(zone.x - cameraX);
  const sy = Math.round(zone.y - cameraY);
  const sw = zone.width;
  const sh = zone.height;

  // Intensity fades toward end
  const intensity = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

  // Brightness pulse
  const pulseAlpha = Math.sin(progress * Math.PI) * 0.15 * intensity;
  if (pulseAlpha > 0) {
    ctx.globalAlpha = pulseAlpha;
    ctx.fillStyle = hexToRgba(primaryColor, pulseAlpha);
    ctx.fillRect(sx, sy, sw, sh);
  }

  // Signs flashing in wave pattern
  const signCount = 8;
  const signW = 20;
  const signH = 12;
  for (let i = 0; i < signCount; i++) {
    const signX = Math.round(sx + (i / signCount) * sw + sw / (signCount * 2));
    const signY = Math.round(sy + sh * 0.3 + Math.sin(i * 0.8) * 15);

    // Wave pattern: each sign flashes at a different phase
    const wavePhase = (time * 0.005 - i * 0.3) % (Math.PI * 2);
    const signBrightness = (Math.sin(wavePhase) * 0.5 + 0.5) * intensity;

    if (signBrightness < 0.1) continue;

    ctx.globalAlpha = signBrightness * 0.7;
    ctx.fillStyle = i % 2 === 0 ? primaryColor : secondaryColor;
    ctx.fillRect(
      Math.round(signX - signW / 2),
      Math.round(signY - signH / 2),
      signW,
      signH,
    );

    // White flash on peak brightness
    if (signBrightness > 0.9) {
      ctx.globalAlpha = (signBrightness - 0.9) * 10 * intensity * 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        Math.round(signX - signW / 2 - 2),
        Math.round(signY - signH / 2 - 2),
        signW + 4,
        signH + 4,
      );
    }
  }

  // Star / sparkle particles
  const sparkleCount = Math.floor(intensity * 15);
  for (let i = 0; i < sparkleCount; i++) {
    const seed = Math.floor(time / 80) * 400 + i;
    const px = Math.round(sx + seededRandom(seed) * sw);
    const py = Math.round(sy + seededRandom(seed + 1) * sh);
    const size = 1 + seededRandom(seed + 2) * 3;
    const sparkleAlpha = seededRandom(seed + 3) * intensity;

    ctx.globalAlpha = sparkleAlpha;
    ctx.fillStyle = '#ffffff';

    // 4-point star shape
    ctx.beginPath();
    ctx.moveTo(px, Math.round(py - size));
    ctx.lineTo(Math.round(px + size * 0.3), py);
    ctx.lineTo(px, Math.round(py + size));
    ctx.lineTo(Math.round(px - size * 0.3), py);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(Math.round(px - size), py);
    ctx.lineTo(px, Math.round(py + size * 0.3));
    ctx.lineTo(Math.round(px + size), py);
    ctx.lineTo(px, Math.round(py - size * 0.3));
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Main Dispatcher
// ---------------------------------------------------------------------------

const effectMap: Record<string, (params: EffectParams) => void> = {
  'glitch-surge': drawGlitchSurge,
  'factory-wakeup': drawFactoryWakeUp,
  'reactor-pulse': drawReactorPulse,
  'market-briefing': drawMarketBriefing,
  'research-reveal': drawResearchReveal,
  'route-activation': drawRouteActivation,
  'tech-overclock': drawTechOverclock,
  'consumer-frenzy': drawConsumerFrenzy,
};

export function drawDistrictEffect(
  effectType: string,
  params: EffectParams,
): void {
  const drawFn = effectMap[effectType];
  if (drawFn) {
    drawFn(params);
  }
}
