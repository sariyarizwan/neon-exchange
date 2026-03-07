"use client";

import { useNeonStore } from "@/store/useNeonStore";
import type { District } from "@/types/district";
import type { Ticker } from "@/types/ticker";

export const screenToWorld = (screenX: number, screenY: number, cameraX: number, cameraY: number, zoom = 1) => ({
  x: cameraX + screenX / zoom,
  y: cameraY + screenY / zoom
});

export const pointInPolygon = (x: number, y: number, polygon: Array<{ x: number; y: number }>) => {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1) + xi;
    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

export const hitTestTicker = (worldX: number, worldY: number, tickers: Ticker[], radius = 24) => {
  let match: Ticker | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const ticker of tickers) {
    const distance = Math.hypot(ticker.position.x - worldX, ticker.position.y - worldY);
    if (distance <= radius && distance < bestDistance) {
      bestDistance = distance;
      match = ticker;
    }
  }

  return match;
};

export const hitTestDistrict = (worldX: number, worldY: number, districts: District[]) =>
  districts.find((district) => pointInPolygon(worldX, worldY, district.polygon)) ?? null;

export const useHitTesting = () => {
  const camera = useNeonStore((state) => state.camera);

  return {
    screenToWorld: (screenX: number, screenY: number) => screenToWorld(screenX, screenY, camera.x, camera.y, camera.zoom),
    hitTickerAtScreen: (screenX: number, screenY: number, tickers: Ticker[], radius?: number) => {
      const world = screenToWorld(screenX, screenY, camera.x, camera.y, camera.zoom);
      return hitTestTicker(world.x, world.y, tickers, radius);
    },
    hitDistrictAtScreen: (screenX: number, screenY: number, districts: District[]) => {
      const world = screenToWorld(screenX, screenY, camera.x, camera.y, camera.zoom);
      return hitTestDistrict(world.x, world.y, districts);
    }
  };
};
