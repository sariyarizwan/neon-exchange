import { describe, it, expect } from "vitest";
import { isPointInViewport, computeIndicators } from "@/lib/edgeIndicators";

describe("isPointInViewport", () => {
  // Viewport: camera at (0,0), zoom=1, vw=800, vh=600
  // Visible world: x in [0,800], y in [0,600]
  const cam = { x: 0, y: 0, zoom: 1, vw: 800, vh: 600 };

  it("returns true for a point clearly inside the viewport", () => {
    expect(isPointInViewport(400, 300, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(true);
  });

  it("returns false for a point to the left of the viewport", () => {
    expect(isPointInViewport(-10, 300, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(false);
  });

  it("returns false for a point to the right of the viewport", () => {
    expect(isPointInViewport(900, 300, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(false);
  });

  it("returns false for a point above the viewport", () => {
    expect(isPointInViewport(400, -10, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(false);
  });

  it("returns false for a point below the viewport", () => {
    expect(isPointInViewport(400, 700, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(false);
  });

  it("returns true for a point on the left edge", () => {
    expect(isPointInViewport(0, 300, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(true);
  });

  it("returns true for a point on the right edge", () => {
    expect(isPointInViewport(800, 300, cam.x, cam.y, cam.zoom, cam.vw, cam.vh)).toBe(true);
  });

  it("accounts for camera offset", () => {
    // Camera moved to (200, 100) — visible x in [200, 1000], y in [100, 700]
    expect(isPointInViewport(300, 200, 200, 100, 1, 800, 600)).toBe(true);
    expect(isPointInViewport(100, 200, 200, 100, 1, 800, 600)).toBe(false);
  });

  it("accounts for zoom (zoom=2 halves effective viewport size)", () => {
    // At zoom=2, effectiveWidth=400, effectiveHeight=300
    // Visible world x in [0, 400], y in [0, 300]
    expect(isPointInViewport(300, 200, 0, 0, 2, 800, 600)).toBe(true);
    expect(isPointInViewport(500, 200, 0, 0, 2, 800, 600)).toBe(false);
  });
});

describe("computeIndicators", () => {
  // Viewport: 800x600, camera at (0,0), zoom=1
  // Districts at world coords. Points off-screen (outside -20..820, -20..620) get indicators.
  const vw = 800;
  const vh = 600;
  const cameraX = 0;
  const cameraY = 0;
  const zoom = 1;

  it("returns no indicators when all districts are on-screen", () => {
    const centers = [{ id: "a", centerX: 400, centerY: 300 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(0);
  });

  it("returns an indicator for an off-screen district to the right", () => {
    const centers = [{ id: "far-right", centerX: 5000, centerY: 300 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(1);
    expect(result[0].districtId).toBe("far-right");
    expect(result[0].visible).toBe(true);
  });

  it("returns an indicator for an off-screen district above the viewport", () => {
    const centers = [{ id: "far-up", centerX: 400, centerY: -2000 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(1);
    expect(result[0].districtId).toBe("far-up");
  });

  it("clamps indicator screen position within inset margins", () => {
    const centers = [{ id: "far-right", centerX: 5000, centerY: 300 }];
    const margins = { top: 70, right: 70, bottom: 60, left: 70 };
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh, margins);
    expect(result[0].screenX).toBeLessThanOrEqual(vw - margins.right);
    expect(result[0].screenX).toBeGreaterThanOrEqual(margins.left);
    expect(result[0].screenY).toBeLessThanOrEqual(vh - margins.bottom);
    expect(result[0].screenY).toBeGreaterThanOrEqual(margins.top);
  });

  it("computes the angle pointing from viewport center toward the district", () => {
    // District is directly to the right of center (400, 300)
    // Screen coords of district: (5000 - 0) * 1 = 5000, (300 - 0) * 1 = 300
    // dx = 5000 - 400 = 4600, dy = 300 - 300 = 0 → angle = 0
    const centers = [{ id: "right", centerX: 5000, centerY: 300 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result[0].angle).toBeCloseTo(0, 2);
  });

  it("returns indicators for multiple off-screen districts", () => {
    const centers = [
      { id: "far-right", centerX: 9000, centerY: 300 },
      { id: "far-up", centerX: 400, centerY: -3000 },
    ];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(2);
  });

  it("handles a district directly above the viewport center (dx=0, vertical ray)", () => {
    // viewport center is at screen (400, 300); district screen x must equal 400 → centerX = 400
    // district must be off-screen above: centerY must be < -20 in screen coords
    // At zoom=1, cameraY=0: screenY = centerY * 1 = centerY. Need centerY < -20.
    const centers = [{ id: "straight-up", centerX: 400, centerY: -100 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(1);
    // Angle should be -π/2 (pointing straight up)
    expect(result[0].angle).toBeCloseTo(-Math.PI / 2, 2);
  });

  it("handles a district directly to the right of viewport center (dy=0, horizontal ray)", () => {
    // viewport center is at screen (400, 300); district screen y must equal 300 → centerY = 300
    // district must be off-screen right: centerX must be > 820 in screen coords
    // At zoom=1, cameraX=0: screenX = centerX. Need centerX > 820.
    const centers = [{ id: "straight-right", centerX: 5000, centerY: 300 }];
    const result = computeIndicators(centers, cameraX, cameraY, zoom, vw, vh);
    expect(result).toHaveLength(1);
    // Angle should be 0 (pointing straight right)
    expect(result[0].angle).toBeCloseTo(0, 2);
  });

  it("distance field reflects how far off-screen the district is", () => {
    const near = [{ id: "near", centerX: 900, centerY: 300 }];
    const far = [{ id: "far", centerX: 5000, centerY: 300 }];
    const nearResult = computeIndicators(near, cameraX, cameraY, zoom, vw, vh);
    const farResult = computeIndicators(far, cameraX, cameraY, zoom, vw, vh);
    expect(farResult[0].distance).toBeGreaterThan(nearResult[0].distance);
  });
});
