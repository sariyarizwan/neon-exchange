# NEON EXCHANGE — Backend, AI, and Infrastructure Specification

## 1. Backend Purpose

The backend powers the live intelligence layer behind the NEON EXCHANGE city.

It must:

- ingest real market data
- ingest real news
- compute market signals
- orchestrate multiple AI agents
- maintain shared memory
- emit structured world updates to the frontend
- support future plugin-based deep links from stock websites

## 2. Backend Scope

The backend includes five major layers:

- data ingestion
- signal extraction
- AI agent orchestration
- shared memory and event state
- infrastructure and deployment

## 3. Current Backend Status

### Already Present In Repo

- frontend-facing TODO hooks for Gemini Live and ADK
- mock scenarios
- mock evidence timeline
- mock newsstand content
- placeholder plugin URLs

### Pending

- market data feeds
- news ingestion services
- signal extraction services
- Gemini Live runtime integration
- ADK orchestration
- shared memory store
- event pipeline
- production APIs or service endpoints
- Google Cloud deployment stack

## 4. Backend Architecture

### 4.1 Data Layer

Responsibilities:

- ingest real-time stock data
- normalize feed formats
- track ticker and district identifiers
- enrich market state with sector context

Inputs:

- stock price feed
- volume feed
- order-flow proxy feed
- volatility feed
- news feed

Outputs:

- normalized market event stream
- normalized news event stream

### 4.2 Signal Extraction Layer

Responsibilities:

- compute volatility regimes
- compute liquidity strength
- compute trend and momentum state
- compute sector strength
- compute correlation shifts
- generate compact structured features for agent reasoning

Target update cadence:

- every 1 second for market-driven state

### 4.3 AI Layer

The AI layer is built around Gemini Live API and Google ADK orchestration.

Agents:

- Market Analyst Agent
- News Analyst Agent
- Correlation Agent
- Scenario Generator Agent
- World Renderer Agent

Each agent should produce structured outputs rather than freeform text only.

### 4.4 Memory Layer

Shared memory must support:

- current market state
- district state
- scenario branches
- event logs
- recent news history
- recent agent conclusions
- confidence metadata

This layer ensures that agent collaboration is stateful and consistent.

### 4.5 Orchestration Layer

Responsibilities:

- route incoming events to the correct agents
- define event priority
- maintain shared context
- prevent conflicting world updates
- merge outputs into a single structured state for the frontend

### 4.6 Infrastructure Layer

Recommended stack:

- Google Cloud
- Vertex AI
- Cloud Run
- Firestore
- Cloud Storage
- Secret management and environment config
- observability and logging

## 5. Multi-Agent Responsibilities

### Market Analyst Agent

- interprets live price action
- evaluates trend, momentum, and volatility
- emits structured ticker and district summaries

### News Analyst Agent

- ingests and classifies headlines
- maps stories to tickers and sectors
- scores severity and relevance
- proposes rumor or catalyst events

### Correlation Agent

- tracks ticker and district relationships
- identifies contagion paths
- updates alliance structures

### Scenario Generator Agent

- builds continuation, mean reversion, and shock scenarios
- returns structured scenario objects for UI and world effects
- updates or invalidates branches over time

### World Renderer Agent

- translates AI outputs into frontend-ready world events
- drives district weather, traffic, NPC mood, landmark glow, and overlay states

## 6. Shared Orchestration Model

Agents share:

- market state
- event logs
- district conditions
- scenario branches
- confidence scores
- recent news context

Collaboration rules:

- agents consume the same canonical state
- downstream agents build on upstream outputs
- final world event payloads are merged centrally
- every major user-facing update should be traceable to data and agent reasoning

## 7. Backend Data Flow

1. Live market data arrives
2. Market events are normalized
3. Signal extractor computes derived features
4. News ingestion maps live headlines to tickers and districts
5. Agents process the shared state
6. Scenario engine updates active branches
7. World event payload is emitted
8. Frontend updates city state

### Target Cadence

- market updates: 1 second
- news updates: event-driven, near real-time
- scenario updates: on event or cadence-based refresh
- world payload updates: incremental, low-latency

## 8. API / Contract Expectations

The backend should expose clean payloads for:

- session bootstrap state
- live district states
- ticker state updates
- scenario updates
- evidence timeline items
- newsstand headline updates
- world event payloads
- plugin deep-link resolution

Recommended output style:

- versioned JSON contracts
- stable identifiers for districts and tickers
- event timestamps
- confidence and severity metadata

## 9. Infrastructure Plan

### Manav — Infrastructure / Integrations

Own:

- Google Cloud environment setup
- Vertex AI runtime setup
- Cloud Run service deployment
- Firestore and storage provisioning
- secrets and environment management
- CI/CD
- logging and monitoring
- final plugin integration support

### Chinmay — AI / Agent Systems

Own:

- agent design
- prompt and response schemas
- Gemini Live integration
- ADK orchestration
- shared memory coordination
- scenario generation logic

### Rahil — Data Pipeline / Market Signals

Own:

- live stock ingestion
- news ingestion
- normalization
- signal extraction
- mapping feeds to districts and tickers
- data quality and freshness monitoring

## 10. Backend Development Phases

### Phase B1 — Data Ingestion Foundation

- choose feeds
- normalize events
- map ticker identifiers

### Phase B2 — Signal Computation

- regime engine
- liquidity engine
- correlation signals
- district state derivation

### Phase B3 — AI Runtime

- Gemini Live connection
- ADK orchestration
- agent schemas

### Phase B4 — Shared Memory

- event timeline
- scenario memory
- district memory
- reasoning continuity

### Phase B5 — Frontend Event Contracts

- emit renderer-friendly payloads
- define incremental update format

### Phase B6 — News Intelligence

- classify stories
- map stories to sectors and tickers
- trigger rumor and kiosk updates

### Phase B7 — Infra Hardening

- deploy services
- monitoring
- scaling
- demo stability

### Phase B8 — Plugin Integration

- deep-link strategy
- stock-page handoff
- app centering on ticker context

## 11. Backend Task Checklist

| Task | Description | Owner | Dependencies | Priority |
|---|---|---|---|---|
| Choose and connect market feeds | Select source and implement live market ingestion pipeline | Rahil | Infra setup | High |
| Normalize ticker and sector mappings | Standardize ticker IDs, district IDs, and sector mapping | Rahil | Market feed ingestion | High |
| Build signal extraction service | Compute regime, liquidity, momentum, and correlation features | Rahil | Normalized feed pipeline | High |
| Ingest real news feeds | Normalize news events and map stories to tickers and districts | Rahil | Infra setup | High |
| Design agent schemas | Define prompts, tool contracts, event inputs, and outputs | Chinmay | Product requirements | High |
| Integrate Gemini Live API | Implement live reasoning runtime | Chinmay | Vertex AI setup | High |
| Build ADK orchestration | Coordinate agent execution and result merging | Chinmay | Agent schema design | High |
| Build shared memory store | Persist context, scenarios, and event history | Chinmay, Manav | Firestore provisioning | High |
| Provision Google Cloud stack | Set up Cloud Run, Vertex AI, Firestore, storage, and secrets | Manav | GCP project access | High |
| Add CI/CD and monitoring | Logging, deployment workflow, health checks, and alerting | Manav | Core services in place | Medium |
| Build world event service | Emit frontend-ready district and ticker update payloads | Chinmay, Bharath | Signals and agent outputs | High |
| Plan plugin integration service | Define stock-page deep-link protocol and future extension architecture | Manav | Core product stable | Low |

