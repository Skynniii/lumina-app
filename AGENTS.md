# Base44 Dev Environment

## Stack
- **Frontend:** React 19 + TypeScript + Vite 8 (dev server on port 5173, mapped to host 3000)
- **Backend:** None — client-side only. Uses Firebase (Auth + Firestore) with config hardcoded in `src/firebase.ts` (Firebase web config is public by design; secured by Firestore rules).
- **Mobile:** Capacitor wrapper (Android). Native-only code paths are guarded by `Capacitor.isNativePlatform()`.

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Node 22 Alpine container, source bind-mounted at `/app`, `node_modules` in a named volume.
- Runs `npm install && npm run dev -- --host 0.0.0.0 --port 5173`.
- Vite config already has `server.host: true` and `allowedHosts: true` (preview-compatible).
- Live reload enabled; file-watch polling on (`CHOKIDAR_USEPOLLING=true`) for bind-mount reliability.

## Notes
- `@capacitor/core` and `@codetrix-studio/capacitor-google-auth` were missing from `package.json` but imported by `src/components/ui/LoginScreen.tsx`. They were added as dependencies so the web build resolves; on web the native Google Auth path is never taken (`Capacitor.isNativePlatform()` is false).
- No external secrets required — Firebase config is embedded in source.
- The app starts at a Google login screen (Firebase Auth). Firestore data syncs from the cloud.

## Verify
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- Preview shows the Lumina login screen with a "Iniciar sesión con Google" button.
