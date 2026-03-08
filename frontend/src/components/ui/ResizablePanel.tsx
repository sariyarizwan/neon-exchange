"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ResizablePanelProps = {
  children: ReactNode;
  initialWidth: number;
  initialHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  storageKey?: string;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
};

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const EDGE_SIZE = 6;
const CORNER_SIZE = 12;

const cursorMap: Record<ResizeEdge, string> = {
  n: "cursor-ns-resize",
  s: "cursor-ns-resize",
  e: "cursor-ew-resize",
  w: "cursor-ew-resize",
  ne: "cursor-nesw-resize",
  sw: "cursor-nesw-resize",
  nw: "cursor-nwse-resize",
  se: "cursor-nwse-resize",
};

const readStoredSize = (key: string, fallback: { width: number; height: number }) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (typeof parsed.width === "number" && typeof parsed.height === "number") {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    // ignore
  }
  return fallback;
};

export function ResizablePanel({
  children,
  initialWidth,
  initialHeight,
  minWidth = 200,
  minHeight = 150,
  maxWidth,
  maxHeight,
  storageKey,
  className,
  style,
  onClose,
}: ResizablePanelProps) {
  const resolvedMaxWidth = maxWidth ?? (typeof window !== "undefined" ? window.innerWidth - 40 : 1200);
  const resolvedMaxHeight = maxHeight ?? (typeof window !== "undefined" ? window.innerHeight - 40 : 800);

  const [size, setSize] = useState(() => {
    const fallback = { width: initialWidth, height: initialHeight };
    return storageKey ? readStoredSize(storageKey, fallback) : fallback;
  });

  const dragRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    pointerId: number;
  } | null>(null);

  const clampSize = useCallback(
    (w: number, h: number) => ({
      width: Math.max(minWidth, Math.min(resolvedMaxWidth, w)),
      height: Math.max(minHeight, Math.min(resolvedMaxHeight, h)),
    }),
    [minWidth, minHeight, resolvedMaxWidth, resolvedMaxHeight]
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(size));
    } catch {
      // ignore
    }
  }, [storageKey, size]);

  const onHandlePointerDown = useCallback(
    (edge: ResizeEdge) => (e: ReactPointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: size.width,
        startHeight: size.height,
        pointerId: e.pointerId,
      };
    },
    [size]
  );

  const onHandlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.stopPropagation();

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      let newWidth = drag.startWidth;
      let newHeight = drag.startHeight;

      if (drag.edge.includes("e")) newWidth = drag.startWidth + dx;
      if (drag.edge.includes("w")) newWidth = drag.startWidth - dx;
      if (drag.edge.includes("s")) newHeight = drag.startHeight + dy;
      if (drag.edge.includes("n")) newHeight = drag.startHeight - dy;

      setSize(clampSize(newWidth, newHeight));
    },
    [clampSize]
  );

  const onHandlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (dragRef.current && (e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }, []);

  const handleProps = (edge: ResizeEdge) => ({
    onPointerDown: onHandlePointerDown(edge),
    onPointerMove: onHandlePointerMove,
    onPointerUp: onHandlePointerUp,
    onPointerCancel: onHandlePointerUp,
  });

  return (
    <div
      data-ignore-camera-keys="true"
      className={cn(
        "relative rounded-2xl border border-white/10 bg-slate-950/94 backdrop-blur-md",
        className
      )}
      style={{ width: size.width, height: size.height, ...style }}
    >
      {children}

      {/* Edge handles */}
      <div {...handleProps("n")} className={`absolute -top-[3px] left-[${CORNER_SIZE}px] right-[${CORNER_SIZE}px] h-[${EDGE_SIZE}px] cursor-ns-resize`} style={{ top: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE }} />
      <div {...handleProps("s")} className="cursor-ns-resize" style={{ position: "absolute", bottom: -3, left: CORNER_SIZE, right: CORNER_SIZE, height: EDGE_SIZE }} />
      <div {...handleProps("w")} className="cursor-ew-resize" style={{ position: "absolute", left: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE }} />
      <div {...handleProps("e")} className="cursor-ew-resize" style={{ position: "absolute", right: -3, top: CORNER_SIZE, bottom: CORNER_SIZE, width: EDGE_SIZE }} />

      {/* Corner handles */}
      <div {...handleProps("nw")} className="cursor-nwse-resize" style={{ position: "absolute", top: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE }} />
      <div {...handleProps("ne")} className="cursor-nesw-resize" style={{ position: "absolute", top: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE }} />
      <div {...handleProps("sw")} className="cursor-nesw-resize" style={{ position: "absolute", bottom: -3, left: -3, width: CORNER_SIZE, height: CORNER_SIZE }} />
      <div {...handleProps("se")} className="cursor-nwse-resize" style={{ position: "absolute", bottom: -3, right: -3, width: CORNER_SIZE, height: CORNER_SIZE }} />
    </div>
  );
}
