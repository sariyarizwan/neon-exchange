# NEON EXCHANGE — Pixel Market City

## Current Implementation Status Snapshot

This repository already includes a substantial frontend prototype. The following items are currently implemented or scaffolded:

- Implemented: 2D top-down pixel cyberpunk city world rendered on canvas
- Implemented: district-based map structure representing sectors
- Implemented: stock characters as selectable NPCs
- Implemented: player avatar movement and camera exploration
- Implemented: district landmarks, props, weather ambience, and micro-interactions
- Implemented: mock newsstands in every district with placeholder headline overlays
- Implemented: scenario cards and right-panel market exploration UI
- Implemented: plugin mode UI hook with outbound placeholder stock URLs
- Implemented: mock login, signup, guest access, and local auth state
- Implemented: bottom dock placeholder for live voice interaction
- Pending: real-time stock data ingestion
- Pending: real-time news ingestion and source mapping
- Pending: Gemini Live API integration
- Pending: Agent Development Kit integration
- Pending: multi-agent shared memory backend
- Pending: orchestration services and production infrastructure
- Pending: real audio system and event-driven sound design
- Pending: browser/plugin integration from real stock websites

This document describes the full target product, not just the current prototype.

---

## SECTION 1 — PROJECT OVERVIEW

### Concept

NEON EXCHANGE is an interactive market intelligence product that visualizes the stock market as a cyberpunk pixel city.

- The city is a 2D explorable pixel-art world with distinct districts.
- Each district represents a market sector such as technology, banking, energy, industrials, consumer, crypto, healthcare, or communications.
- Individual stocks appear as NPC-style characters living inside their district.
- Liquidity is visualized as traffic density, movement intensity, and route activity.
- Volatility is visualized as weather, lighting shifts, rain intensity, and storm conditions.
- Correlation is visualized as alliances, route links, and ripple effects between districts and stock characters.

### Purpose

The purpose of NEON EXCHANGE is to transform complex market behavior into an intuitive and immersive experience.

- Educational exploration of market dynamics:
  Users can learn how sectors, volatility, liquidity, and correlation behave by exploring the city rather than reading static dashboards.
- Interactive market intelligence:
  Users can inspect stocks, districts, and events through a visual and narrative layer that makes market state easier to understand.
- AI-generated scenario forecasting:
  Multi-agent reasoning produces scenario cards, possible market continuations, and risk branches.
- Immersive visualization:
  Audio, weather, NPC behavior, lighting, and reactive world state turn live markets into a playable cyberpunk environment.

---

## SECTION 2 — CORE FEATURES

### 1) Pixel Market City

The product centers on a 2D top-down pixel world inspired by classic exploration games.

- Users move through a large city with keyboard movement and drag-to-pan navigation.
- Each market sector is a district with its own art direction, props, landmarks, weather feel, and lighting.
- Stock tickers appear as unique NPC characters with labels, moods, and interaction states.
- District landmarks serve as memorable anchors for navigation and market identity.
- The city behaves like a playable interface rather than a static chart.

### 2) Live Data Layer

The live data layer transforms raw market feeds into world-state inputs.

- Real-time stock prices drive character state, district mood, and UI updates.
- Order flow indicators influence traffic, crowd behavior, and urgency cues.
- Liquidity signals affect route density, movement speed, and district activity.
- Volatility regimes drive environmental changes such as calm, choppy, or storm conditions.
- This layer is responsible for turning financial signals into structured inputs for both the AI system and the world renderer.

### 3) Live News System

The live news system brings market catalysts into the city.

- Every district contains a newsstand kiosk where relevant headlines can be viewed.
- Real-time news ingestion maps articles, filings, or social signals to sectors and tickers.
- Headline cards appear in kiosks and district overlays.
- News events can spawn rumor posters, district warnings, ticker reactions, and scenario shifts.
- The system must preserve source labeling so users can understand where each signal originated.

### 4) Multi-Agent Intelligence System

The intelligence system uses a coordinated group of agents rather than a single monolithic model.

#### Market Analyst Agent

- Interprets live price action, trend changes, volatility shifts, and regime transitions
- Summarizes ticker and sector behavior
- Maintains a structured market state view for other agents

#### News Analyst Agent

- Ingests and classifies news items
- Maps headlines to sectors, districts, and tickers
- Scores severity, relevance, and confidence
- Triggers newsstand updates and rumor poster events

#### Correlation Agent

