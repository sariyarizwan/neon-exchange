# Neon Exchange: Comprehensive Testing Plan + "How to Play" Tutorial

**Date:** 2026-03-15
**Author:** Rahil + Claude
**Status:** DRAFT — awaiting team review

---

## PART 1: COMPREHENSIVE TESTING & BUG DETECTION PLAN

### 1.1 Testing Infrastructure Setup

Before any tests can run, we need to bootstrap a testing framework. Currently **zero tests exist** and **no test runner is configured**.

#### Frontend Testing Stack
| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + integration test runner (fast, Vite-native, ESM-compatible) |
| **React Testing Library** | Component rendering + interaction tests |
| **@testing-library/user-event** | Realistic user interaction simulation |
| **jsdom** | DOM environment for Vitest |
| **Playwright** | E2E browser tests (canvas interaction, auth flows, keyboard shortcuts) |
| **istanbul / v8** | Code coverage reporting |

#### Backend Testing Stack
| Tool | Purpose |
|------|---------|
| **pytest** | Test runner + fixtures |
| **pytest-asyncio** | Async endpoint testing |
| **httpx** | FastAPI TestClient (async) |
| **pytest-cov** | Coverage reporting |
| **responses** / **respx** | Mock HTTP (Finnhub API) |
| **freezegun** | Time-dependent test control |

#### Setup Tasks
1. `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test` in `frontend/`
2. Add `vitest.config.ts` with jsdom environment, `@/*` path alias, CSS module stubs
3. `pip install pytest pytest-asyncio httpx pytest-cov responses freezegun` in `backend/`
4. Add `pytest.ini` with asyncio_mode=auto
5. Add `frontend/package.json` scripts: `"test"`, `"test:watch"`, `"test:coverage"`, `"test:e2e"`
6. Add root `package.json` scripts: `"test:frontend"`, `"test:backend"`, `"test:all"`

---

### 1.2 Sub-Agent Deployment Strategy

We deploy **6 parallel testing sub-agents**, each owning a specific domain. They run in isolated worktrees to avoid conflicts.

```
┌─────────────────────────────────────────────────┐
│              TEST ORCHESTRATOR                   │
│         (coordinates all 6 agents)               │
├────────┬────────┬────────┬────────┬──────┬──────┤
│ Agent1 │ Agent2 │ Agent3 │ Agent4 │ Ag5  │ Ag6  │
│ Store  │ Canvas │ Layout │ Backend│ Hooks│ E2E  │
│ +Lib   │ +City  │ +UI    │ Full   │ +API │ Full │
└────────┴────────┴────────┴────────┴──────┴──────┘
```

#### Agent 1: Store + Library Tests
**Scope:** `useNeonStore.ts`, `world.ts`, `mockAuth.ts`, `cn.ts`, `edgeIndicators.ts`, `api.ts`
**Test Count Target:** ~60 tests

**Store Tests (`useNeonStore.test.ts`):**
- Selection: `setSelectedTickerId` / `setSelectedDistrictId` / clearing
- Camera: `setCamera`, `setZoom`, `zoomIn`/`zoomOut` bounds (0.5–2.0), `setViewport`
- Player: `setPlayerPosition`, `setPlayerFacing` (all 4 directions), `setAvatarId`
- Navigation: `focusWorldPoint` sets targetX/Y, `focusDistrict` looks up center, `focusHome` resets to HOME_WORLD_POINT, `clearCameraTarget` nulls targets
- Trading: `acquireUplink` deducts balance + adds to portfolio, `extractPosition` adds proceeds, insufficient balance rejection, synergy burst (3+ unique tickers in 60s)
- Evidence: `addEvidence` appends, max 16 cap, overflow eviction
- Quest: `addQuestToast`, `dismissQuestToast`, `toggleQuestLog`, `markQuestInactive`
- Mic: `toggleMic` flip, `interruptMic` sets false
- Sound: `setSoundEnabled`, `setSoundVolume` clamped 0–1, `setSoundMode`
- Onboarding: `advanceOnboarding` increments 0→4, caps at 4
- Drone: `setDroneState` accepts "calm"/"alert"/"glitch"
- Pulse: `triggerDistrictPulse` sets stormModeActive + scenePulse, `clearStormMode`
- Focus: `setFocusMode` dims overlays after 400ms, restores on unfocus
- Legend: `toggleLegendOverlay`, `setLegendSeenOnce`
- Immutability: every action returns new object (reference inequality)

