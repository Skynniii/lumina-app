# Base44 Dev Environment

## Stack
- Vite + React 19 + TypeScript + Tailwind CSS v4
- Firebase (Auth with Google sign-in, Firestore for data)
- framer-motion for animations

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
- Web entry point: host port 3000 → container port 5173 (Vite dev server)
- Vite config already sets `host: true` and `allowedHosts: true`

## Notes
- Firebase config is hardcoded in `src/firebase.ts` (standard — these are public client-side values, not secrets).
- No external secrets required to boot. Firebase auth requires Google sign-in popup; Firestore security rules must allow the configured project.
- Dependencies are installed at container startup via `npm install`; `node_modules` is stored in a named volume to avoid bind-mount conflicts.
