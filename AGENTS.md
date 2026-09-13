# Lumina — Base44 Dev Environment

## Overview
React 19 + TypeScript + Vite 8 frontend ("Lumina", a tasks/timer/calendar productivity app).
Uses Firebase (Auth + Firestore) with config hardcoded in `src/firebase.ts` — no env vars needed to boot.
Capacitor wraps the same code for Android (see `android/`, `capacitor.config.ts`); the web build is the primary target here.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 base image, source bind-mounted at `/app`, `node_modules` in a named volume.
- Runs `npm install && npm run dev -- --host 0.0.0.0 --port 5173`.
- Vite dev server (HMR) mapped to host port 3000.
- `vite.config.ts` already has `host: true` + `allowedHosts: true` (preview-compatible).

## Notes
- `@capacitor/core` (^5) and `@codetrix-studio/capacitor-google-auth` (^3.3.6) are real app deps used by `LoginScreen.tsx` for native Google Auth. They were missing from `package.json` and have been added. On web, `Capacitor.isNativePlatform()` returns false so the native path is skipped.
- Firebase config is hardcoded (not env-based), so no secrets are required to boot. Google sign-in will only work if the preview's domain is authorized in Firebase Console → Authentication → Settings → Authorized domains.
- No backend, no database service — Firebase is remote.

## Verify
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200
- `/src/main.tsx` and `/src/components/ui/LoginScreen.tsx` must return 200 (module resolution).
