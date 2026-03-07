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

### Still Pending

- real live market data
- real live news ingestion
- Gemini Live API integration
- ADK-based multi-agent orchestration
- shared memory backend
- Google Cloud deployment architecture
- real audio engine
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
