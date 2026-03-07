# NEON EXCHANGE — Frontend Specification

## 1. Frontend Purpose

The frontend is the user-facing layer of NEON EXCHANGE. It turns stock-market state into an explorable 2D pixel cyberpunk city.

The frontend must:

- visualize the stock market as a living game-like world
- let users explore districts representing sectors
- let users interact with stock NPCs, props, kiosks, and scenario panels
- surface AI outputs in a readable, immersive way
- remain decoupled from backend implementation details through clear data contracts

## 2. Frontend Product Concept

The stock market is visualized as a cyberpunk pixel city.

- sectors are districts
- stocks are NPC characters
- liquidity is traffic
- volatility is weather
- correlation is visible through alliances and ripple effects

The product is designed to be:

- educational
- exploratory
- visually immersive
- explainable
- event driven

## 3. Current Frontend Implementation Status

### Implemented

- Next.js App Router frontend
- TypeScript + TailwindCSS UI shell
- top-down 2D pixel city canvas
- keyboard movement and drag-to-pan
- player avatar system
- stock NPC selection and hover behavior
- district landmarks and props
- district newsstands with mock headline overlays
- scenario cards in right panel
- rumor poster interactions
- plugin mode UI hook
- mock login, signup, guest flow
- top header with user chip and logout
- bottom dock live bar placeholder

### Pending

- real backend data integration
- live agent output rendering
- audio playback system
- real plugin handoff from stock websites
- production-ready frontend data adapters

## 4. Frontend Stack

- Framework: Next.js
- Language: TypeScript
- UI: React
- Styling: TailwindCSS
- Rendering: HTML canvas for world rendering
- State: Zustand

## 5. Frontend Architecture

### Shell Layout

The main city page uses:

- top header
- left sidebar
- center stage canvas
- right intelligence panel
- bottom dock

### Core Frontend Modules

- `frontend/src/app/`
  routes and page shell
- `frontend/src/components/layout/`
  page layout and structural UI
- `frontend/src/components/city/`
  canvas renderer, camera controls, hit testing
- `frontend/src/components/ui/`
  reusable UI primitives
- `frontend/src/store/`
  app and interaction state
- `frontend/src/mock/`
  mock districts, tickers, scenarios, rumors, and world data
- `frontend/src/types/`
  shared frontend types

## 6. Key Frontend Experiences

### 6.1 Login / Signup / Guest Access

Routes:

- `/login`
- `/signup`
- `/`

Requirements:

- cyberpunk premium auth screens
- avatar picker
- local mock auth only
- redirect to `/login` when not authenticated
- user chip visible in top header after login

### 6.2 Pixel Market City

The city is a top-down pixel-art world.

Requirements:

- large explorable map
- smooth camera movement
- drag-to-pan
- WASD / arrow-key movement
- player avatar presence
- district identity through props, color, weather, and landmarks

### 6.3 Districts

Each district represents a sector and must feel distinct.

Examples:

- CHIP DOCKS: tech terminals, servers, holo displays
- BANK TOWERS: polished tiles, vault signage, gold accents
- ENERGY YARD: reactors, pipes, hazard stripes
- CRYPTO ALLEY: QR graffiti, kiosks, neon signage

### 6.4 Stock NPCs

Stocks are represented as NPC characters.

Requirements:

- hover state
- selected state
- click interaction
- nameplate display
- right-panel population on selection
- visible mood and district context

### 6.5 Interactive Props

The city must feel dense and interactive.

Props include:

- vending machines
- terminals
- billboards
- street lamps
- crates
- benches
- kiosks
- newsstands
- doors
- pipes
- lamps
- arrows

Interactions:

- hover tooltip
- click micro-event
- glow, flicker, ad cycle, shake, pulse, or overlay response

### 6.6 Newsstands

Each district must include a newsstand kiosk.

Frontend behavior:

- user clicks kiosk
- mock overlay opens
- overlay shows district name, ticker focus, and 3 to 5 headline cards
- source label area is visible

### 6.7 Right Panel Intelligence View

The right panel displays:

- selected ticker identity
- archetype
- mood
- district
- scenario tabs
- alliances
- evidence timeline
- rumor posters

### 6.8 Plugin Mode UI

This is a frontend hook for future stock-page integration.

Behavior:

- plugin mode toggle exists in world UI
- clicking a stock NPC in plugin mode shows an outbound action
- current placeholder opens `https://example.com/stocks/{TICKER}`

### 6.9 Bottom Dock

Persistent live dock UI includes:

- push-to-talk button
- waveform placeholder
- transcript area
- persona selector
- interrupt button
- connection status pill

## 7. Frontend Visual Direction

The frontend must preserve:

- cyberpunk pixel aesthetic
- premium dark UI shell
- moody lighting
- neon accents used with restraint
- readable typography
- game-like world feedback

Visual effects include:

- subtle rain
- vignette
- neon flicker
- local light pools
- storm tint
- district ambience

## 8. Frontend Data Contracts Needed

The frontend should consume structured payloads rather than backend-specific raw feeds.

Required contract groups:

- auth session payload
- ticker state payload
- district state payload
- scenario payload
- news event payload
- world event payload
- agent explanation payload

## 9. Frontend Responsibilities By Team Member

### Sariya — UI and Frontend Lead

- own all frontend UX and UI quality
- finalize visual system and shell behavior
- own page routes, panels, auth flow, and interaction polish
- define frontend contracts for backend integration
- ensure the city feels product-grade

### Bharath — Game / World Simulation Support

- support city renderer behavior from the simulation side
- collaborate with Sariya on event-to-world updates
- own NPC and district reaction logic once data becomes live

## 10. Frontend Development Phases

### Phase F1 — UI Foundation

- auth pages
- shell layout
- reusable UI components

### Phase F2 — World Rendering

- map renderer
- district visuals
- props
- avatar movement

### Phase F3 — Interaction Layer

- NPC selection
- tooltips
- prop interactions
- newsstands

### Phase F4 — Intelligence Surfaces

- right panel
- scenarios
- evidence
- rumor posters

### Phase F5 — Integration Layer

- connect frontend to live backend contracts
- render real market, news, and agent outputs

### Phase F6 — Polish

- audio UI integration
- performance tuning
- accessibility
- demo flow hardening

## 11. Frontend Task Checklist

| Task | Description | Owner | Dependencies | Priority |
|---|---|---|---|---|
| Finalize shell layout | Lock header, sidebar, center stage, right panel, and dock behavior | Sariya | Existing frontend | High |
| Improve city art consistency | Normalize district art direction, props, tile logic, and landmark quality | Sariya | Existing city renderer | High |
| Harden interaction states | Ensure hover, select, focus, scroll, and minimap behaviors are fully reliable | Sariya | Existing city renderer | High |
| Define frontend contracts | Document props and payload shapes needed from backend services | Sariya | Backend planning | High |
| Improve NPC reactions | Add stronger event-driven world-state reactions for live mode | Bharath | Live data and agent outputs | Medium |
| Bind world simulation to UI | Translate backend events into city lighting, weather, and traffic updates | Bharath | Backend contracts | High |
| Integration test city UX | Validate the full city flow from login to ticker inspection | Sariya | Most frontend tasks complete | High |