**Library Tests:**
- `world.ts`: `clamp` edge cases (at bounds, below, above), `clampCameraPosition` at all 4 edges + zoomed, `cameraTopLeftForWorldPoint` centering math, `distanceBetween` zero/positive
- `mockAuth.ts`: `writeStoredAuth` → `readStoredAuth` roundtrip, `clearStoredAuth` nulls, invalid JSON in localStorage returns null, missing key returns null
- `cn.ts`: empty args, falsy filtering, multiple classes joined
- `edgeIndicators.ts`: `isPointInViewport` inside/outside/edge, `computeIndicators` with known camera state, `rayRectIntersection` for all 4 edges
- `api.ts`: mock fetch for each endpoint (neon-state, snapshot, history, chat, news, evidence, scenarios), SSE stream creation, error responses, timeout handling

#### Agent 2: Canvas + City Component Tests
**Scope:** `CityCanvas.tsx`, `useCameraControls.ts`, `useHitTesting.ts`
**Test Count Target:** ~45 tests

**Hit Testing (`useHitTesting.test.ts`):**
- `screenToWorld`: identity at zoom=1 camera=0,0; offset camera; zoom 0.5 and 2.0
- `pointInPolygon`: inside square, outside square, on edge, inside triangle, concave polygon
- `hitTestTicker`: exact position match, within radius, outside radius, empty list
- `hitTestDistrict`: point inside known district polygon, point outside all, point on boundary

**Camera Controls (`useCameraControls.test.ts`):**
- Keyboard: WASD sets player velocity, arrow keys equivalent, Shift increases speed (5.8 vs 3.6), key up zeroes velocity
- `data-ignore-camera-keys="true"` elements suppress movement
- Drag: pointerDown + pointerMove updates camera, pointerUp stops drag
- Viewport: ResizeObserver callback updates store viewport

**CityCanvas (integration/snapshot):**
- Renders without crash with mock store state
- Calls requestAnimationFrame on mount
- Cleans up animation frame on unmount
- Click at known ticker position fires `setSelectedTickerId`
- Click at empty space clears selection
- Hover updates tooltip state

#### Agent 3: Layout + UI Component Tests
**Scope:** All 15 layout components + 8 UI components
**Test Count Target:** ~70 tests

**FloatingControls:**
- Districts panel toggle open/close
- Ticker search filters by symbol, fullName, archetype
- Ticker search selection calls `setSelectedTickerId` + `focusWorldPoint`
- Avatar picker updates `setAvatarId`
- Logout clears auth + redirects
- Sound toggle calls `setSoundEnabled`

**RightPanel:**
- Tab switching (scenes/alliances/evidence)
- Renders scenario cards from live data or mock fallback
- Alliance tab shows correlation pairs
- Evidence tab shows timeline items (newest first)
- Resizable via ResizablePanel

**DistrictPopup:**
- Opens when `districtPopupId` set
- Shows district name, regime, summary
- Renders CandlestickChart with correct candles
- Close button clears `districtPopupId`

**FloatingMinimap:**
- Renders district polygons scaled to minimap size
- Player dot position matches world position
- Click on minimap focuses camera to world point
- Zoom buttons call `zoomIn` / `zoomOut`

**FloatingChat:**
- Input focuses without triggering camera keys
- Send button calls chat hook
- Messages render in order
- Streaming message shows typing indicator
- Suggested prompts clickable

**TickerTape:**
- Renders scrolling ticker data
- Animation runs continuously

**BreakingNewsAlert:**
- Shows on high-severity news arrival
- Auto-dismisses after timeout
- Flash animation plays

**NewsstandOverlay:**
- Opens when `activeNewsstandDistrictId` set
- Shows filtered news for that district
- Close button clears state

**QuestLog / QuestToasts:**
- QuestLog toggles with `questLogOpen`
- Quest items render with text + type
- QuestToasts stack (max visible), auto-dismiss
- Dismiss button removes toast

