# Base44 Dev Environment

## Overview
React + TypeScript + Vite frontend (app name: "mi-app"). Uses Firebase Auth (Google sign-in) and Firestore for data. Firebase config is hardcoded in `src/firebase.ts` — no environment variables or external credentials needed to boot.

## Running
- `docker compose -f docker-compose.base44.yml up -d`
- Vite dev server on port 5173 inside container, mapped to host port 3000.
- Dependencies install automatically on container start (`npm install` then `npm run dev`).
- `node_modules` is a named volume so installs persist across restarts.

## Architecture
- Pure frontend SPA — no backend service.
- Auth gate: `AuthProvider` wraps the app; shows `LoginScreen` until Firebase auth completes. Google sign-in popup.
- Main views: cronometro (timer), habitos (tasks), tracker, calendar — selected via `NavegacionBar`.
- State: React context (`AuthContext`, `SettingsContext`) + hooks (`useTasks`, `useTimeTracker`, `useTimer`, `useCalendarEvents`, `useLocalStorage`, `useUserStorage`).
- Styling: Tailwind CSS v4 + framer-motion for animations.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` should return 200.
- The page should show a login screen (Google sign-in) since Firebase auth requires interaction.
