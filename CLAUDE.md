# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neon Exchange is a cyberpunk pixel-art city that visualizes the stock market. Sectors become districts, stocks become NPC characters, volatility becomes weather, and liquidity becomes traffic. Currently frontend-only with mock data; backend (live market data, AI agents, Google Cloud infra) is pending.

## Commands

```bash
# Install dependencies (from repo root)
npm run install:frontend

# Dev server (from repo root)
npm run dev

# Build (from repo root)
npm run build

# All commands proxy to frontend/ via --prefix
# You can also run directly from frontend/:
cd frontend && npm run dev
```

No test runner, linter, or formatter is currently configured.

## Architecture

### Monorepo Structure

- `frontend/` — Next.js 15 app (App Router, TypeScript, React 18, TailwindCSS, Zustand)
- `docs/` — Spec documents split by frontend and backend
- Root `package.json` — Workspace scripts that proxy into `frontend/`

### Legacy Files (CORO project)

`frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/vite.config.js`, and `frontend/src/components/*.jsx` (CoroBackdrop, HostDashboard, EntryScreen, etc.) are leftover from a previous Vite+React project. They are **not used** by the Next.js app. The active app entry point is `frontend/src/app/layout.tsx`.

### Frontend Architecture

**Routing** (`frontend/src/app/`):
- `/` — Main city page (auth-gated, redirects to `/login`)
- `/login` — Mock auth login
- `/signup` — Mock auth signup

**Page Layout** (floating panels in `page.tsx`):
- `FloatingControls` — Top-left: districts panel, settings, ticker search, avatar picker
- `CenterStage` — Wraps `CityCanvas` (the HTML canvas world renderer)
- `FloatingDistrictIndicators` — Floating district name indicators
- `RightPanel` — Resizable tabbed intel view (scenarios, alliances, evidence)
- `DistrictPopup` — Candlestick chart + stats popup for selected district
- `FloatingChat` — AI-powered market intel chat panel (bottom-right)
- `FloatingMinimap` — Minimap + legend + zoom controls (bottom-right)

**City Renderer** (`frontend/src/components/city/`):
- `CityCanvas.tsx` — Large canvas component that renders the entire 8000x5000 pixel world: districts (with name labels), NPCs, props, weather effects, vault-style newsstands with vendor NPCs, player avatar. Has off-screen zone culling.
- `useCameraControls.ts` — WASD/arrow key movement + drag-to-pan + smooth camera interpolation. No scroll zoom (button-only). No collision (walk-through mode).
- `useHitTesting.ts` — Screen-to-world coordinate conversion and district polygon hit testing

**Reusable UI** (`frontend/src/components/ui/`):
- `ResizablePanel.tsx` — Drag-to-resize panel with 8 handles (edges + corners), localStorage persistence, min/max constraints
- `CandlestickChart.tsx` — Canvas-based OHLC candlestick chart (green up, magenta down)

**Hooks** (`frontend/src/hooks/`):
- `useMarketData.ts` — Polls `/api/market/snapshot`, accumulates synthetic OHLC candles from price snapshots
- `useChat.ts` — Chat state management, sends to `/api/chat` with district/ticker context, offline fallback

**State** (`frontend/src/store/useNeonStore.ts`):
Single Zustand store managing: selected ticker/district, camera position, player position/avatar, right panel tab, dock state (mic, transcript, persona), plugin mode, newsstand overlays, storm mode, evidence timeline, scene pulses, district popup state.

**API Client** (`frontend/src/lib/api.ts`):
Functions for market state, news, bootstrap, analysis, SSE stream, voice WebSocket, market snapshots, ticker history, and chat.

**Mock Data** (`frontend/src/mock/`):
- `districts.ts` — 8 districts with polygon boundaries, sector mappings, regime states
- `tickers.ts` — 23 stock NPCs with positions, archetypes, moods, alliances
- `cityWorld.ts` — Props, citizens, newsstands, avatar options, NPC profiles
- `scenarios.ts` / `rumors.ts` — Scenario cards and rumor content
- `cityThemes.ts` — Per-district visual themes

**Auth** (`frontend/src/lib/mockAuth.ts`):
localStorage-based mock auth. No real backend. Any credentials work. Stored under key `neon-exchange-auth`.

**World Geometry** (`frontend/src/lib/world.ts`):
World is 8000x5000px. Home point at (3500, 2600). Camera clamping and coordinate utilities.

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Design System

Tailwind extended with cyberpunk tokens:
- Base colors: `base-950`, `base-900`, `base-800` (near-black backgrounds)
- Neon accents: `neon-cyan`, `neon-magenta`, `neon-lime`, `neon-amber`
- Custom shadows: `shadow-neon-cyan`, `shadow-neon-magenta`, `shadow-panel`
- Animations: `flicker`, `drift`, `pulseSoft`
- CSS overlays in `globals.css`: `.noise-overlay`, `.scanline-overlay`, `.glass-panel`, `.storm-tint-overlay`

## Key Conventions

- All Next.js pages/components using hooks or browser APIs are marked `"use client"`
- Immutable state updates throughout the Zustand store (spread + return new object)
- District polygons define irregular boundaries used for hit testing and rendering
- Each ticker NPC has a fixed world position, district assignment, archetype, mood, and alliance graph
- Keyboard shortcuts: `/` focuses ticker search, `Escape` clears selection, `Space` toggles mic
- Zoom is button-only (no scroll wheel). Player has no collision (walk-through mode).
- District labels appear on canvas at zoom >= 0.6
- Newsstands are vault-style 70x50 stalls with vendor NPCs
- Chat input and ResizablePanel handles use `data-ignore-camera-keys="true"` to prevent WASD interference
