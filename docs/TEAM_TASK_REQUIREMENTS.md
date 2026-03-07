# NEON EXCHANGE — Team Task Requirements

This document breaks the project into detailed ownership tracks for all 5 team members.

Project context:

- Product: `NEON EXCHANGE`
- Theme: interactive 2D pixel cyberpunk stock-market city
- Hackathon focus: Google Gemini Live API + multi-agent orchestration
- Current repo state: frontend prototype exists, backend/live intelligence stack is still pending

## 1. Shared Goal

The team is building a playable market world where:

- sectors are city districts
- stocks are NPCs
- market state changes the world visually
- live news and market signals feed agent reasoning
- Gemini Live + ADK drive explanations, scenarios, and world updates

Each team member should build their area so it can integrate through stable data contracts instead of ad hoc wiring.

## 2. Working Rules

- Keep identifiers stable across the project:
  - district IDs
  - ticker IDs
  - scenario IDs
  - event IDs
- Do not block another team member by changing shared contract shapes without documenting it.
- Every feature should expose a mock-first contract before live integration.
- Prefer incremental delivery:
  - mock
  - structured contract
  - live integration
  - polish

## 3. Team Overview

- Sariya: UI and Frontend Lead
- Bharath: Game Engine / World Simulation
- Chinmay: AI / Agent Systems
- Rahil: Data Pipeline / Market Signals
- Manav: Infrastructure / Integrations

## 4. Detailed Task Requirements By Member

### Sariya — UI and Frontend Lead

Primary mission:

- own the user-facing product experience
- keep the app cohesive, playable, readable, and demo-ready
- integrate backend/agent outputs into the frontend safely once contracts are ready

Core ownership:

- Next.js frontend shell
- login/signup/guest flow
- top header, left menu, right drawer, bottom HUD
- city-facing UI states
- interaction UX
- responsive polish
- final demo visual quality

Detailed tasks:

1. Frontend shell refinement
- keep the center city viewport as the hero
- maintain a minimal game-style HUD, not a dashboard layout
- keep left panel structured as a compact game menu
- keep right drawer compact and contextual
- ensure bottom HUD remains slim and readable

2. Auth and session UX
- maintain mock login/signup/guest flows
- keep avatar selection polished
- display current user in header
- support logout and local session persistence
- prepare auth state shape for future backend session replacement

3. Interaction layer
- ensure NPCs, props, newsstands, and minimap remain clickable
- ensure hover, selected, and nearby states feel game-like
- make speech/thought bubble interactions clear and readable
- make selected NPC state reflect in HUD and drawer

4. Frontend integration contracts
- define the expected frontend payload shapes for:
  - ticker state
  - district state
  - scenario payload
  - news payload
  - world event payload
  - agent explanation payload
- align these contracts with Chinmay, Rahil, and Manav

5. Final polish and demo flow
- ensure the app supports a clean hackathon demo path:
  - login
  - enter city
  - move avatar
  - click stock NPC
  - open newsstand
  - hear guide voice
  - trigger scenario/world changes
- own the final visual consistency pass

Deliverables:

- stable frontend app under `frontend/`
- updated component-level documentation if contract shapes change
- demo-ready shell and interaction flows
- frontend integration notes for backend consumers

Dependencies:

- needs ticker/news/world payload definitions from Rahil and Chinmay
- needs deployment/runtime endpoints and env wiring from Manav
- needs world/system events from Bharath for city rendering hooks

Definition of done:

- frontend runs cleanly
- all core flows are demoable without manual patching
- backend outputs can be plugged in without major UI redesign

### Bharath — Game Engine / World Simulation

Primary mission:

- own the city as a game world
- make the world feel like a real playable 2D level
- translate structured market/world events into movement, ambience, and map changes

Core ownership:

- canvas renderer behavior
- world layout rules
- tile/surface logic
- NPC movement behavior
- prop interaction behavior
- collision and traversal
- weather and district ambience response

Detailed tasks:

1. World layout system
- define district block layouts that read as real neighborhoods
- maintain roads, side streets, alleys, courtyards, tunnels, and landmarks
- make paths navigable and visually distinct
- ensure districts feel unique but stylistically cohesive

2. Movement and interaction model
- keep drag-to-pan smooth
- keep keyboard/avatar movement smooth and intentional
- maintain collision around buildings, railings, fences, and major props
- keep NPCs placed on walkable routes, not arbitrary empty space

3. NPC life systems
- maintain stock NPC idle/bob states
- maintain citizen wandering/patrol logic
- support facing behavior near player
- support future world-event-driven behavior changes:
  - nervous motion
  - crowding
  - route rerouting
  - district shutdown visuals

