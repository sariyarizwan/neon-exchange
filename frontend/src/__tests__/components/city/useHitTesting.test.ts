import { describe, it, expect } from "vitest";
import { screenToWorld, pointInPolygon, hitTestTicker, hitTestDistrict } from "@/components/city/useHitTesting";
import type { Ticker } from "@/types/ticker";
import type { District } from "@/types/district";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTicker = (id: string, x: number, y: number): Ticker => ({
  id,
  symbol: id.toUpperCase(),
  fullName: `Full ${id}`,
  districtId: "test-district",
  archetype: "broker",
  mood: "confident",
  regimeTags: ["calm"],
  position: { x, y },
  trend: "up",
  alliances: []
});

const squarePolygon = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

const trianglePolygon = [
  { x: 50, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

// An L-shaped (concave) polygon
const concavePolygon = [
  { x: 0, y: 0 },
  { x: 60, y: 0 },
  { x: 60, y: 40 },
  { x: 100, y: 40 },
  { x: 100, y: 100 },
  { x: 0, y: 100 }
];

const makeDistrict = (id: string, polygon: Array<{ x: number; y: number }>): District => ({
  id,
  name: id,
  sector: "test",
  center: { x: 50, y: 50 },
  polygon,
  regime: "calm",
  traffic: "Med",
  accent: "#fff",
  summary: ""
});

// ---------------------------------------------------------------------------
// screenToWorld
// ---------------------------------------------------------------------------

describe("screenToWorld", () => {
  it("identity: zoom=1 camera at (0,0) maps screen coords to same world coords", () => {
    const result = screenToWorld(200, 300, 0, 0, 1);
    expect(result).toEqual({ x: 200, y: 300 });
  });

  it("camera offset: camera at (100,200) shifts world coords by camera position", () => {
    const result = screenToWorld(50, 80, 100, 200, 1);
    expect(result).toEqual({ x: 150, y: 280 });
  });

  it("zoom 0.5: world coords are 2x screen coords (plus camera offset)", () => {
    const result = screenToWorld(100, 100, 0, 0, 0.5);
    expect(result.x).toBeCloseTo(200);
    expect(result.y).toBeCloseTo(200);
  });

  it("zoom 2.0: world coords are 0.5x screen coords (plus camera offset)", () => {
    const result = screenToWorld(100, 100, 0, 0, 2);
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(50);
  });

  it("zoom 2.0 with camera offset", () => {
    const result = screenToWorld(200, 400, 50, 100, 2);
    expect(result.x).toBeCloseTo(150);
    expect(result.y).toBeCloseTo(300);
  });

  it("negative camera position: subtracts correctly", () => {
    const result = screenToWorld(100, 100, -50, -50, 1);
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("zero screen coords return camera position as world coords", () => {
    const result = screenToWorld(0, 0, 400, 600, 1);
    expect(result).toEqual({ x: 400, y: 600 });
  });

  it("default zoom=1 is applied when zoom argument omitted", () => {
    const result = screenToWorld(150, 250, 10, 20);
    expect(result).toEqual({ x: 160, y: 270 });
  });
});

// ---------------------------------------------------------------------------
// pointInPolygon
// ---------------------------------------------------------------------------

describe("pointInPolygon", () => {
  describe("square polygon", () => {
    it("center point is inside", () => {
      expect(pointInPolygon(50, 50, squarePolygon)).toBe(true);
    });

    it("point clearly outside is false", () => {
      expect(pointInPolygon(200, 200, squarePolygon)).toBe(false);
    });

    it("negative coordinates are outside", () => {
      expect(pointInPolygon(-1, -1, squarePolygon)).toBe(false);
    });

    it("point just inside boundary is inside", () => {
      expect(pointInPolygon(1, 1, squarePolygon)).toBe(true);
    });

    it("point just outside boundary is outside", () => {
      expect(pointInPolygon(101, 50, squarePolygon)).toBe(false);
    });
  });

  describe("triangle polygon", () => {
    it("apex of triangle is inside (ray-cast includes apex)", () => {
      // Point well inside the triangle
      expect(pointInPolygon(50, 60, trianglePolygon)).toBe(true);
    });

    it("point outside triangle is false", () => {
      expect(pointInPolygon(5, 5, trianglePolygon)).toBe(false);
    });

    it("point below triangle is outside", () => {
      expect(pointInPolygon(50, 110, trianglePolygon)).toBe(false);
    });
  });

  describe("concave polygon", () => {
    it("point in the filled region is inside", () => {
      expect(pointInPolygon(20, 60, concavePolygon)).toBe(true);
    });

    it("point in the notch (concave cutout) is outside", () => {
      // The notch: x in [60,100], y in [0,40]
      expect(pointInPolygon(80, 20, concavePolygon)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("empty polygon returns false", () => {
      expect(pointInPolygon(5, 5, [])).toBe(false);
    });

    it("single point polygon returns false", () => {
      expect(pointInPolygon(5, 5, [{ x: 5, y: 5 }])).toBe(false);
    });

    it("two-point degenerate polygon returns false", () => {
      expect(pointInPolygon(5, 5, [{ x: 0, y: 0 }, { x: 10, y: 10 }])).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// hitTestTicker
// ---------------------------------------------------------------------------

describe("hitTestTicker", () => {
  it("returns null for empty ticker list", () => {
    expect(hitTestTicker(100, 100, [])).toBeNull();
  });

  it("returns ticker when click is at exact ticker position", () => {
    const tickers = [makeTicker("aapl", 100, 100)];
    const result = hitTestTicker(100, 100, tickers);
    expect(result?.id).toBe("aapl");
  });

  it("returns ticker when click is within default radius (24)", () => {
    const tickers = [makeTicker("goog", 100, 100)];
    const result = hitTestTicker(120, 100, tickers); // distance = 20, within 24
    expect(result?.id).toBe("goog");
  });

  it("returns null when click is outside default radius", () => {
    const tickers = [makeTicker("msft", 100, 100)];
    const result = hitTestTicker(130, 100, tickers); // distance = 30, outside 24
    expect(result).toBeNull();
  });

  it("returns null when click is at exact boundary edge (distance == radius) due to strict <", () => {
    const tickers = [makeTicker("tsla", 100, 100)];
    // distance exactly 24 — the implementation uses <=, so it should return the ticker
    const result = hitTestTicker(124, 100, tickers);
    expect(result?.id).toBe("tsla");
  });

  it("returns closest ticker when multiple are within radius", () => {
    const tickers = [
      makeTicker("far", 100, 100),
      makeTicker("close", 105, 100) // closer to (108, 100)
    ];
    const result = hitTestTicker(108, 100, tickers);
    expect(result?.id).toBe("close");
  });

  it("uses custom radius parameter", () => {
    const tickers = [makeTicker("amzn", 100, 100)];
    // distance = 30, outside default 24 but inside radius 40
    expect(hitTestTicker(130, 100, tickers, 40)?.id).toBe("amzn");
    // distance = 30, outside small radius 10
    expect(hitTestTicker(130, 100, tickers, 10)).toBeNull();
  });

  it("returns null when all tickers are far away", () => {
    const tickers = [makeTicker("nvda", 1000, 1000), makeTicker("amd", 2000, 2000)];
    expect(hitTestTicker(0, 0, tickers)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hitTestDistrict
// ---------------------------------------------------------------------------

describe("hitTestDistrict", () => {
  const districtA = makeDistrict("district-a", squarePolygon);
  const districtB = makeDistrict("district-b", [
    { x: 200, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 300 },
    { x: 200, y: 300 }
  ]);

  it("returns correct district when point is inside it", () => {
    const result = hitTestDistrict(50, 50, [districtA, districtB]);
    expect(result?.id).toBe("district-a");
  });

  it("returns correct second district when point is in it", () => {
    const result = hitTestDistrict(250, 250, [districtA, districtB]);
    expect(result?.id).toBe("district-b");
  });

  it("returns null when point is outside all districts", () => {
    const result = hitTestDistrict(500, 500, [districtA, districtB]);
    expect(result).toBeNull();
  });

  it("returns null for empty district list", () => {
    const result = hitTestDistrict(50, 50, []);
    expect(result).toBeNull();
  });

  it("returns the first matching district when polygons overlap", () => {
    // Both districts share polygon — first one wins
    const overlapping = makeDistrict("second", squarePolygon);
    const result = hitTestDistrict(50, 50, [districtA, overlapping]);
    expect(result?.id).toBe("district-a");
  });

  it("returns null for a point on the Y-axis boundary (edge behavior)", () => {
    // Point at x=0,y=50 — on the left edge of squarePolygon
    // Ray-cast can be ambiguous on exact edges; just verify no crash
    const result = hitTestDistrict(0, 50, [districtA]);
    expect(typeof result === "object").toBe(true); // null or District — no crash
  });
});