**LegendOverlay:**
- Shows on first visit (checks localStorage)
- All weather/traffic/mood entries render
- Close sets `legendSeenOnce`

**TradePanel:**
- Buy updates portfolio + deducts balance
- Sell adds proceeds
- Insufficient balance shows error
- Portfolio list renders held positions

**VoicePanel:**
- Connect button initiates WebSocket
- Mic toggle enables/disables audio capture
- Transcript lines render in order
- Audio level indicator reflects `audioLevel`

**UI Primitives:**
- ResizablePanel: drag handle resizes, min/max constraints enforced, localStorage persistence
- CandlestickChart: renders correct candle count, green up / magenta down colors, handles empty data
- SearchInput, Button, Badge, Card, Toggle, Tabs: render correctly, accept className overrides

#### Agent 4: Backend Full Test Suite
**Scope:** All Python services, routers, agents, schemas
**Test Count Target:** ~80 tests

**Services:**

`test_market_data.py`:
- `generate_tick()` advances prices (non-zero change)
- Micro-perturbation stays within ±15% cap
- `get_ticker_state()` returns correct trend/momentum/volatility_regime
- `get_all_tickers()` returns 23 items
- `get_district_tickers("chip-docks")` returns 3 tickers
- `get_price_history()` returns up to N items
- Mock mode activates when no API key
- Failed Finnhub response doesn't crash (returns None)
- Rate limit (429) triggers warning log
- Batch refresh cycles through all tickers

`test_news_feed.py`:
- `generate_headlines()` returns N items
- Dedup rejects Jaccard > 0.5
- Sector classification matches known keywords
- Ticker extraction: long symbols found, short symbols only via company name
- Severity scoring: "crash" → high, "rally" → medium, "announced" → low
- Mock fallback when no API key
- Empty Finnhub response → mock mode

`test_cache.py`:
- `_rebuild()` produces valid WorldSnapshot
- Double-buffer swap (active_idx flips)
- All pre-serialized JSON fields are valid JSON
- Ticker lookup by neon_id, real_symbol, neon_symbol all resolve
- District summaries computed for all 8 districts
- Market mood computed correctly (euphoric/bullish/cautious/bearish/fearful)
- Neon translation: field names kebab-cased, values mapped
- Sparklines have max 20 points
- Alliance map built from correlations (|r| > 0.3, top 3 per ticker)

`test_signals.py`:
- `_pearson()` returns 1.0 for identical series, -1.0 for inverse, 0.0 for uncorrelated
- `_pearson()` with <5 points returns 0.0
- `compute_correlations()` symmetric matrix
- `compute_sector_strength()` ranks all sectors, detects improving/weakening
- `detect_regimes()` thresholds: <0.5x baseline = calm, ≥3x = storm
- `compute_breadth()` counts advancers/decliners correctly, ratio handles 0 decliners
- `compute_all_signals()` caches correlations for 30s

**Routers:**

`test_market_router.py`:
- `GET /api/market/neon-state` returns 200 + tickers dict
- `GET /api/market/snapshot` returns ticker list
- `GET /api/market/snapshot?district=chip-docks` filters to 3 tickers
- `GET /api/market/history/nvx` returns candle list
- `GET /api/market/ticker/NVX` returns single ticker (case-insensitive)
- `GET /api/market/ticker/INVALID` returns error
- `GET /api/market/signals` returns signals without full matrix
- `GET /api/market/sparklines` returns dict keyed by neon_id
- `POST /api/market/tick` advances state

`test_world_router.py`:
- `GET /api/world/state` returns bootstrap
- `GET /api/world/news` returns news list
- `GET /api/world/scenarios` returns scenario list
- `GET /api/world/evidence-feed` returns evidence items
- `POST /api/world/chat` with body returns reply string
- `POST /api/world/chat` without Gemini key returns offline message
- SSE `/api/world/neon-stream` emits events (test with async client)

`test_voice_router.py`:
- WebSocket `/api/voice` connects + receives welcome
- Text message echoed to Gemini
- Invalid JSON returns error message
- Disconnect handled gracefully