4. Prop interaction framework
- maintain interactive props:
  - vending machines
  - terminals
  - billboards
  - lamps
  - crates
  - landmarks
  - newsstands
- ensure prop reactions are lightweight and performant
- prepare hooks so World Renderer outputs can trigger prop-level state changes

5. World event rendering hooks
- define how district/world events affect:
  - rain intensity
  - glow intensity
  - traffic cues
  - NPC agitation
  - landmark pulses
  - storm tint
- align these hooks with Chinmay’s world event payload format

Deliverables:

- stable world rendering logic
- clean mock world config under `frontend/src/mock/`
- event hook points for live world updates
- documented world event application rules

Dependencies:

- needs structured world-event payload definitions from Chinmay
- needs live district/ticker state from Rahil
- coordinates closely with Sariya on visual priorities and HUD clarity

Definition of done:

- city feels like a game level, not a plotted graph
- world remains performant
- backend-driven events can visually update the world through clear hooks

### Chinmay — AI / Agent Systems

Primary mission:

- own the Gemini + agent reasoning layer
- define how live market/news inputs become explanations, scenarios, and world events

Core ownership:

- Gemini Live API usage design
- ADK orchestration
- agent responsibilities and schemas
- shared reasoning flow
- scenario generation format
- explanation payloads
- world renderer event payload schema

Detailed tasks:

1. Agent architecture definition
- finalize responsibilities for:
  - Market Analyst Agent
  - News Analyst Agent
  - Correlation Agent
  - Scenario Generator Agent
  - World Renderer Agent
- define input/output schema for each
- define when each agent runs

2. Shared memory and orchestration logic
- design how agents share:
  - market state
  - recent headlines
  - event logs
  - district conditions
  - scenario branches
  - confidence metadata
- define conflict-resolution rules when multiple agents emit overlapping world updates

3. Scenario system
- define structured scenario payloads:
  - continuation
  - mean reversion
  - shock event
- include confidence, expiry, confirmation logic, invalidation logic, and ripple impact
- prepare a concise frontend-ready explanation format

4. World event schema
- define the exact payload Bharath and Sariya will consume for:
  - district mood
  - weather regime
  - traffic intensity
  - NPC mood shifts
  - landmark pulses
  - alerts / rumor injections
- keep it small and deterministic enough for frontend rendering

5. Gemini Live integration plan
- decide how voice/text responses are produced
- define how live conversational state maps to guide dialogue
- plan how the city guide avatar is driven from agent output
- identify fallback behavior if live voice is unavailable

Deliverables:

- agent system design doc or schema definitions
- JSON contract definitions for agent outputs
- orchestration flow description
- world event payload contract

Dependencies:

- depends on Rahil for normalized market/news features
- depends on Manav for runtime hosting, secrets, and service deployment
- must coordinate with Sariya and Bharath so output payloads match rendering needs

Definition of done:

- agents have stable schemas
- frontend can consume agent outputs without custom parsing hacks
- orchestration logic is demoable on mocked or partial live data

### Rahil — Data Pipeline / Market Signals

Primary mission:

- own the live data ingestion and signal computation layer
- convert raw market/news feeds into structured features agents can trust

Core ownership:

- market feed ingestion
- news feed ingestion
- normalization
- signal extraction
- ticker/district mapping
- feature cadence and update quality

Detailed tasks:

1. Market data ingestion
- select and integrate a real-time market data source suitable for the hackathon
- ingest:
  - price
  - volume
  - intraday change
  - volatility proxy
  - liquidity proxy
- normalize updates into a stable ticker state object

2. News ingestion
- ingest live or near-live news/headline data
- normalize headlines into:
  - ticker-linked events
  - district-linked events
  - severity
  - relevance
  - timestamp
  - source
- ensure district newsstands can be updated from these outputs later

3. Signal extraction
- compute derived features such as:
  - trend direction
  - momentum regime
  - volatility regime
  - liquidity intensity
  - sector strength
  - cross-ticker relationship hints
- expose these as compact structured features for agent use

4. Mapping layer
- maintain mapping between:
  - tickers and districts
  - sectors and district IDs
  - live news items and relevant city areas
- ensure no mismatch with frontend ticker IDs

5. Update cadence and reliability
- target 1-second update cadence where feasible
- define throttling and snapshot behavior
- provide fallback mock/state behavior when feeds are delayed

Deliverables:

- normalized market event schema
- normalized news event schema
- feature extraction schema
- ticker/district mapping definitions
- test payloads for Chinmay and Sariya

Dependencies:

