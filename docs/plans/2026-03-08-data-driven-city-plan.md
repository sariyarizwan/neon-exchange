# Data-Driven City + End-to-End Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mock data with live backend data and implement 7 feedback items (weather=volatility, traffic=liquidity, crowds=volume, NPC mood=momentum, alliance cables=correlation, news as mechanic, quest toasts).

**Architecture:** Expand the backend SSE stream (`/api/world/neon-stream`) to include district_states and signals alongside tickers/news. Frontend LiveDataProvider exposes all data via context. CityCanvas renders weather/traffic/crowds/alliances driven by live data. Quest toasts notify players of market events.

**Tech Stack:** FastAPI + SSE (backend), Next.js 15 + React 18 + Zustand + HTML5 Canvas (frontend)

---

## Phase 1: Backend — Expand SSE Stream

### Task 1: Add district_states and signals to neon-stream payload

**Files:**
- Modify: `backend/services/cache.py:324-329` (neon_stream_payload construction)
- Modify: `backend/routers/world_router.py:90-111` (neon_stream endpoint — no changes needed, it already serves cache)

**Step 1: Expand neon_stream_payload in cache.py**

In `_rebuild()` method, the `neon_stream_payload` at lines 324-329 currently has only `tickers`, `news`, `tick`. Add `district_states` and `signals`:

```python
# Replace lines 324-329 in cache.py
neon_stream_payload = {
    "tickers": neon_tickers,
    "news": news[:5],
    "tick": self._rebuild_count,
    "district_states": {
        ds["district_id"]: {
            "weather": ds.get("weather", "clear"),
            "traffic": ds.get("traffic", "normal"),
            "mood": ds.get("mood", "calm"),
            "glow_intensity": ds.get("glow_intensity", 0.5),
        }
        for ds in district_states_list
    },
    "signals": {
        "correlations": {
            "top_positive": signals_data.get("correlations", {}).get("top_positive", [])[:10],
            "top_negative": signals_data.get("correlations", {}).get("top_negative", [])[:5],
        },
        "sector_strength": signals_data.get("sector_strength", {}),
        "breadth": signals_data.get("breadth", {}),
        "regimes": signals_data.get("regimes", {}),
    },
}
```

Note: `district_states_list` and `signals_data` should already be computed earlier in `_rebuild()`. Check that they're available at this point — they are built at lines ~330-350.

**Step 2: Verify the backend serves expanded data**

Run: `cd backend && source venv/bin/activate && python -c "from services.cache import snapshot_cache; import asyncio; asyncio.run(snapshot_cache.start()); import json; snap = snapshot_cache.snapshot; print(json.dumps(json.loads(snap.neon_stream_json), indent=2)[:2000])"`

Expected: JSON with `tickers`, `news`, `tick`, `district_states`, `signals` keys.

**Step 3: Commit**

```bash
git add backend/services/cache.py
git commit -m "feat(backend): Expand neon-stream SSE with district_states and signals"
```

---

### Task 2: Add /api/chat endpoint to backend

**Files:**
- Modify: `backend/routers/world_router.py` (add chat endpoint)
- Modify: `backend/main.py` (if new router needed)

**Step 1: Add chat endpoint**

Add to `world_router.py`:

```python
@router.post("/chat")
async def chat(request: Request):
    body = await request.json()
    message = body.get("message", "")
    context = body.get("context", {})

    # Build market context from cache
    snap = snapshot_cache.snapshot
    district_id = context.get("districtId")
    ticker_id = context.get("tickerId")

    market_context = f"Market mood: {snap.neon_state.get('marketMood', 'unknown')}. "
    if district_id and district_id in (snap.district_states_json or "{}"):
        market_context += f"District: {district_id}. "

    # Use Gemini for response
    try:
        from google import genai
        client = genai.Client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are NEON, an AI market analyst in a cyberpunk city. {market_context}\n\nUser: {message}",
        )
        return {"reply": response.text, "context": context}
    except Exception as e:
        return {"reply": f"Market intel offline: {str(e)}", "context": context}
```

