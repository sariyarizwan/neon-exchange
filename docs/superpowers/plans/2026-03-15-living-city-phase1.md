# Living City Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Neon Exchange from a static visual map into a living, explorable city with interactive NPCs, world objects, district activation effects, ambient life, and mini-missions — all optimized for demo video impact.

**Architecture:** Extract new systems into focused modules under `components/city/systems/` and `data/`. CityCanvas.tsx (2084 lines) integrates these via its existing render loop and interaction handlers. Re-enable commented-out prop/newsstand rendering+interaction. Add new NPC types, interactable objects, district effects, ambient behaviors, hover prompts, and a mini-mission framework.

**Tech Stack:** TypeScript, React 18, HTML5 Canvas, Zustand

---

## File Structure

### New Files
- `frontend/src/data/npcTypes.ts` — District-specific NPC definitions (Market NPCs, Utility NPCs, Flavor NPCs) with roles, dialogues, actions
- `frontend/src/data/interactables.ts` — Interactive world objects per district (terminals, scanners, news boards, power nodes, etc.)
- `frontend/src/data/districtActions.ts` — Signature district activation effects and mini-mission definitions
- `frontend/src/components/city/systems/drawInteractables.ts` — Canvas drawing functions for new world objects (terminal, scanner, news board, power node, control console, etc.)
- `frontend/src/components/city/systems/drawAmbient.ts` — Ambient effect renderers (floating holograms, steam vents, blinking signs, drone patrols, courier bots)
- `frontend/src/components/city/systems/drawHoverPrompts.ts` — In-world hover prompt labels above NPCs/objects
- `frontend/src/components/city/systems/districtEffects.ts` — District signature animation effects (Glitch Surge, Reactor Pulse, Factory Wake-Up, Market Briefing, Research Reveal, Route Activation)
- `frontend/src/components/city/systems/missionSystem.ts` — Mini-mission state machine (trigger → interact → reveal)

### Modified Files
- `frontend/src/components/city/CityCanvas.tsx` — Re-enable props/newsstand rendering+interaction, integrate new systems into draw loop and event handlers
- `frontend/src/store/useNeonStore.ts` — Add mission state, interaction state, district activation state, hover prompt state
- `frontend/src/types/world.ts` — Add new NPC role types, interactable types, mission types
- `frontend/src/mock/cityWorld.ts` — Add new NPC citizens with roles and district-specific dialogue

---

## Chunk 1: Data Layer — NPC Types, Interactables, District Actions

### Task 1: Extended Type Definitions

**Files:**
- Modify: `frontend/src/types/world.ts`

- [ ] **Step 1:** Add NPC role types, interactable object types, mission types, and district effect types to `world.ts`

### Task 2: District-Specific NPC Data

**Files:**
- Create: `frontend/src/data/npcTypes.ts`

- [ ] **Step 1:** Create NPC role definitions for all 6 districts:
  - Crypto Alley: Token Broker, Glitch Dealer, Street Hacker, Whisper Trader, Courier Bot
  - Industrials Foundry: Factory Worker, Shift Supervisor, Mechanic, Supply Chain Operator, Inspection Drone
  - Energy Yard: Reactor Engineer, Grid Analyst, Safety Bot, Cable Tech, Emergency Runner
  - Finance Plaza (Bank Towers): Floor Analyst, Portfolio Manager, Banker NPC, Economic Commentator, Security Drone
  - Biotech Quarter (Bio Dome): Lab Researcher, Bioengineer, Clinical Observer, Compliance Officer, Med Drone
  - Logistics Row (Comms Neon Ridge): Freight Handler, Route Planner, Cargo Drone, Dispatcher, Dock Supervisor
  - Plus reusable types: Street Trader, Analyst, Guide Bot, Citizen, Investor Tourist, Sleepless Coder

- [ ] **Step 2:** Each NPC has: id, districtId, role, dialogues (3 rotating lines), hoverPrompt, clickAction, style, color