**Schemas:**
- All Pydantic models validate correct input
- All models reject missing required fields
- Enum fields reject invalid values

**Shared State:**
- Singleton pattern returns same instance
- `update_market_state()` stores + retrieves
- `add_news()` respects max 50 circular buffer
- `log_event()` respects max 1000 circular buffer
- Thread safety: concurrent updates don't corrupt state

#### Agent 5: Hooks + API Integration Tests
**Scope:** All 8 frontend hooks with mocked backends
**Test Count Target:** ~50 tests

**`useChat.test.ts`:**
- `send()` adds user message + assistant message
- Streaming response appends chunks to last message
- Fallback to non-streaming on error
- `clearError()` resets error state
- Empty input rejected
- Multiple rapid sends don't duplicate

**`useLiveMarket.test.ts`:**
- Connects to EventSource, parses SSE data
- Initial fetch populates tickers
- Graceful fallback when backend down (returns nulls)
- Reconnect on EventSource error

**`useMarketData.test.ts`:**
- Polls every 5s
- Builds candles from price snapshots
- New tick within 4s updates current candle
- Tick after 4s closes candle + opens new
- Max 30 candles per ticker

**`useEvidence.test.ts`:**
- Polls every 10s
- Deduplicates by ID
- Adds new items to store
- Silent failure on backend error

**`useQuestTriggers.test.ts`:**
- Storm → toast "Storm detected in..."
- High momentum (>0.6) → toast "Crowd surge..."
- High correlation (≥0.7) → toast "Alliance formed..."
- New breaking news → toast with headline
- No duplicate toasts for same event

**`useVoice.test.ts`:**
- `connect()` opens WebSocket
- `startSpeaking()` enables audio capture
- `stopSpeaking()` sends "end" message
- `sendText()` sends text message
- Received text appended to transcript (max 30 lines)
- WebSocket error updates connectionState

**`useMicroLegend.test.ts`:**
- Only fires after legend seen once
- Storm → "Storm = volatility spiking..."
- Low traffic → "Empty streets = thin liquidity..."
- Panic mood → "Panic mood = market fear..."

**`useNewsstand.test.ts`:**
- Filters by districtId when provided
- Falls back to all news when no district match
- Max 5 items returned

#### Agent 6: E2E Tests (Playwright)
**Scope:** Full browser tests against running dev server
**Test Count Target:** ~25 tests

**Auth Flow:**
- Visit `/` → redirected to `/login`
- Login with any credentials → redirected to `/`
- Guest login works
- Signup with mismatched passwords shows error
- Logout from settings → back to `/login`

**City Navigation:**
- Canvas renders (check for `<canvas>` element)
- WASD moves player (canvas redraws)
- Click on ticker NPC opens right panel
- `/` key focuses search input
- `Escape` clears selection
- `Q` toggles quest log
- `L` toggles legend overlay
- Zoom in/out buttons change zoom level

**Panel Interactions:**
- Right panel tabs switch content
- District popup opens on district click
- Chat input sends message, receives response (mock)
- Minimap click moves camera
- Ticker tape scrolls

**Data Flow (with mock backend):**
- Live data indicator shows "connected" or "offline"
- Ticker prices update on SSE event
- News arrival triggers breaking alert
- Evidence timeline populates

---

### 1.3 Bug Detection Checklist

Based on the code audit, these are **known bugs and edge cases** each agent should verify:

#### Critical Bugs
| # | Bug | File | Agent |
|---|-----|------|-------|
| 1 | `Space` key toggles mic with no debounce — rapid press causes flicker | `page.tsx:62` | Ag6 |
| 2 | `overlayRestoreTimeout` uses closure variable, never cleaned up on unmount | `useNeonStore.ts` | Ag1 |
| 3 | SSE reconnect has no exponential backoff — can hammer server | `api.ts` createNeonStream | Ag5 |
| 4 | `seenRef` in useEvidence grows without bound (memory leak) | `useEvidence.ts` | Ag5 |
| 5 | Chat stream parser doesn't validate JSON before parse — can throw | `api.ts` createChatStream | Ag5 |
| 6 | CORS is `allow_origins=["*"]` — open to all origins | `main.py` | Ag4 |
| 7 | No error boundary — canvas crash takes down entire app | `page.tsx` | Ag6 |

