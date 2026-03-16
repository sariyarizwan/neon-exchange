"use client";

import { useEffect, useState } from "react";

type SpotlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type TutorialSpotlightProps = {
  target: string | null;
};

const PADDING = 8;
const BORDER_RADIUS = 12;

export function TutorialSpotlight({ target }: TutorialSpotlightProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  useEffect(() => {
    if (!target) {
      setRect(null);
      return;
    }

    const measure = () => {
      const element = document.querySelector(`[data-tutorial-target="${target}"]`);
      if (!element) {
        setRect(null);
        return;
      }
      const bounds = element.getBoundingClientRect();
      setRect({
        x: bounds.left - PADDING,
        y: bounds.top - PADDING,
        width: bounds.width + PADDING * 2,
        height: bounds.height + PADDING * 2,
      });
    };

    measure();

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
    };
  }, [target]);

  // Full dark overlay with no cutout
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[9998] bg-black/75"
        aria-hidden="true"
      />
    );
  }

  // Overlay with SVG mask cutout
  return (
    <div className="fixed inset-0 z-[9998]" aria-hidden="true">
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={BORDER_RADIUS}
              ry={BORDER_RADIUS}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>
      {/* Glowing border around cutout */}
      <div
        className="pointer-events-none fixed"
        style={{
          left: rect.x,
          top: rect.y,
          width: rect.width,
          height: rect.height,
          borderRadius: BORDER_RADIUS,
          boxShadow:
            "0 0 0 2px rgba(51, 245, 255, 0.6), 0 0 20px rgba(51, 245, 255, 0.3), 0 0 40px rgba(51, 245, 255, 0.15)",
        }}
      />
    </div>
  );
}