**Step 2: Commit**

```bash
git add backend/routers/world_router.py
git commit -m "feat(backend): Add /api/chat endpoint with Gemini integration"
```

---

## Phase 2: Frontend — Expand Data Layer

### Task 3: Update API types and SSE parsing

**Files:**
- Modify: `frontend/src/lib/api.ts:128-132` (NeonStreamEvent type)
- Modify: `frontend/src/lib/api.ts:94-109` (NeonTickerData — add volume if missing)

**Step 1: Add new types to api.ts**

After existing types, add:

```typescript
export type DistrictLiveState = {
  weather: "clear" | "rain" | "storm" | "fog";
  traffic: "low" | "normal" | "heavy" | "gridlock";
  mood: "calm" | "tense" | "euphoric" | "panic";
  glow_intensity: number;
};

export type CorrelationPair = {
  a: string;
  b: string;
  r: number;
};

export type LiveSignals = {
  correlations: {
    top_positive: CorrelationPair[];
    top_negative: CorrelationPair[];
  };
  sector_strength: Record<string, { strength: number; rank: number; trend: string }>;
  breadth: { advancers: number; decliners: number; signal: string };
  regimes: {
    tickers: Record<string, string>;
    districts: Record<string, string>;
  };
};
```

Update `NeonStreamEvent`:
```typescript
export type NeonStreamEvent = {
  tickers: Record<string, NeonTickerData>;
  news: NewsItem[];
  tick: number;
  district_states?: Record<string, DistrictLiveState>;
  signals?: LiveSignals;
};
```

**Step 2: Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): Add DistrictLiveState and LiveSignals types to API"
```

---

### Task 4: Expand useLiveMarket hook and LiveDataProvider

**Files:**
- Modify: `frontend/src/hooks/useLiveMarket.ts` (parse new SSE fields)
- Modify: `frontend/src/components/LiveDataProvider.tsx` (expose new data in context)

**Step 1: Update useLiveMarket to parse district_states and signals**

Add state for the new fields and parse them from the SSE stream data. Return them alongside existing fields.

```typescript
const [districtStates, setDistrictStates] = useState<Record<string, DistrictLiveState> | null>(null);
const [signals, setSignals] = useState<LiveSignals | null>(null);

// In the SSE callback:
if (data.district_states) setDistrictStates(data.district_states);
if (data.signals) setSignals(data.signals);
```

Return: `{ tickers, districtStates, signals, marketMood, isLive, connected }`

**Step 2: Update LiveDataProvider context type**

Add `districtStates` and `signals` to `LiveDataContextType` and pass through from `useLiveMarket`.

```typescript
type LiveDataContextType = {
  tickers: Record<string, NeonTickerData> | null;
  news: NewsItem[] | null;
  districtStates: Record<string, DistrictLiveState> | null;
  signals: LiveSignals | null;
  marketMood: string;
  connected: boolean;
  isLive: boolean;
};
```

**Step 3: Commit**

```bash
git add frontend/src/hooks/useLiveMarket.ts frontend/src/components/LiveDataProvider.tsx
git commit -m "feat(frontend): Expose district_states and signals via LiveDataProvider"
```

---

## Phase 3: Remove Mock Data Dependencies

### Task 5: Delete mock scenarios, rumors, news files

**Files:**
- Delete: `frontend/src/mock/scenarios.ts`
- Delete: `frontend/src/mock/rumors.ts`
- Delete: `frontend/src/mock/news.ts`
- Modify: `frontend/src/components/layout/RightPanel.tsx` (remove mock imports, use live data)
- Modify: `frontend/src/store/useNeonStore.ts` (remove initialEvidence hardcoded data)

**Step 1: Update RightPanel to use live data instead of mock scenarios/rumors**

Remove imports of `scenarios.ts`, `rumors.ts`. Replace scenario rendering with live data from `/api/world/scenarios` or show "connecting to agents..." placeholder. Replace rumors with evidence from store (which will be fed by backend).

For alliances tab: use live `signals.correlations` from context instead of mock `ticker.alliances`.

**Step 2: Remove initialEvidence from useNeonStore**

Replace the hardcoded `initialEvidence` array (lines 121-142) with an empty array `[]`.

**Step 3: Delete mock files**

```bash
rm frontend/src/mock/scenarios.ts frontend/src/mock/rumors.ts frontend/src/mock/news.ts
```

**Step 4: Update any remaining imports**

Search for `@/mock/scenarios`, `@/mock/rumors`, `@/mock/news` and remove/replace all.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: Remove mock scenarios, rumors, news — use live backend data"
```