- Detects relationships between stocks, sectors, and broader themes
- Maintains alliance structures between tickers and districts
- Identifies contagion or ripple effects

#### Scenario Generator Agent

- Produces continuation, mean reversion, and shock-event scenarios
- Outputs structured scenario cards with signals, invalidations, and ripple effects
- Tracks scenario branches and updates them as live conditions change

#### World Renderer Agent

- Converts structured agent outputs into visual state changes
- Updates district weather, traffic, signage, NPC mood, color intensity, and interactive overlays
- Ensures the city reflects AI reasoning in a consistent way

### Shared Orchestration and Shared Memory

The agents do not operate independently. They publish to and consume from a shared orchestration layer and a common memory model.

- Shared orchestration coordinates which agent reacts first to a new event
- Shared memory stores current market state, scenario branches, news events, and district conditions
- Agents can build on one another’s outputs instead of duplicating reasoning

---

## SECTION 3 — SYSTEM ARCHITECTURE

### Frontend Layer

- Framework: Next.js with React and TypeScript
- Styling: TailwindCSS
- Rendering: Canvas-based pixel world renderer for the city map
- UI Shell: left sidebar, center world canvas, right intelligence panel, bottom live dock
- Responsibilities:
  render the city, UI panels, overlays, auth shell, and interactive controls

### Game Layer

- World state for districts, props, NPCs, player, weather, and interaction zones
- NPC behavior engine for idle, wandering, facing, and event reactions
- Interaction engine for selecting stock NPCs, props, kiosks, landmarks, and district POIs
- Camera and movement system for exploration, panning, minimap, and focus transitions

### AI Layer

- Gemini Live API for live conversational and event-driven intelligence
- Agent Development Kit for multi-agent orchestration patterns
- Scenario generation engine for market scene outputs
- Structured outputs feeding both UI cards and world-state events

### Data Layer

- Stock price feeds
- Market signal feeds
- News feeds
- Feature extraction services for:
  price momentum, liquidity conditions, sector movement, volatility regime, and event severity

### Memory Layer

- Shared context store for agent-to-agent communication
- Event timeline for world updates and user-visible evidence
- Simulation memory for scenario branches and reasoning continuity
- Historical context storage for district mood changes and recent catalyst chains

### Infrastructure Layer

- Google Cloud as the hosting and orchestration environment
- Vertex AI for Gemini-powered agent runtime and live model interactions
- Firestore or equivalent storage for state, memory, and lightweight real-time records
- Cloud Storage for media assets, generated posters, and static resources
- Cloud Run for backend services, ingestion services, and orchestration workers

---

## SECTION 4 — DATA FLOW

The target system runs as a continuous real-time pipeline with approximately 1-second update cadence for market-facing state.

1. Live market data arrives
   Market data feeds deliver price, volume, order-flow proxies, and sector movement.

2. Feature extractor calculates signals
   Services derive momentum, liquidity, volatility regime, correlation changes, and unusual-event indicators.

3. Agents reason about signals
   The Market Analyst, News Analyst, and Correlation Agent interpret the incoming state and publish structured outputs.

4. Scenario Generator produces market scenes
   Scenario branches are generated, updated, or invalidated based on current signals and recent memory.

5. Renderer updates the city
   The frontend world renderer updates district mood, traffic, weather, NPC behavior, signs, and scenario-linked visual effects.

6. News Agent injects rumor posters and newsstands
   Relevant news stories appear inside district kiosks and can also trigger district-level alert artifacts such as rumor posters.

### Update Cadence

- Market state refresh target: every 1 second
- News refresh target: near real-time with event-driven injection
- World animation: continuous client-side rendering
- Agent reasoning: event-triggered with lightweight incremental updates

---

## SECTION 5 — MULTI AGENT ORCHESTRATION

The system uses a shared orchestration model rather than isolated agents.

### Shared Objects

Agents share:

- market state
- event logs
- scenario branches
- district conditions
- ticker summaries
- news mappings
- confidence scores

### Collaboration Model

- The Market Analyst Agent interprets market structure and publishes structured state.
- The News Analyst Agent enriches that state with catalysts and source-backed events.
- The Correlation Agent determines what else is affected and how district alliances should shift.
- The Scenario Generator Agent uses both market and news context to build possible futures.
- The World Renderer Agent converts structured outputs into visual changes inside the city.

This model ensures that:

- agents collaborate on the same shared truth
- scenario generation reflects both price behavior and news context
- the world remains synchronized with reasoning outputs
- user-facing explanations remain traceable

