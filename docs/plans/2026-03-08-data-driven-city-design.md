# Data-Driven City + End-to-End Integration Design

**Date:** 2026-03-08
**Status:** Approved
**Context:** Feedback from review — make city visuals driven by real market data, remove mock data dependencies

## Problem

The backend already computes rich market signals (volatility regimes, correlations, sector strength, district states with weather/traffic/mood) every 2 seconds. The frontend ignores all of it, using static mock files for moods, alliances, scenarios, rumors, and news. The city feels decorative rather than data-driven.

## Goals

1. Weather = volatility regime (per district, not global)
2. Traffic = liquidity (citizen density + speed)
3. Crowds around NPC = volume/attention (momentum-based clustering)
4. NPC mood/animation = trend strength + momentum (not static)
5. District alliance cables = correlation (neon lines between districts)
6. News as exploration mechanic (NPC bubbles, not just a panel)
7. Quest-like toasts giving players reasons to move

Plus: remove all mock data for dynamic content; end-to-end backend integration.

## Architecture

### Data Flow

```
Backend WorldSnapshot (rebuilt every 2s)
  ├── neon_tickers: prices, moods, momentum, regimes, alliances
  ├── district_states: weather, traffic, mood, glow_intensity
  ├── signals: correlations, sector_strength, regimes, breadth
  └── news: classified headlines

        ↓ SSE /api/world/neon-stream (expanded payload)

Frontend LiveDataProvider (expanded React context)
  ├── tickers: Record<neonId, NeonTickerData>
  ├── districtStates: Record<districtId, DistrictState>
  ├── signals: { correlations, sectorStrength, breadth }
  ├── news: NewsItem[]
  └── marketMood: string

        ↓ consumed by all components
```

### Approach: Expand SSE Stream

Instead of adding multiple polling hooks, expand the existing `/api/world/neon-stream` SSE to include `district_states` and `signals` alongside tickers and news. One subscription, all data, rebuilt atomically every 2 seconds.

## Backend Changes

### Expand `/api/world/neon-stream` payload

Add to the SSE event:
```json
{
  "tickers": { ... },
  "news": [ ... ],
  "tick": 42,
  "district_states": {
    "chip-docks": { "weather": "storm", "traffic": "heavy", "mood": "tense", "glow_intensity": 0.8 },
    ...
  },
  "signals": {
    "correlations": { "top_positive": [...], "top_negative": [...] },
    "sector_strength": { "Tech": { "strength": 2.3, "rank": 1, "trend": "improving" }, ... },
    "breadth": { "advancers": 15, "decliners": 8, "signal": "bullish" }
  }
}
```

### Add `/api/chat` endpoint

POST endpoint that forwards user message + market context to Gemini for market intel chat responses.

## Frontend Changes

### LiveDataProvider expansion

Add `districtStates` and `signals` to the context value. The `useLiveMarket` hook parses the expanded SSE payload and stores the new fields.

### CityCanvas — Weather per District (Feedback #1)

For each district zone, render weather particles based on `districtStates[id].weather`:
- `clear`: light ambient dust, no rain
- `rain`: moderate rain drops constrained to district polygon bounds
- `storm`: heavy rain + periodic lightning flash (white rect over zone, 100ms) + system toast
- `fog`: reduced opacity (0.4) for district zone rendering

System toast on weather change: "Storm Mode: volatility jumped in {DISTRICT}."

### CityCanvas — Traffic as Citizen Density (Feedback #2)

Scale citizen NPC count per district based on `districtStates[id].traffic`:
- `low`: 2 citizens, slow speed
- `normal`: 5 citizens, normal speed
- `heavy`: 10 citizens, normal speed
- `gridlock`: 15 citizens, very slow (0.3x speed)

Citizens spawn at random positions within district bounds and patrol.

### CityCanvas — Crowd Clustering (Feedback #3)

For tickers where `|momentum| > 0.5`, spawn 2-4 temporary "crowd" NPCs near the ticker NPC position (within 60px radius). More momentum = more crowd NPCs. Crowd NPCs face toward the ticker NPC.

### CityCanvas — NPC Mood Animation (Feedback #4)