---

### Task 6: Wire FloatingControls to live district states

**Files:**
- Modify: `frontend/src/components/layout/FloatingControls.tsx:21-25,202-215`

**Step 1: Replace static trafficDots with live data**

Instead of `district.traffic` from mock (which is a static "Low"/"Med"/"High"), consume `districtStates[district.id]?.traffic` from LiveDataProvider context. Map backend traffic values to dot counts:

```typescript
const liveTrafficDots: Record<string, number> = {
  low: 1,
  normal: 2,
  heavy: 3,
  gridlock: 3,
};
```

Also show live regime from `districtStates[district.id]?.weather` instead of static `district.regime`.

**Step 2: Commit**

```bash
git add frontend/src/components/layout/FloatingControls.tsx
git commit -m "feat: Wire FloatingControls traffic/regime to live backend data"
```

---

### Task 7: Wire DistrictPopup to live district states

**Files:**
- Modify: `frontend/src/components/layout/DistrictPopup.tsx:59-87,168-191`

**Step 1: Use live weather/mood/traffic in popup**

Replace `district.regime` with `districtStates[district.id]?.weather`. Replace `district.traffic` with live traffic. Show glow_intensity as a visual indicator.

**Step 2: Commit**

```bash
git add frontend/src/components/layout/DistrictPopup.tsx
git commit -m "feat: Wire DistrictPopup to live district states from backend"
```

---

## Phase 4: Canvas — Data-Driven Visuals

### Task 8: Per-district weather rendering on canvas

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx:1314-1362` (weather section)

**Step 1: Make weather per-district instead of global**

Currently rain is rendered globally. Change to render weather effects per district zone based on `districtStates[zone.districtId]?.weather`:
- For each district zone, check its weather state
- `clear`: only dust particles within zone bounds
- `rain`: rain drops constrained to zone bounds (moderate count ~30)
- `storm`: heavy rain (~80 drops) + lightning flashes scoped to zone + storm overlay
- `fog`: reduce zone rendering opacity

The key change: instead of one global rain array, iterate over visible district zones and render weather particles within each zone's screen-space bounds.

Add system toast when weather changes (compare with previous frame's weather state).

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): Per-district weather driven by live volatility regime"
```

---

### Task 9: NPC mood driven by live momentum/trend

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx:1211-1260` (NPC rendering)
- Modify: `frontend/src/components/city/CityCanvas.tsx:376-427` (NPC runtime setup)

**Step 1: Update NPC rendering to use live data**

In the NPC drawing loop, look up `liveTickers[npc.tickerId]` from context. Use live `mood` and `momentum` to drive:
- Aura brightness: confident=1.0, nervous=0.4, erratic=random flicker
- Bob speed: scale with |momentum| (higher momentum = faster bob)
- Position jitter: nervous NPCs get 2px random jitter per frame
- Erratic NPCs change facing direction randomly

Pass live ticker data into the canvas render loop (it needs to be accessible from the animation frame).

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): NPC mood and animation driven by live trend/momentum"
```

---

