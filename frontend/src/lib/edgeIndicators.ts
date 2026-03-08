export type IndicatorData = {
  districtId: string;
  screenX: number;
  screenY: number;
  angle: number;
  distance: number;
  visible: boolean;
};

type Margins = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const DEFAULT_MARGINS: Margins = { top: 70, right: 70, bottom: 60, left: 70 };

/**
 * Check if a world point is within the visible viewport.
 */
export function isPointInViewport(
  worldX: number,
  worldY: number,
  cameraX: number,
  cameraY: number,
  zoom: number,
  vw: number,
  vh: number
): boolean {
  const worldLeft = cameraX;
  const worldTop = cameraY;
  const worldRight = cameraX + vw / zoom;
  const worldBottom = cameraY + vh / zoom;
  return worldX >= worldLeft && worldX <= worldRight && worldY >= worldTop && worldY <= worldBottom;
}

/**
 * For each off-screen district, compute an IndicatorData with clamped screen
 * position and rotation angle pointing toward the district.
 */
export function computeIndicators(
  districtCenters: ReadonlyArray<{ id: string; centerX: number; centerY: number }>,
  cameraX: number,
  cameraY: number,
  zoom: number,
  vw: number,
  vh: number,
  margins: Margins = DEFAULT_MARGINS
): IndicatorData[] {
  const results: IndicatorData[] = [];

  // Viewport center in screen coords
  const cx = vw / 2;
  const cy = vh / 2;

  // Inset rect for clamping indicator positions
  const left = margins.left;
  const top = margins.top;
  const right = vw - margins.right;
  const bottom = vh - margins.bottom;

  for (const district of districtCenters) {
    // Convert district world coords to screen coords
    const sx = (district.centerX - cameraX) * zoom;
    const sy = (district.centerY - cameraY) * zoom;

    // Check if on-screen (with some padding so indicators appear before district fully exits)
    const onScreen = sx >= -20 && sx <= vw + 20 && sy >= -20 && sy <= vh + 20;
    if (onScreen) continue;

    const dx = sx - cx;
    const dy = sy - cy;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Find intersection of ray from center toward district with inset rect
    const { x: clampedX, y: clampedY } = rayRectIntersection(cx, cy, dx, dy, left, top, right, bottom);

    results.push({
      districtId: district.id,
      screenX: clampedX,
      screenY: clampedY,
      angle,
      distance,
      visible: true,
    });
  }

  return results;
}

/**
 * Find where a ray from (ox,oy) in direction (dx,dy) intersects
 * the rectangle defined by [left,top,right,bottom].
 */
function rayRectIntersection(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  left: number,
  top: number,
  right: number,
  bottom: number
): { x: number; y: number } {
  // Parametric: point = (ox + t*dx, oy + t*dy)
  // Find smallest positive t that hits a boundary
  let tMin = Infinity;

  if (dx !== 0) {
    const tRight = (right - ox) / dx;
    if (tRight > 0) tMin = Math.min(tMin, tRight);
    const tLeft = (left - ox) / dx;
    if (tLeft > 0) tMin = Math.min(tMin, tLeft);
  }

  if (dy !== 0) {
    const tBottom = (bottom - oy) / dy;
    if (tBottom > 0) tMin = Math.min(tMin, tBottom);
    const tTop = (top - oy) / dy;
    if (tTop > 0) tMin = Math.min(tMin, tTop);
  }

  // Clamp the result to the rect
  const x = Math.max(left, Math.min(right, ox + tMin * dx));
  const y = Math.max(top, Math.min(bottom, oy + tMin * dy));

  return { x, y };
}