### Task 3: Interactive World Objects Data

**Files:**
- Create: `frontend/src/data/interactables.ts`

- [ ] **Step 1:** Define district-specific interactable objects:
  - Crypto Alley: hack terminal, rumor vending machine, neon billboard, unstable data node
  - Industrials Foundry: machine console, conveyor monitor, warehouse terminal, production status board
  - Energy Yard: reactor console, grid monitor, pressure valve, energy display tower, hazard alarm panel
  - Bank Towers: earnings board, sentiment screen, bank terminal, market clock, investment kiosk
  - Bio Dome: lab scanner, trial terminal, specimen chamber, research display, ethics console
  - Comms Neon Ridge: shipment board, loading terminal, route map, transit scanner, cargo gate

- [ ] **Step 2:** Each object has: id, districtId, type, position, hoverLabel, clickEffect, dialogueOnClick, accent

### Task 4: District Actions & Mini-Missions

**Files:**
- Create: `frontend/src/data/districtActions.ts`

- [ ] **Step 1:** Define signature district activation effects:
  - Crypto Alley → Glitch Surge (lights stutter, tickers flash, NPCs react)
  - Industrials Foundry → Factory Wake-Up (machinery lights pulse outward)
  - Energy Yard → Reactor Pulse (blue pulse, lights brighten, reactor panel opens)
  - Bank Towers → Market Briefing Mode (screens light up, summary overlays)
  - Bio Dome → Research Reveal (holographic overlays over labs)
  - Comms Neon Ridge → Route Activation (animated lines between districts)

- [ ] **Step 2:** Define mini-missions per district:
  - Crypto Alley: "Trace the false pump" → click broker → inspect board → reveal hidden signal
  - Energy Yard: "Stabilize the reactor" → click engineer → inspect console → pulse district
  - Industrials Foundry: "Find the bottleneck" → talk to worker → inspect machine → unlock throughput panel
  - Bank Towers: "Read the rotation" → talk to analyst → inspect sentiment → compare sectors
  - Comms Neon Ridge: "Follow the missing shipment" → click courier → follow route → inspect terminal
  - Bio Dome: "Unlock the trial data" → talk to researcher → scan specimen → reveal pipeline

---

## Chunk 2: Rendering Systems

### Task 5: Interactable Object Renderers

**Files:**
- Create: `frontend/src/components/city/systems/drawInteractables.ts`

- [ ] **Step 1:** Create canvas drawing functions for new interactive objects: terminal screen, scanner device, news board, power node, control console, data kiosk, hologram totem, cargo gate, transit gate, sentiment screen, lab equipment
- [ ] **Step 2:** Each renderer draws pixel-art style object with glow/accent coloring matching district theme
- [ ] **Step 3:** Add click feedback animations: pulse ring, light burst, panel slide-in

### Task 6: Ambient Effect Renderers

**Files:**
- Create: `frontend/src/components/city/systems/drawAmbient.ts`

- [ ] **Step 1:** Floating holograms — semi-transparent rotating symbols above district centers
- [ ] **Step 2:** Steam/smoke vents — animated particle wisps from specific positions in industrial/energy districts
- [ ] **Step 3:** Blinking neon signs — flickering accent-colored rectangles with text
- [ ] **Step 4:** Courier drones — small pixel drones moving between districts along connection lines
- [ ] **Step 5:** Random speech bubbles — citizens occasionally show ambient chatter bubbles

### Task 7: Hover Prompt System

**Files:**
- Create: `frontend/src/components/city/systems/drawHoverPrompts.ts`

- [ ] **Step 1:** Draw in-world hover prompts when player is within range of interactable:
  - For NPCs: "Click to talk", "Ask for insight", "Hear a rumor"
  - For objects: "Inspect terminal", "Read district feed", "Scan activity"
  - For districts: "Click to activate this district"