---

## SECTION 6 — USER EXPERIENCE

### User Flow

1. Login or signup
   The user authenticates through a lightweight entry flow. In the current prototype this is mock auth only.

2. Enter Pixel Market City
   The user arrives in the city and sees a cyberpunk market world with districts, landmarks, traffic, weather, and NPCs.

3. Explore districts
   The user moves through the map to understand where sector activity is concentrated.

4. Interact with stock NPCs
   Clicking a stock character opens the right-side intelligence panel and exposes scenario details, alliances, and evidence.

5. Check newsstands
   The user visits district kiosks to inspect relevant headlines and catalysts.

6. See scenario cards
   The user compares continuation, reversion, and shock scenarios generated by the AI layer.

7. Observe world state changes
   Market behavior becomes visible through traffic, weather, NPC mood, signs, overlays, and district pulses.

### UX Principles

- exploration first, charts second
- market complexity translated into visual metaphors
- explainable AI outputs
- low friction navigation
- immersive but legible cyberpunk presentation

---

## SECTION 7 — PLUGIN SYSTEM

The plugin system is intended to connect external stock pages back into NEON EXCHANGE.

### Concept

Example flow:

- User opens an Apple stock page
- A plugin button appears
- User clicks "Open in Neon Exchange"
- The city opens and centers directly on the Apple ticker character

### Design Intent

- outbound and inbound deep-linking between stock research surfaces and the city
- fast context transfer from a stock page into the corresponding district or NPC
- future browser-extension or page-injection experience

### Delivery Priority

This feature should be implemented last, after the core city, data, intelligence, and orchestration systems are stable.

Current repo status:

- UI hook exists
- placeholder outbound links exist
- actual browser/plugin integration is pending

---

## SECTION 8 — AUDIO SYSTEM

The audio layer should support immersion and event awareness without overwhelming the user.

### Sound Design

- ambient cyberpunk city sound:
  low urban hum, distant transit, electrical ambience
- rain ambience:
  light drizzle in calm mode, heavier rain in storm mode
- interaction sounds:
  UI taps, kiosk clicks, terminal chirps, signage pulses, district transitions
- news alert sounds:
  short notification stings for important district catalysts or rumor poster events

### Audio Behavior

- reactive to market regime
- optional and user-controlled
- synchronized with visual events
- compatible with future live voice agent interactions

Current repo status:

- bottom dock and sound toggle are mocked
- real sound engine and event mapping are pending

---

## SECTION 9 — TASK DISTRIBUTION (TEAM OF 5)

### Sariya — UI and Frontend Lead

- Own the full frontend shell and pixel city presentation
- Finalize city UI polish, responsive behavior, and interaction quality
- Own login/signup, user shell, map UX, right panel, sidebar, dock, and plugin-entry UI
- Integrate frontend with backend contracts once APIs are available
- Ensure the final visual language remains consistent across the product

### Chinmay — AI / Agent Systems

- Own Gemini Live API integration strategy
- Design and implement agent contracts, prompts, and structured outputs
- Build orchestration logic across Market Analyst, News Analyst, Correlation Agent, Scenario Generator, and World Renderer Agent
- Define shared memory schemas and collaboration rules
- Validate reasoning quality and explainability

### Rahil — Data Pipeline / Market Signals

- Own live market data ingestion and normalization
- Build feature extraction services for volatility, liquidity, price movement, and event signals
- Map incoming data to tickers, sectors, and district conditions
- Provide clean signal APIs for the AI layer
- Own data quality monitoring and update cadence reliability

### Bharath — Game Engine / World Simulation

- Own world-state simulation and interaction engine
- Expand NPC behavior systems, event reactions, traffic logic, weather logic, and environmental state transitions
- Define how AI outputs transform into visual world changes
- Optimize canvas rendering and simulation performance
- Build the event-to-world translation layer

### Manav — Infrastructure / Integrations

- Own Google Cloud deployment architecture
- Set up Vertex AI runtime environment, Cloud Run services, Firestore, and storage
- Establish environment configuration, service boundaries, CI/CD, and observability
- Support integration of data feeds and AI services into deployable backend services
- Own plugin integration strategy once core systems are stable

---

## SECTION 10 — DEVELOPMENT PHASES

### Phase 1 — Core City UI

- build city shell
- render districts
- implement avatar movement
- create stock NPC representation
- establish visual identity

Current status: largely implemented as a frontend prototype

### Phase 2 — NPC Interaction System

