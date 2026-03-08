"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { worldColliders } from "@/mock/cityWorld";
import { WORLD_HEIGHT, WORLD_WIDTH, cameraTopLeftForWorldPoint, clamp, clampCameraPosition } from "@/lib/world";
import { useNeonStore } from "@/store/useNeonStore";

type DragState = {
  active: boolean;
  moved: boolean;
  pointerId: number | null;
  lastClientX: number;
  lastClientY: number;
  lastTime: number;
};

const isTextField = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable || target.closest("[data-ignore-camera-keys='true']") !== null;
};

const collidesAt = (x: number, y: number) => {
  const playerBox = { x: x - 10, y: y - 14, width: 20, height: 24 };
  return worldColliders.some(
    (collider) =>
      playerBox.x < collider.x + collider.width &&
      playerBox.x + playerBox.width > collider.x &&
      playerBox.y < collider.y + collider.height &&
      playerBox.y + playerBox.height > collider.y
  );
};

export function useCameraControls(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState>({
    active: false,
    moved: false,
    pointerId: null,
    lastClientX: 0,
    lastClientY: 0,
    lastTime: 0
  });
  const keysRef = useRef(new Set<string>());
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      useNeonStore.getState().setViewport(width, height);
    });

    resizeObserver.observe(canvas);

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const state = useNeonStore.getState();
      const newZoom = Math.max(0.5, Math.min(2.0, state.camera.zoom + delta));
      useNeonStore.getState().setZoom(newZoom);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [canvasRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextField(event.target)) {
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", "Shift"].includes(event.key)) {
        keysRef.current.add(event.key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const step = (timestamp: number) => {
      const state = useNeonStore.getState();
      const { camera, player, scenePulse } = state;

      if (scenePulse.expiresAt && scenePulse.expiresAt <= Date.now()) {
        useNeonStore.setState({
          stormModeActive: false,
          scenePulse: {
            districtId: null,
            startedAt: 0,
            expiresAt: 0,
            kind: null
          }
        });
      }

      const previousTimestamp = lastFrameRef.current ?? timestamp;
      const dt = Math.min(2, (timestamp - previousTimestamp) / 16.6667);
      lastFrameRef.current = timestamp;

      const fast = keysRef.current.has("Shift");
      const playerSpeed = fast ? 5.8 : 3.6;
      const horizontal =
        (keysRef.current.has("ArrowRight") || keysRef.current.has("d") || keysRef.current.has("D") ? 1 : 0) -
        (keysRef.current.has("ArrowLeft") || keysRef.current.has("a") || keysRef.current.has("A") ? 1 : 0);
      const vertical =
        (keysRef.current.has("ArrowDown") || keysRef.current.has("s") || keysRef.current.has("S") ? 1 : 0) -
        (keysRef.current.has("ArrowUp") || keysRef.current.has("w") || keysRef.current.has("W") ? 1 : 0);

      if (horizontal !== 0 || vertical !== 0) {
        useNeonStore.getState().markWorldMotion();
        const magnitude = Math.hypot(horizontal, vertical) || 1;
        const stepX = (horizontal / magnitude) * playerSpeed * dt;
        const stepY = (vertical / magnitude) * playerSpeed * dt;
        const proposedX = clamp(player.x + stepX, 18, WORLD_WIDTH - 18);
        const proposedY = clamp(player.y + stepY, 18, WORLD_HEIGHT - 18);
        const safeX = collidesAt(proposedX, player.y) ? player.x : proposedX;
        const safeY = collidesAt(safeX, proposedY) ? player.y : proposedY;
        const facing = Math.abs(horizontal) > Math.abs(vertical) ? (horizontal > 0 ? "right" : "left") : vertical > 0 ? "down" : "up";

        useNeonStore.getState().setPlayer({
          x: safeX,
          y: safeY,
          vx: safeX === player.x ? 0 : stepX,
          vy: safeY === player.y ? 0 : stepY,
          facing
        });
      } else if (Math.abs(player.vx) > 0.01 || Math.abs(player.vy) > 0.01) {
        useNeonStore.getState().setPlayer({
          vx: player.vx * 0.72,
          vy: player.vy * 0.72
        });
      }

      if (!dragStateRef.current.active) {
        let x = camera.x;
        let y = camera.y;
        let vx = camera.vx;
        let vy = camera.vy;

        if (camera.targetX !== null && camera.targetY !== null && horizontal === 0 && vertical === 0) {
          if (Math.abs(camera.targetX - x) > 0.8 || Math.abs(camera.targetY - y) > 0.8) {
            useNeonStore.getState().markWorldMotion();
          }
          const dx = camera.targetX - x;
          const dy = camera.targetY - y;
          x += dx * Math.min(0.24 * dt, 0.32);
          y += dy * Math.min(0.24 * dt, 0.32);
          vx = dx * 0.08;
          vy = dy * 0.08;

          if (Math.abs(dx) < 0.8 && Math.abs(dy) < 0.8) {
            x = camera.targetX;
            y = camera.targetY;
            useNeonStore.getState().setCamera({ x, y, vx: 0, vy: 0, targetX: null, targetY: null });
          } else {
            useNeonStore.getState().setCamera({ x, y, vx, vy });
          }
        } else if (horizontal !== 0 || vertical !== 0) {
          useNeonStore.getState().clearCameraTarget();
          const playerCamera = cameraTopLeftForWorldPoint(
            useNeonStore.getState().player.x,
            useNeonStore.getState().player.y,
            camera.viewportWidth,
            camera.viewportHeight
          );
          const dx = playerCamera.x - x;
          const dy = playerCamera.y - y;
          x += dx * Math.min(0.18 * dt, 0.28);
          y += dy * Math.min(0.18 * dt, 0.28);
          vx = dx * 0.1;
          vy = dy * 0.1;
          useNeonStore.getState().setCamera({ x, y, vx, vy });
        } else {
          if (Math.abs(vx) > 0.06 || Math.abs(vy) > 0.06) {
            useNeonStore.getState().markWorldMotion();
          }
          x += vx * dt;
          y += vy * dt;

          const clamped = clampCameraPosition(x, y, camera.viewportWidth, camera.viewportHeight, camera.zoom);
          if (clamped.x !== x) {
            vx *= 0.42;
            x = clamped.x;
          }
          if (clamped.y !== y) {
            vy *= 0.42;
            y = clamped.y;
          }

          vx *= Math.pow(0.93, dt);
          vy *= Math.pow(0.93, dt);

          if (Math.abs(vx) < 0.03) {
            vx = 0;
          }
          if (Math.abs(vy) < 0.03) {
            vy = 0;
          }

          useNeonStore.getState().setCamera({ x, y, vx, vy });
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(step);
    };

    animationFrameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    const now = performance.now();
    dragStateRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      lastTime: now
    };
    useNeonStore.getState().clearCameraTarget();
    useNeonStore.getState().markWorldMotion();
    setIsDragging(false);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return;
    }

    const state = useNeonStore.getState();
    const now = performance.now();
    const dx = event.clientX - drag.lastClientX;
    const dy = event.clientY - drag.lastClientY;
    const dt = Math.max(8, now - drag.lastTime);
    drag.moved ||= Math.hypot(dx, dy) > 2;

    if (drag.moved) {
      setIsDragging(true);
      useNeonStore.getState().markWorldMotion();
    }

    const maxX = Math.max(0, WORLD_WIDTH - state.camera.viewportWidth / state.camera.zoom);
    const maxY = Math.max(0, WORLD_HEIGHT - state.camera.viewportHeight / state.camera.zoom);

    let nextX = state.camera.x - dx;
    let nextY = state.camera.y - dy;

    if (nextX < 0 || nextX > maxX) {
      nextX = state.camera.x - dx * 0.35;
    }
    if (nextY < 0 || nextY > maxY) {
      nextY = state.camera.y - dy * 0.35;
    }

    const clamped = clampCameraPosition(nextX, nextY, state.camera.viewportWidth, state.camera.viewportHeight, state.camera.zoom);

    useNeonStore.getState().setCamera({
      x: clamped.x,
      y: clamped.y,
      vx: (-dx / dt) * 16.6667,
      vy: (-dy / dt) * 16.6667
    });

    drag.lastClientX = event.clientX;
    drag.lastClientY = event.clientY;
    drag.lastTime = now;
  };

  const releasePointer = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return;
    }

    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }

    drag.active = false;
    drag.pointerId = null;

    window.setTimeout(() => {
      setIsDragging(false);
    }, 0);
  };

  const resetGesture = () => {
    dragStateRef.current.active = false;
    dragStateRef.current.pointerId = null;
    dragStateRef.current.moved = false;
    setIsDragging(false);
  };

  return {
    isDragging,
    gestureMovedRef: dragStateRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: releasePointer,
    onPointerCancel: resetGesture,
    onLostPointerCapture: resetGesture
  };
}