- needs infrastructure/runtime support from Manav
- must align identifiers with frontend data models owned by Sariya
- agent consumers are Chinmay and Bharath

Definition of done:

- live or near-live data is available in a stable normalized format
- derived features are reliable enough for agent reasoning
- frontend/demo can switch from mock to live payloads with minimal changes

### Manav — Infrastructure / Integrations

Primary mission:

- own deployment, runtime, environment management, and external integration plumbing
- make the system run reliably for demo and integration

Core ownership:

- Google Cloud setup
- Vertex AI runtime setup
- Cloud Run services
- Firestore/storage decisions
- secrets and env config
- CI/CD
- service connectivity
- final plugin/deep-link support

Detailed tasks:

1. Cloud environment setup
- set up project infrastructure for the hackathon environment
- provision required services:
  - Vertex AI
  - Cloud Run
  - Firestore or equivalent storage
  - Cloud Storage if needed
  - secrets management

2. Service deployment model
- define how services are separated:
  - ingestion service
  - agent/orchestration service
  - API or websocket/event service
- ensure services can be deployed and updated quickly during hackathon iteration

3. Secrets and environment management
- manage keys and environment values for:
  - Gemini/Vertex
  - market/news providers
  - deployment configuration
- provide local development env guidance for the team

4. Runtime integration
- make sure Rahil’s feeds, Chinmay’s agent runtime, and frontend consumers can communicate
- define transport strategy:
  - polling
  - websocket
  - SSE
  - hybrid model
- document the chosen approach clearly

5. Plugin and external handoff planning
- own the infrastructure needed for future:
  - “Open in Neon Exchange” stock-page handoff
  - route/deep-link resolution
  - external ticker entry
- this is lower priority than live demo stability

6. CI/CD and observability
- set up build/deploy pipeline
- provide logs and failure visibility
- provide a simple deployment checklist the team can follow before demo

Deliverables:

- deployed runtime plan
- environment variable matrix
- service endpoint map
- deployment instructions
- integration notes for frontend and backend consumers

Dependencies:

- depends on final service needs from Chinmay and Rahil
- frontend integration points must align with Sariya

Definition of done:

- the team can run the system locally and in cloud without guesswork
- secrets are organized
- services can be demonstrated reliably

## 5. Cross-Team Dependency Map

### Sariya depends on

- Chinmay for agent output schema
- Rahil for live data payloads
- Bharath for world event/render hooks
- Manav for runtime endpoints and env wiring

### Bharath depends on

- Sariya for product-level UX direction
- Chinmay for world event payloads
- Rahil for live district/ticker state

### Chinmay depends on

- Rahil for clean signal inputs
- Manav for Gemini/Vertex runtime deployment
- Sariya/Bharath for output contract validation

### Rahil depends on

- Manav for provider/runtime infrastructure
- Sariya for stable frontend identifiers
- Chinmay for feature expectations

### Manav depends on

- Chinmay and Rahil for service/runtime requirements
- Sariya for frontend env and endpoint expectations

## 6. Suggested Execution Order

### Phase 1 — Frontend Stability and Demo Shell

Owners:

- Sariya
- Bharath

Goals:

- polished frontend shell
- stable city traversal
- clean HUD and interaction flow

### Phase 2 — Data Contracts and Feature Schemas

Owners:

- Rahil
- Chinmay
- Sariya

Goals:

- normalized ticker/news payloads
- scenario/event payload definitions
- stable identifiers

### Phase 3 — Agent and World Event Integration

Owners:

- Chinmay
- Bharath
- Sariya

Goals:

- map live agent outputs into the city
- trigger NPC/world changes
- support live explanation flow

### Phase 4 — Infrastructure and Live Runtime

Owners:

- Manav
- Chinmay
- Rahil

Goals:

- deployed runtime
- live feeds running
- live agent orchestration connected

### Phase 5 — Demo Polish

Owners:

- All

Goals:

- remove brittle flows
- validate end-to-end demo script
- prepare a stable showcase

## 7. Final Team Checklist

### Sariya

- frontend shell polished
- HUD clean and usable
- interactions readable and demoable
- backend contract expectations documented

### Bharath

- world reads like a game city
- movement/collision stable
- NPCs and props react correctly
- world hooks ready for live event application

### Chinmay

- agent schemas finalized
- scenario payloads defined
- world event payload contract defined
- Gemini Live plan documented

### Rahil

- market and news pipelines normalized
- features exposed in stable schema
- district/ticker mapping stable
- update cadence acceptable

### Manav

- infrastructure configured
- runtime path documented
- secrets organized
- deployment flow stable