- stock selection
- prop interactions
- district landmarks
- newsstand interactions
- improved NPC behavior

Current status: mostly implemented in mock form, still needs polish and backend-driven events

### Phase 3 — Market Data Pipeline

- ingest live stock data
- normalize feeds
- derive market signals
- expose structured state to agents and renderer

Current status: pending

### Phase 4 — Multi-Agent Intelligence

- integrate Gemini Live API
- implement ADK agent orchestration
- define agent roles and shared contracts
- attach memory model

Current status: pending

### Phase 5 — Scenario Simulation

- convert live signals into structured scenarios
- support branch updates and invalidations
- connect scenario outputs to world and right panel

Current status: mock UI exists, live reasoning is pending

### Phase 6 — News System

- integrate real news feeds
- classify headlines
- map events to tickers and districts
- trigger world events and rumor surfaces

Current status: newsstand and rumor UI exist, real ingestion is pending

### Phase 7 — Audio & Polish

- implement sound engine
- event-driven sound mapping
- environment audio
- final visual polish and performance tuning

Current status: UI scaffolding exists, real audio system is pending

### Phase 8 — Plugin Integration

- deep-link from external stock websites
- center city on corresponding ticker
- pass context into the app

Current status: placeholder stock link behavior exists, true plugin integration is pending

---

## SECTION 11 — TASK LIST

| Task | Description | Owner | Dependencies | Priority |
|---|---|---|---|---|
| Finalize frontend UX shell | Harden responsive shell, scrolling panels, header behavior, accessibility, and visual consistency | Sariya | Existing frontend prototype | High |
| Finish city art polish | Improve tile art, lighting, district dressing, animation polish, and consistency across districts | Sariya | Existing canvas world | High |
| Frontend integration contracts | Define frontend data contracts for live market state, agent outputs, and news payloads | Sariya | Chinmay, Rahil | High |
| Design agent architecture | Define agent roles, prompts, I/O schema, memory model, and orchestration flow | Chinmay | Product spec, frontend contracts | High |
| Implement Gemini Live integration | Connect live model runtime for streaming reasoning and event outputs | Chinmay | Manav infra setup | High |
| Build shared memory model | Define and implement event log, scenario memory, district state memory, and collaboration context | Chinmay | Manav backend storage | High |
| Implement scenario engine | Generate structured scenarios from live market and news signals | Chinmay | Rahil signals, shared memory | High |
| Build market ingestion service | Ingest and normalize live stock and sector data | Rahil | Manav infra setup | High |
| Create signal extraction layer | Compute momentum, liquidity, volatility, sector movement, and derived states | Rahil | Market ingestion service | High |
| Map feeds to world entities | Link data feeds to ticker IDs, districts, and visual regimes | Rahil | Signal extraction layer, frontend contracts | High |
| Integrate real news feeds | Ingest and normalize headline sources for district newsstands and catalysts | Rahil | Manav infra setup | High |
| Expand NPC simulation engine | Convert static NPC logic into richer reactions to AI and live data | Bharath | Existing game layer | Medium |
| Build world-event translation layer | Map agent outputs into district weather, traffic, signage, NPC mood, and POI changes | Bharath | Chinmay outputs, Rahil signals | High |
| Optimize renderer performance | Keep world updates smooth under continuous live updates and denser simulation | Bharath | World-event layer | Medium |
| Build orchestration services | Deploy and manage data services, agent services, and state services on Cloud Run | Manav | Architecture finalized | High |
| Set up Vertex AI environment | Prepare secure runtime for Gemini Live and agent orchestration services | Manav | GCP project setup | High |
| Provision Firestore and storage | Create shared persistence layer for memory, assets, and event state | Manav | GCP setup | High |
| Add CI/CD and observability | Logging, service monitoring, release flow, and environment management | Manav | Core services defined | Medium |
| Plan plugin integration | Define extension/deep-link architecture for stock-page handoff into the city | Manav | Core product stable | Low |
| Validate full end-to-end demo | Run integrated demo with city UI, live signals, agent outputs, and scenario changes | All | All prior high-priority tasks | High |

---

## Recommended Execution Order

1. Sariya locks the frontend contracts and city UI behavior.
2. Manav provisions infrastructure and runtime services.
3. Rahil delivers market and news signal pipelines.
4. Chinmay integrates Gemini Live, agent orchestration, and scenario reasoning.
5. Bharath binds structured outputs into the world simulation and final interaction layer.
6. The team completes audio polish and plugin integration last.