- [ ] **Step 2:** Proximity-based prompt visibility (show within 120px of player)
- [ ] **Step 3:** Animated fade-in/out with accent border

### Task 8: District Signature Effects

**Files:**
- Create: `frontend/src/components/city/systems/districtEffects.ts`

- [ ] **Step 1:** Implement 6 district activation animations that render in the draw loop:
  - Glitch Surge: Screen shake, random pixel displacement, flicker overlay
  - Factory Wake-Up: Outward-radiating light bars from center
  - Reactor Pulse: Blue expanding ring + brighten
  - Market Briefing: Clean data overlay panels
  - Research Reveal: Holographic floating panels
  - Route Activation: Animated dashed lines between districts

---

## Chunk 3: Integration — Store, CityCanvas, Citizens

### Task 9: Store Updates

**Files:**
- Modify: `frontend/src/store/useNeonStore.ts`

- [ ] **Step 1:** Add interaction state: `activeInteractable`, `hoverPromptTarget`, `districtActivation`
- [ ] **Step 2:** Add mission state: `activeMission`, `missionStep`, `missionCompleted` per district
- [ ] **Step 3:** Add actions: `activateDistrict()`, `startMission()`, `advanceMission()`, `completeMission()`, `setHoverPromptTarget()`

### Task 10: Enhanced Citizens in cityWorld.ts

**Files:**
- Modify: `frontend/src/mock/cityWorld.ts`

- [ ] **Step 1:** Replace generic citizen generation with role-based NPC generation using data from `npcTypes.ts`
- [ ] **Step 2:** Each district gets 8-12 NPCs with district-specific roles and dialogues
- [ ] **Step 3:** Add `role`, `hoverPrompt`, and `clickAction` fields to Citizen type

### Task 11: CityCanvas Integration — Re-enable Props + Add New Systems

**Files:**
- Modify: `frontend/src/components/city/CityCanvas.tsx`

- [ ] **Step 1:** Re-enable prop rendering (uncomment visibleProps section ~line 1442-1474)
- [ ] **Step 2:** Re-enable prop hit testing (uncomment getPropAt, getNewsstandAt ~line 1732-1737)
- [ ] **Step 3:** Re-enable prop click interaction (uncomment handlePointerUp prop section ~line 1883-1952)
- [ ] **Step 4:** Re-enable newsstand click interaction (uncomment ~line 1865-1881)
- [ ] **Step 5:** Re-enable prop hover detection (uncomment ~line 1751-1764)
- [ ] **Step 6:** Add citizen click interaction — clicking a citizen shows dialogue bubble + action
- [ ] **Step 7:** Import and call drawAmbient effects in the draw loop (after NPCs, before weather)
- [ ] **Step 8:** Import and call drawHoverPrompts in the draw loop (after NPCs)
- [ ] **Step 9:** Import and call district activation effects in the draw loop (during district rendering)
- [ ] **Step 10:** Add interactable objects rendering (using drawInteractables) in the draw loop
- [ ] **Step 11:** Add citizen hover detection in handleHover
- [ ] **Step 12:** Wire mission triggers into click handlers

### Task 12: Mini-Mission System

**Files:**
- Create: `frontend/src/components/city/systems/missionSystem.ts`

- [ ] **Step 1:** Mission state machine: INACTIVE → TRIGGERED → STEP_1 → STEP_2 → COMPLETE
- [ ] **Step 2:** Each mission step: { trigger: "click_npc" | "click_object", targetId, onComplete: action }
- [ ] **Step 3:** Visual feedback per step: quest toast, NPC highlight, object glow
- [ ] **Step 4:** Completion: district pulse + insight panel + quest log entry

---

## Execution Order

1. Tasks 1-4 (data layer) — can all run in parallel
2. Tasks 5-8 (render systems) — can all run in parallel after Task 1
3. Tasks 9-12 (integration) — sequential, depends on above
