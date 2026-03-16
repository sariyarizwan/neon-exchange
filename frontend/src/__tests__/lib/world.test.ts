import { describe, it, expect } from "vitest";
import {
  clamp,
  clampCameraPosition,
  cameraTopLeftForWorldPoint,
  distanceBetween,
  HOME_WORLD_POINT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from "@/lib/world";

describe("clamp", () => {
  it("returns value when within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min when below lower bound", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max when above upper bound", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe("clampCameraPosition", () => {
  it("clamps x to 0 when camera would go past left edge", () => {
    const result = clampCameraPosition(-100, 100, 1400, 860);
    expect(result.x).toBe(0);
  });

  it("clamps y to 0 when camera would go past top edge", () => {
    const result = clampCameraPosition(100, -100, 1400, 860);
    expect(result.y).toBe(0);
  });

  it("clamps x to maxX when camera would go past right edge", () => {
    // maxX = WORLD_WIDTH - viewportWidth/zoom = 4800 - 1400 = 3400
    const result = clampCameraPosition(9999, 100, 1400, 860);
    expect(result.x).toBe(WORLD_WIDTH - 1400);
  });

  it("clamps y to maxY when camera would go past bottom edge", () => {
    // maxY = WORLD_HEIGHT - viewportHeight/zoom = 2200 - 860 = 1340
    const result = clampCameraPosition(100, 9999, 1400, 860);
    expect(result.y).toBe(WORLD_HEIGHT - 860);
  });

  it("allows valid position in center of world", () => {
    const result = clampCameraPosition(1000, 500, 1400, 860);
    expect(result.x).toBe(1000);
    expect(result.y).toBe(500);
  });

  it("accounts for zoom factor when clamping", () => {
    // At zoom=2, effectiveWidth = 1400/2 = 700, so maxX = 4800 - 700 = 4100
    const result = clampCameraPosition(9999, 9999, 1400, 860, 2);
    expect(result.x).toBe(WORLD_WIDTH - 700);
    expect(result.y).toBe(WORLD_HEIGHT - 430);
  });

  it("returns x=0, y=0 when viewport is larger than world", () => {
    // effectiveWidth > WORLD_WIDTH means maxX would be negative, clamped to 0
    const result = clampCameraPosition(100, 100, 99999, 99999);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

describe("cameraTopLeftForWorldPoint", () => {
  it("centers the camera on the given world point", () => {
    const vw = 1400;
    const vh = 860;
    // For point (1000, 800): topLeft = (1000 - 700, 800 - 430) = (300, 370)
    const result = cameraTopLeftForWorldPoint(1000, 800, vw, vh);
    expect(result.x).toBe(300);
    expect(result.y).toBe(370);
  });

  it("clamps to 0 when centering near top-left corner", () => {
    const result = cameraTopLeftForWorldPoint(0, 0, 1400, 860);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it("clamps to max world when centering near bottom-right corner", () => {
    const result = cameraTopLeftForWorldPoint(WORLD_WIDTH, WORLD_HEIGHT, 1400, 860);
    expect(result.x).toBe(WORLD_WIDTH - 1400);
    expect(result.y).toBe(WORLD_HEIGHT - 860);
  });
});

describe("distanceBetween", () => {
  it("returns 0 for identical points", () => {
    expect(distanceBetween({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it("computes horizontal distance correctly", () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it("computes vertical distance correctly", () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it("computes hypotenuse correctly for 3-4-5 triangle", () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it("is symmetric (order of points does not matter)", () => {
    const a = { x: 100, y: 200 };
    const b = { x: 300, y: 500 };
    expect(distanceBetween(a, b)).toBe(distanceBetween(b, a));
  });
});

describe("HOME_WORLD_POINT", () => {
  it("is at the expected coordinates", () => {
    expect(HOME_WORLD_POINT).toEqual({ x: 1760, y: 1450 });
  });
});