### Task 10: Dynamic citizen density (traffic = liquidity)

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx` (citizen spawning section)

**Step 1: Scale citizen count per district based on traffic**

Instead of fixed citizen count from mock `cityWorld.ts`, dynamically adjust citizen NPCs per district:
- `low`: 2 citizens, speed 0.5x
- `normal`: 4 citizens, speed 1.0x
- `heavy`: 8 citizens, speed 1.0x
- `gridlock`: 12 citizens, speed 0.3x

On each SSE update, adjust citizen count: spawn or despawn citizens in each district to match target count. Citizens spawn at random positions within the district zone bounds.

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): Dynamic citizen density driven by live liquidity/traffic"
```

---

### Task 11: Crowd clustering around high-momentum tickers

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx` (NPC rendering section)

**Step 1: Spawn crowd NPCs near high-momentum tickers**

For each ticker NPC where `|liveTicker.momentum| > 0.5`:
- Spawn 2-4 temporary "crowd" citizen NPCs within 60px radius of ticker NPC
- More |momentum| = more crowd NPCs (linear scale: 0.5→2, 1.0→4)
- Crowd NPCs face toward the ticker NPC
- Draw them as regular citizens with slightly brighter appearance

These are ephemeral — recalculated each frame based on current momentum values.

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): Crowd clustering around high-momentum ticker NPCs"
```

---

### Task 12: Alliance cables between correlated districts

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx` (add new drawing section after zones, before NPCs)

**Step 1: Draw neon alliance lines**

After drawing all district zones but before NPCs, draw correlation cables:

For each entry in `signals.correlations.top_positive` where `r > 0.5`:
- Look up district centers for both tickers' districts
- Draw a line from district_a.center to district_b.center (in world coords, transformed by camera)
- Line color: blend of the two districts' accent colors
- Line opacity: map r from [0.5, 1.0] to [0.3, 0.8]
- Line width: 2-4px based on r
- Animate: gentle opacity pulse (sin wave)

For `top_negative` where `r < -0.3`:
- Draw dashed/flickering red line (alliance breaking / "gang war")

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): Neon alliance cables between correlated districts"
```

---