Driven by live `mood` and `momentum` from backend ticker data:
- `confident` + high momentum: bright aura (full opacity), fast patrol speed, smooth movement
- `nervous` + low momentum: dim aura (40% opacity), fidgeting (2px position jitter per frame), slow patrol
- `erratic` + negative momentum: glitch aura (random flicker between colors), random direction changes every 0.5s

### CityCanvas — Alliance Cables (Feedback #5)

Draw neon lines between district centers for `top_positive` correlations above 0.5:
- Line from `district_a.center` to `district_b.center` in world coordinates
- Color: blended accent colors of the two districts
- Opacity: correlation mapped from [0.5, 1.0] to [0.3, 0.8]
- Width: 2-4px based on strength
- Animation: gentle pulse (opacity oscillation)
- Flickering when correlation < 0.3 (breaking alliance)

Interactive: click near a cable to show tooltip "Alliance: {Sector A} <-> {Sector B} moving together (corr {value})."

### News as Mechanic (Feedback #6)

When news arrives via SSE:
1. Match news to affected tickers/districts
2. Show speech bubble above affected ticker NPC for 8 seconds with headline
3. Update newsstand overlay in affected district
4. If severity=high: trigger weather/crowd/mood cascading visual changes

### Quest Toasts (Feedback #7)

Floating toast notifications at top-center, auto-dismiss after 6 seconds:
- Weather change: "Storm detected in {DISTRICT} -- find the trigger."
- Big mover (|changePct| > 3%): "Crowd surge around {TICKER} -- talk to them."
- New high correlation: "Alliance formed between {A} and {B} -- inspect the cable."
- New high-severity news: "New rumor dropped in {DISTRICT} -- scan it."

Max 2 toasts visible at once. Queue overflow.

## Mock Data Retirement

| File | Action | Reason |
|------|--------|--------|
| `mock/districts.ts` | Keep (geometry only) | Polygon boundaries, centers, accent colors are fixed world layout |
| `mock/tickers.ts` | Keep (positions + archetypes only) | World positions fixed; mood/trend/alliances now live |
| `mock/cityWorld.ts` | Keep | Static props, citizens base definitions, newsstands |
| `mock/cityThemes.ts` | Keep | Visual theme constants |
| `mock/scenarios.ts` | Remove | Replace with `/api/world/scenarios` |
| `mock/rumors.ts` | Remove | Replace with `/api/world/evidence-feed` |
| `mock/news.ts` | Remove | Replace with live news from SSE |

Components that currently import mock scenarios/rumors/news will be rewired to consume from LiveDataProvider or direct API calls.

## New Zustand Store Fields

```typescript
// Quest toast system
questToasts: Array<{ id: string; text: string; type: string; expiresAt: number }>
addQuestToast(text: string, type: string): void
dismissQuestToast(id: string): void

// Track previous district states for change detection
prevDistrictWeather: Record<string, string>
```

## File Summary

| File | Action |
|------|--------|
| `backend/routers/world_router.py` | Expand neon-stream with district_states + signals |
| `backend/services/cache.py` | Add district_states + signals to neon_stream serialization |
| `frontend/src/lib/api.ts` | Update SSE types, add scenarios/evidence API functions |
| `frontend/src/hooks/useLiveMarket.ts` | Parse expanded SSE payload |
| `frontend/src/components/LiveDataProvider.tsx` | Expose districtStates + signals in context |
| `frontend/src/components/city/CityCanvas.tsx` | Weather per district, alliance cables, crowd clustering, enhanced NPC mood |
| `frontend/src/components/layout/FloatingControls.tsx` | Live traffic from districtStates |
| `frontend/src/components/layout/RightPanel.tsx` | Live alliances from correlations, live evidence |
| `frontend/src/components/layout/DistrictPopup.tsx` | Live weather/mood/glow |
| `frontend/src/store/useNeonStore.ts` | Quest toast state, prev weather tracking |
| `frontend/src/components/layout/QuestToasts.tsx` | NEW: toast notification component |
| `frontend/src/app/page.tsx` | Add QuestToasts component |
| `frontend/src/mock/scenarios.ts` | DELETE |
| `frontend/src/mock/rumors.ts` | DELETE |
| `frontend/src/mock/news.ts` | DELETE |