#### Medium Bugs
| # | Bug | File | Agent |
|---|-----|------|-------|
| 8 | `acquireUplink` doesn't check if ticker exists before buying | `useNeonStore.ts` | Ag1 |
| 9 | Login/signup use `setTimeout(window.location)` — fragile redirect | `login/page.tsx` | Ag3 |
| 10 | CandlestickChart crashes on empty candles array (division by zero in scale) | `CandlestickChart.tsx` | Ag3 |
| 11 | Ticker history OHLC is synthetic (open=close=price, H/L ±0.1%) — misleading | `market_router.py` | Ag4 |
| 12 | Breadth ratio can be Infinity when decliners=0 | `signals.py` | Ag4 |
| 13 | News bubble text can overflow canvas edge (no clamp) | `CityCanvas.tsx` | Ag2 |
| 14 | Evidence feed has no pagination — returns ALL items | `world_router.py` | Ag4 |

#### Low / UX Bugs
| # | Bug | File | Agent |
|---|-----|------|-------|
| 15 | Chat messages don't auto-scroll to latest | `FloatingChat.tsx` | Ag3 |
| 16 | No loading spinner on initial page load after auth check | `page.tsx` | Ag6 |
| 17 | Drag-pan camera overshoots at world edges | `useCameraControls.ts` | Ag2 |
| 18 | O(n) hit testing on every click — 23 tickers checked sequentially | `useHitTesting.ts` | Ag2 |
| 19 | Ticker search doesn't highlight matching text | `FloatingControls.tsx` | Ag3 |
| 20 | Context value in LiveDataProvider not memoized — re-renders on every tick | `LiveDataProvider.tsx` | Ag5 |

---

### 1.4 Coverage Targets

| Domain | Target | Rationale |
|--------|--------|-----------|
| Store (Zustand) | 95% | Core state logic, must be bulletproof |
| Library utils | 90% | Pure functions, easy to test |
| Hooks | 80% | Integration with external APIs, some mocking needed |
| Layout components | 75% | UI rendering, some interaction testing |
| Canvas/City | 60% | Hard to unit test canvas, focus on hooks + hit testing |
| Backend services | 90% | Core business logic |
| Backend routers | 85% | API contract validation |
| Backend agents | 50% | LLM-dependent, test structure not output |
| E2E | Critical paths | Auth, navigation, selection, data flow |

---

### 1.5 Execution Order

```
Phase 0: Setup (1 session)
  → Install test frameworks
  → Configure Vitest + pytest
  → Add npm/pip scripts

Phase 1: Parallel Agent Deployment (1 session, 6 agents)
  → All 6 agents write tests in isolated worktrees
  → Each agent also fixes bugs it finds in its domain

Phase 2: Integration (1 session)
  → Merge all agent worktrees
  → Run full test suite
  → Fix any cross-domain failures

Phase 3: CI Pipeline (1 session)
  → Add GitHub Actions workflow
  → Run on PR: lint + type-check + test:frontend + test:backend
  → Coverage report as PR comment
```

---

## PART 2: "HOW TO PLAY" TUTORIAL IMPLEMENTATION PLAN

### 2.1 Overview

A **one-time, skippable, step-by-step onboarding tutorial** that teaches new players how to navigate Neon Exchange. It follows the existing cyberpunk glass-panel UI aesthetic and uses the `onboardingStep` state already in the Zustand store.

**Trigger:** First login (no `neon-exchange-tutorial-complete` in localStorage)
**Skip:** "Skip Tutorial" button on every step
**Steps:** 7 steps (concise, each teaches one concept)
**Style:** Full-screen glass overlay with spotlight cutouts highlighting the relevant UI element

### 2.2 Tutorial Steps

```
Step 0: WELCOME
┌──────────────────────────────────────────┐
│  ◈ WELCOME TO NEON EXCHANGE ◈            │
│                                          │
│  This city is alive with the stock       │
│  market. Sectors are districts. Stocks   │
│  are NPCs. Volatility is weather.        │
│  Liquidity is traffic.                   │
│                                          │
│  Let's show you around.                  │
│                                          │
│  [Next →]              [Skip Tutorial]   │
└──────────────────────────────────────────┘
Spotlight: None (full overlay)
```

