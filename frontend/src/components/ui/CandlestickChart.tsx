"use client";

import { useEffect, useRef } from "react";
import type { OHLCCandle } from "@/lib/api";

type CandlestickChartProps = {
  candles: OHLCCandle[];
  width?: number;
  height?: number;
};

const UP_COLOR = "#B7FF3C";
const DOWN_COLOR = "#FF3DF2";
const BG_COLOR = "#0A0E16";
const GRID_COLOR = "rgba(51,245,255,0.06)";
const LABEL_COLOR = "rgba(51,245,255,0.35)";

export function CandlestickChart({ candles, width = 280, height = 160 }: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 12, right: 40, bottom: 20, left: 8 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Find price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.08;
    const adjMin = minPrice - pricePadding;
    const adjMax = maxPrice + pricePadding;
    const adjRange = adjMax - adjMin;

    const toY = (price: number) => padding.top + chartH * (1 - (price - adjMin) / adjRange);
    const candleWidth = Math.max(2, Math.min(12, (chartW / candles.length) * 0.7));
    const gap = chartW / candles.length;

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    const gridLines = 4;
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.font = "9px monospace";
    ctx.fillStyle = LABEL_COLOR;
    ctx.textAlign = "right";
    for (let i = 0; i <= gridLines; i++) {
      const price = adjMin + (adjRange * i) / gridLines;
      const y = toY(price);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillText(price.toFixed(1), width - 4, y + 3);
    }

    // Draw candles
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const x = padding.left + gap * i + gap / 2;
      const isUp = c.close >= c.open;
      const color = isUp ? UP_COLOR : DOWN_COLOR;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBottom = toY(Math.min(c.open, c.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    }
  }, [candles, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="rounded-lg"
    />
  );
}
