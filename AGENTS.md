# Base44 Dev Environment

## Overview
Pure frontend app: React 19 + TypeScript + Vite 8 + Tailwind CSS v4. No backend, no database, no external services. All persistence is client-side via `localStorage` (see `src/hooks/useLocalStorage.ts`).

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts the Vite dev server on host port 3000 (container port 5173).
- The compose service installs npm deps on first boot, then runs `vite` with HMR. Source is bind-mounted, so edits hot-reload live.
- Vite config (`vite.config.ts`) already sets `server.host: true` and `allowedHosts: true`, so the preview's external hostname works out of the box.

## Verifying
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` should return the HTML document.
- The served `/src/main.tsx` is transformed by Vite on the fly (not a prebuilt bundle) — confirms the edit loop is live.

## Secrets
None required. The app has no external service dependencies.