```
Step 1: MOVEMENT
┌──────────────────────────────────────────┐
│  ◈ MOVING AROUND ◈                       │
│                                          │
│  Use WASD or Arrow Keys to walk.         │
│  Hold Shift to sprint.                   │
│  Drag the canvas to pan the camera.      │
│  Use the zoom buttons on the minimap.    │
│                                          │
│  [← Back] [Next →]    [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: Player avatar (center of screen)
Animated hint: Pulsing WASD keys icon
```

```
Step 2: DISTRICTS
┌──────────────────────────────────────────┐
│  ◈ DISTRICTS = MARKET SECTORS ◈          │
│                                          │
│  The city has 8 districts, each a        │
│  market sector: Tech, Finance, Energy,   │
│  Crypto, and more.                       │
│                                          │
│  Open the Districts panel (top-left)     │
│  to see them all and teleport there.     │
│                                          │
│  [← Back] [Next →]    [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: FloatingControls districts button
Animated hint: Arrow pointing to districts panel
```

```
Step 3: TICKER NPCs
┌──────────────────────────────────────────┐
│  ◈ STOCKS ARE NPCs ◈                     │
│                                          │
│  Each character in the city represents   │
│  a stock. Click on one to see its data.  │
│                                          │
│  Their mood shows market sentiment:      │
│  Confident = bullish, Nervous = bearish, │
│  Erratic = high volatility.              │
│                                          │
│  [← Back] [Next →]    [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: Nearest ticker NPC to player
Animated hint: Click cursor icon bouncing
```

```
Step 4: WEATHER & TRAFFIC
┌──────────────────────────────────────────┐
│  ◈ READ THE ENVIRONMENT ◈                │
│                                          │
│  Weather = Volatility                    │
│    Clear → Calm market                   │
│    Rain  → Choppy, moderate risk         │
│    Storm → High volatility, big swings   │
│    Fog   → Uncertain outlook             │
│                                          │
│  Traffic = Liquidity                     │
│    Empty streets → Thin, wide spreads    │
│    Gridlock → Deep, tight spreads        │
│                                          │
│  [← Back] [Next →]    [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: Weather particles in current district
```

```
Step 5: INTEL PANEL
┌──────────────────────────────────────────┐
│  ◈ GATHER INTELLIGENCE ◈                 │
│                                          │
│  The right panel has three tabs:         │
│                                          │
│  Scenarios — AI-generated market         │
│    hypotheses with probability ratings   │
│                                          │
│  Alliances — Correlated stock pairs      │
│    that move together                    │
│                                          │
│  Evidence — Timeline of notable events   │
│                                          │
│  [← Back] [Next →]    [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: RightPanel
Animated hint: Tab switch animation
```

```
Step 6: TOOLS & SHORTCUTS
┌──────────────────────────────────────────┐
│  ◈ YOUR TOOLKIT ◈                        │
│                                          │
│  /  — Search for any ticker              │
│  Q  — Open quest log                     │
│  L  — Legend (weather/traffic meanings)   │
│  Esc — Clear selection                   │
│                                          │
│  Visit newsstands for district news.     │
│  Use chat to ask the AI about markets.   │
│                                          │
│  [← Back] [Finish →]  [Skip Tutorial]    │
└──────────────────────────────────────────┘
Spotlight: Search bar + chat toggle
Animated hint: Keyboard shortcut keys floating
```

### 2.3 Component Architecture

```
frontend/src/components/tutorial/
├── TutorialOverlay.tsx      # Main orchestrator (renders current step)
├── TutorialStep.tsx         # Single step card (glass panel, buttons)
├── TutorialSpotlight.tsx    # Dark overlay with spotlight cutout
├── tutorialSteps.ts         # Step definitions (title, body, spotlight target, position)
└── useTutorial.ts           # Hook: step state, navigation, skip, completion
```