### Task 13: News as NPC speech bubbles

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx:1253-1259` (speech bubble section)

**Step 1: Show live news headlines as NPC speech bubbles**

When news arrives via SSE, match news items to affected ticker NPCs by `news.tickers` array. Set `npc.speechText` to the headline for 8 seconds, then clear.

Track news already shown to avoid repeating. Use a Set of news headline hashes.

Also update newsstand overlays in the affected district with latest headlines.

**Step 2: Commit**

```bash
git add frontend/src/components/city/CityCanvas.tsx
git commit -m "feat(canvas): News headlines as NPC speech bubbles and newsstand updates"
```

---

## Phase 5: Quest Toasts

### Task 14: Create QuestToasts component and wire to store

**Files:**
- Create: `frontend/src/components/layout/QuestToasts.tsx`
- Modify: `frontend/src/store/useNeonStore.ts` (add toast state)
- Modify: `frontend/src/app/page.tsx` (add QuestToasts to layout)

**Step 1: Add toast state to Zustand store**

```typescript
// In useNeonStore
questToasts: [] as Array<{ id: string; text: string; type: string; createdAt: number }>,
addQuestToast: (text: string, type: string) => set((state) => ({
  questToasts: [
    { id: `toast-${Date.now()}`, text, type, createdAt: Date.now() },
    ...state.questToasts,
  ].slice(0, 5),
})),
dismissQuestToast: (id: string) => set((state) => ({
  questToasts: state.questToasts.filter((t) => t.id !== id),
})),
```

**Step 2: Create QuestToasts component**

Floating toast container at top-center. Shows max 2 toasts, auto-dismisses after 6 seconds. Styled with glass-panel cyberpunk aesthetic.

```tsx
export function QuestToasts() {
  const toasts = useNeonStore((s) => s.questToasts);
  const dismiss = useNeonStore((s) => s.dismissQuestToast);
  // Auto-dismiss after 6s
  // Render top-center fixed position toasts
  // Each toast: glass panel with quest icon + text + dismiss button
}
```

**Step 3: Add to page.tsx**

Import and render `<QuestToasts />` inside the main layout div.

**Step 4: Commit**

```bash
git add frontend/src/components/layout/QuestToasts.tsx frontend/src/store/useNeonStore.ts frontend/src/app/page.tsx
git commit -m "feat: Add quest toast notification system"
```

---

### Task 15: Trigger quests from live data changes

**Files:**
- Create: `frontend/src/hooks/useQuestTriggers.ts`
- Modify: `frontend/src/app/page.tsx` (invoke hook)

**Step 1: Create useQuestTriggers hook**

This hook watches live data and triggers quest toasts:

```typescript
export function useQuestTriggers() {
  const { districtStates, signals, tickers } = useLiveData();
  const addQuestToast = useNeonStore((s) => s.addQuestToast);
  const prevWeatherRef = useRef<Record<string, string>>({});
  const shownToastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!districtStates) return;
    // Weather change detection
    for (const [id, state] of Object.entries(districtStates)) {
      const prev = prevWeatherRef.current[id];
      if (prev && prev !== state.weather && state.weather === "storm") {
        const key = `storm-${id}-${Date.now()}`;
        if (!shownToastsRef.current.has(key)) {
          addQuestToast(`Storm detected in ${id.toUpperCase()} — find the trigger.`, "storm");
          shownToastsRef.current.add(key);
        }
      }
    }
    prevWeatherRef.current = Object.fromEntries(
      Object.entries(districtStates).map(([id, s]) => [id, s.weather])
    );
  }, [districtStates]);

  useEffect(() => {
    if (!tickers) return;
    // Big mover detection
    for (const [id, t] of Object.entries(tickers)) {
      if (Math.abs(t.changePct) > 3) {
        const key = `mover-${id}`;
        if (!shownToastsRef.current.has(key)) {
          addQuestToast(`Crowd surge around ${t.neonSymbol} — talk to them.`, "crowd");
          shownToastsRef.current.add(key);
        }
      }
    }
  }, [tickers]);

  useEffect(() => {
    if (!signals?.correlations) return;
    // New high correlation
    for (const pair of signals.correlations.top_positive.slice(0, 3)) {
      if (pair.r > 0.7) {
        const key = `alliance-${pair.a}-${pair.b}`;
        if (!shownToastsRef.current.has(key)) {
          addQuestToast(`Alliance formed between ${pair.a} and ${pair.b} — inspect the cable.`, "alliance");
          shownToastsRef.current.add(key);
        }
      }
    }
  }, [signals]);
}
```

**Step 2: Invoke in page.tsx**

Call `useQuestTriggers()` inside HomePage component.

**Step 3: Commit**

```bash
git add frontend/src/hooks/useQuestTriggers.ts frontend/src/app/page.tsx
git commit -m "feat: Quest triggers from live weather changes, big movers, correlations"
```

---

## Phase 6: Verify & Polish

### Task 16: Build verification and fix any type errors

**Step 1: Run build**

```bash
cd frontend && npm run build
```

Fix any TypeScript errors.

**Step 2: Start backend and frontend together**

Terminal 1: `cd backend && source venv/bin/activate && python main.py`
Terminal 2: `cd frontend && npm run dev`

Verify:
- [ ] SSE stream includes district_states and signals
- [ ] Weather particles change per district based on volatility
- [ ] Traffic (citizen count) varies per district
- [ ] NPC moods update from live data
- [ ] Alliance cables appear between correlated districts
- [ ] News shows as NPC speech bubbles
- [ ] Quest toasts fire on weather changes / big movers
- [ ] No mock scenario/rumor/news imports remain

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: Build verification and type fixes for data-driven city"
```
