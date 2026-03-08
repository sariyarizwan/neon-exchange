export type Point = {
  x: number;
  y: number;
};

export const WORLD_WIDTH = 8000;
export const WORLD_HEIGHT = 5000;
export const HOME_WORLD_POINT: Point = { x: 3500, y: 2600 };

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const clampCameraPosition = (x: number, y: number, viewportWidth: number, viewportHeight: number, zoom = 1) => {
  const effectiveWidth = viewportWidth / zoom;
  const effectiveHeight = viewportHeight / zoom;
  const maxX = Math.max(0, WORLD_WIDTH - effectiveWidth);
  const maxY = Math.max(0, WORLD_HEIGHT - effectiveHeight);

  return {
    x: clamp(x, 0, maxX),
    y: clamp(y, 0, maxY)
  };
};

export const cameraTopLeftForWorldPoint = (x: number, y: number, viewportWidth: number, viewportHeight: number) =>
  clampCameraPosition(x - viewportWidth / 2, y - viewportHeight / 2, viewportWidth, viewportHeight);

export const distanceBetween = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