#### `useTutorial.ts` (Hook)
```typescript
interface TutorialState {
  active: boolean;        // tutorial currently showing
  step: number;           // current step index (0-6)
  completed: boolean;     // already finished (from localStorage)
}

// Returns:
{
  active, step, completed,
  next: () => void,       // advance step (or finish on last)
  back: () => void,       // go to previous step
  skip: () => void,       // skip entire tutorial
  restart: () => void,    // restart from step 0 (for settings)
}
```

- On first login: checks `localStorage.getItem("neon-exchange-tutorial-complete")`
- If not found → `active = true, step = 0`
- On `skip()` or last step `next()` → sets localStorage flag, `active = false`
- Exposes `restart()` for a "Replay Tutorial" button in settings

#### `TutorialOverlay.tsx` (Orchestrator)
- Renders only when `active === true`
- Full-screen `fixed inset-0 z-[9999]` layer (above everything)
- Renders `TutorialSpotlight` + `TutorialStep` for current step
- Traps keyboard: only `Escape` (skip) and `Enter` (next) work
- Prevents WASD movement while tutorial is active

#### `TutorialSpotlight.tsx` (Highlight)
- Semi-transparent black overlay (`bg-black/70`) with a "cutout" rectangle
- Cutout uses CSS `clip-path` or SVG mask to reveal the target element
- Target element identified by `data-tutorial-target="districts-button"` attributes
- Gently pulsing neon border around cutout (cyan glow animation)
- Computed position via `getBoundingClientRect()` of target element

#### `TutorialStep.tsx` (Card)
- Glass panel (`glass-panel` class from existing design system)
- Neon cyan border accent
- Title with `◈` icon prefix
- Body text (2-4 lines)
- Step indicator dots (○ ○ ● ○ ○ ○ ○)
- Buttons: `[← Back]` `[Next →]` `[Skip Tutorial]`
- Positioned relative to spotlight (below, above, or beside)
- Entry animation: fade-in + slide-up (200ms)

#### `tutorialSteps.ts` (Data)
```typescript
interface TutorialStepDef {
  id: string;
  title: string;
  body: string;              // 2-4 lines of explanation
  spotlightTarget?: string;  // data-tutorial-target value (null = full overlay)
  cardPosition: "center" | "bottom-right" | "top-left" | "bottom-left";
  animatedHint?: string;     // optional hint animation type
}

export const TUTORIAL_STEPS: TutorialStepDef[] = [ ... ];
```

### 2.4 Integration Points

1. **`page.tsx`** — Render `<TutorialOverlay />` as last child (highest z-index)
2. **`FloatingControls.tsx`** — Add `data-tutorial-target="districts-button"` to districts toggle
3. **`RightPanel.tsx`** — Add `data-tutorial-target="right-panel"` to container
4. **`FloatingMinimap.tsx`** — Add `data-tutorial-target="minimap"` to minimap container
5. **`FloatingChat.tsx`** — Add `data-tutorial-target="chat-toggle"` to chat button
6. **`FloatingControls.tsx` settings** — Add "Replay Tutorial" button that calls `restart()`
7. **`useCameraControls.ts`** — Check `tutorialActive` to suppress WASD during tutorial
8. **`useNeonStore.ts`** — Already has `onboardingStep` (0-4) and `advanceOnboarding()` — extend to 7 steps or use separate tutorial hook with localStorage

### 2.5 Styling

Uses existing design system — no new CSS classes needed:

| Element | Existing Class / Token |
|---------|----------------------|
| Panel background | `glass-panel` (frosted glass with noise) |
| Border accent | `border-neon-cyan/40` + `shadow-neon-cyan` |
| Title text | `text-neon-cyan font-bold tracking-wider uppercase` |
| Body text | `text-gray-300 text-sm leading-relaxed` |
| Step dots | `bg-neon-cyan/30` (inactive), `bg-neon-cyan` (active) |
| Skip button | `text-gray-500 hover:text-gray-300 text-xs` |
| Next/Back buttons | `neon-hover px-4 py-1.5 border border-neon-cyan/30` |
| Overlay | `bg-black/70` with `backdrop-blur-sm` |
| Entry animation | `animate-in fade-in slide-in-from-bottom-2 duration-200` |
| Spotlight glow | `ring-2 ring-neon-cyan/50 animate-pulseSoft` |

