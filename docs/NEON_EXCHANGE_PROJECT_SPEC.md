# NEON EXCHANGE — Documentation Index

This repository now separates frontend and backend documentation so the project can be owned and executed in parallel.

## Documentation Structure

- Frontend product and UI spec:
  [docs/frontend/FRONTEND_SPEC.md](/Users/sariyarizwan/Documents/New%20project/docs/frontend/FRONTEND_SPEC.md)
- Backend, AI, data, and infrastructure spec:
  [docs/backend/BACKEND_SPEC.md](/Users/sariyarizwan/Documents/New%20project/docs/backend/BACKEND_SPEC.md)

## Current Repo Status

### Already Implemented In This Repo

- Next.js + React + TypeScript + Tailwind frontend shell in `frontend/`
- 2D top-down pixel cyberpunk city prototype
- district exploration and camera movement
- selectable stock NPCs
- mock login, signup, and guest flow
- right panel scenario UI
- district newsstand mock overlays
- plugin mode UI hook with placeholder stock links
- bottom dock placeholder for live voice UI

### Backend (Implemented)

- FastAPI gateway on port 8080 (`backend/main.py`)
- Finnhub-powered live market data with mock fallback (`backend/services/market_data.py`)
- Finnhub-powered live news with mock fallback (`backend/services/news_feed.py`)
- ADK-based multi-agent orchestration: market analyst, news analyst, correlation, scenario generator, world renderer (`backend/agents/`)
- Gemini Live voice WebSocket relay (`backend/routers/voice_router.py`)
- SSE streaming endpoint for real-time frontend updates (`/api/world/neon-stream`)
- Neon-state endpoint mapping real symbols to frontend fictional tickers (`/api/market/neon-state`)
- Shared memory singleton for cross-agent state (`backend/memory/shared_state.py`)
- Ticker mapping config bridging 23 fictional tickers to real symbols (`backend/config/ticker_mapping.py`)

### Frontend-Backend Integration (Implemented)

- API service layer with typed functions (`frontend/src/lib/api.ts`)
- LiveDataProvider context wrapping the app (`frontend/src/components/LiveDataProvider.tsx`)
- Live market hook with SSE + polling fallback (`frontend/src/hooks/useLiveMarket.ts`)
- Live news polling hook (`frontend/src/hooks/useLiveNews.ts`)
- Voice WebSocket hook with push-to-talk audio capture (`frontend/src/hooks/useVoice.ts`)
- BottomDock, SidebarLeft, RightPanel all consume live data with graceful mock fallback

### Still Pending

- Google Cloud deployment architecture
- real audio engine (currently Web Speech API + ambient wav)
- real plugin / stock-page integration

## Team Split

- Sariya: Frontend lead
- Bharath: Game/world simulation
- Chinmay: AI and agent systems
- Rahil: data pipeline and signals
- Manav: infrastructure and integrations

## Recommended Use

- Use the frontend spec for UI, player experience, map behavior, panels, auth, and city-world implementation details.
- Use the backend spec for live data, agents, memory, orchestration, infrastructure, and plugin integration planning.
- Use the `frontend/` folder as the application workspace.