### 2.6 Implementation Tasks

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 1 | Create `tutorialSteps.ts` with 7 step definitions | New file | ~60 |
| 2 | Create `useTutorial.ts` hook (state, localStorage, navigation) | New file | ~50 |
| 3 | Create `TutorialSpotlight.tsx` (overlay + cutout mask) | New file | ~80 |
| 4 | Create `TutorialStep.tsx` (glass card + buttons + dots) | New file | ~90 |
| 5 | Create `TutorialOverlay.tsx` (orchestrator + keyboard trap) | New file | ~60 |
| 6 | Add `data-tutorial-target` attributes to 5 existing components | 5 files | ~10 |
| 7 | Render `<TutorialOverlay />` in `page.tsx` | 1 file | ~3 |
| 8 | Add "Replay Tutorial" button in FloatingControls settings | 1 file | ~8 |
| 9 | Suppress WASD during tutorial in `useCameraControls.ts` | 1 file | ~5 |
| 10 | Write tests for `useTutorial` hook + TutorialStep rendering | New test files | ~80 |

**Total: ~450 lines of new code + tests**

### 2.7 Edge Cases to Handle

- **Window resize during tutorial:** Spotlight cutout must recompute position
- **Target element not visible:** If spotlight target is off-screen (e.g., panel closed), skip spotlight and show centered card
- **Mobile / small screens:** Card should be responsive, use `max-w-md` and center
- **Multiple tutorials:** Only one active at a time; future tutorials (e.g., trading tutorial) can reuse the same component architecture
- **Browser back/forward:** Tutorial state is ephemeral (not URL-based), back button should not affect steps

---

## Appendix: File Inventory

### New Files (Tutorial)
```
frontend/src/components/tutorial/TutorialOverlay.tsx
frontend/src/components/tutorial/TutorialStep.tsx
frontend/src/components/tutorial/TutorialSpotlight.tsx
frontend/src/components/tutorial/tutorialSteps.ts
frontend/src/hooks/useTutorial.ts
```

### New Files (Testing)
```
frontend/vitest.config.ts
frontend/src/__tests__/store/useNeonStore.test.ts
frontend/src/__tests__/lib/world.test.ts
frontend/src/__tests__/lib/mockAuth.test.ts
frontend/src/__tests__/lib/cn.test.ts
frontend/src/__tests__/lib/edgeIndicators.test.ts
frontend/src/__tests__/lib/api.test.ts
frontend/src/__tests__/hooks/useChat.test.ts
frontend/src/__tests__/hooks/useLiveMarket.test.ts
frontend/src/__tests__/hooks/useMarketData.test.ts
frontend/src/__tests__/hooks/useEvidence.test.ts
frontend/src/__tests__/hooks/useQuestTriggers.test.ts
frontend/src/__tests__/hooks/useVoice.test.ts
frontend/src/__tests__/hooks/useMicroLegend.test.ts
frontend/src/__tests__/hooks/useNewsstand.test.ts
frontend/src/__tests__/hooks/useTutorial.test.ts
frontend/src/__tests__/components/city/useHitTesting.test.ts
frontend/src/__tests__/components/city/useCameraControls.test.ts
frontend/src/__tests__/components/tutorial/TutorialStep.test.ts
frontend/e2e/auth.spec.ts
frontend/e2e/navigation.spec.ts
frontend/e2e/panels.spec.ts
frontend/e2e/data-flow.spec.ts
backend/tests/test_market_data.py
backend/tests/test_news_feed.py
backend/tests/test_cache.py
backend/tests/test_signals.py
backend/tests/test_market_router.py
backend/tests/test_world_router.py
backend/tests/test_voice_router.py
backend/tests/test_schemas.py
backend/tests/test_shared_state.py
backend/tests/conftest.py
```

### Modified Files (Tutorial `data-tutorial-target` attributes)
```
frontend/src/app/page.tsx
frontend/src/components/layout/FloatingControls.tsx
frontend/src/components/layout/RightPanel.tsx
frontend/src/components/layout/FloatingMinimap.tsx
frontend/src/components/layout/FloatingChat.tsx
frontend/src/components/city/useCameraControls.ts
```
