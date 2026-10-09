# AGENTS.md

## What this app is

`Lumina` (`mi-app`): a single-page React 19 + TypeScript + Vite app, styled with
Tailwind CSS 4. There is **no backend service in this repo** — data and auth go
directly to Firebase from the browser (`src/firebase.ts`). A Capacitor Android
shell lives in `android/` but is not part of the sandbox setup.

## Running it in the Base44 sandbox

- `docker compose -f docker-compose.base44.yml up -d --build`
- Only one service (`web`): `node:22-alpine`, repo bind-mounted at `/app`, deps
  installed into a named `node_modules` volume on startup (`npm ci`), Vite dev
  server on container port 5173 mapped to host **3000**.
- `node_modules` is a Docker volume, not the host bind mount — do not expect
  host `node_modules` to be populated, and never delete the volume to refresh
  deps (a container restart re-runs `npm ci`).
- HMR needs polling on the bind mount: `CHOKIDAR_USEPOLLING=true` is set in
  `docker-compose.base44.yml`.

## Configuration / secrets

Firebase web config (api key, project id, etc.) is **committed in
`src/firebase.ts`** — it is a public client config and needs no app secret. No
`/run/base44/app.env` entries are required; `.base44/environment.json` lists no
secrets. There are no `import.meta.env.*` reads anywhere in `src/`.

## Cabecera de sección (UI)

- Todas las secciones usan `src/components/ui/SectionHeader.tsx`, con exactamente
  la misma posición/márgenes que la cabecera de Tasks (safe-area top + `px-5 pt-3`,
  y `TopBar` con `px-4 py-2.5`). Para mover el título, cámbialo ahí y no en cada
  sección. El color de fondo es propio de cada sección y llega por la prop
  `background` (Tasks blanco, el resto `#f7f6f9`).
- La cabecera va **fuera** de la zona scrolleable en todas las secciones
  (`flex flex-col` + contenedor interno `overflow-y-auto`), por eso queda fija.

## Barra de estado en Android (Capacitor)

- `android/app/src/main/java/com/lumina/app/MainActivity.java` activa edge-to-edge
  (`WindowCompat.setDecorFitsSystemWindows(false)`), deja transparentes la barra de
  estado y la de navegación, y fuerza iconos oscuros: así el color superior de la
  app se ve detrás de la barra de estado (fusión tipo app nativa).
  Las cabeceras reservan ese espacio con `env(safe-area-inset-top)`.
- `res/values/styles.xml` usa el mismo color como respaldo para la pantalla de
  arranque. `res/values/colors.xml` se añadió porque `styles.xml` referenciaba
  `@color/colorPrimary` y no estaba definido.
- El proyecto Android **no** se compila en el sandbox (`@capacitor/android` no está
  instalado): los cambios nativos requieren `npx cap sync android` + Gradle local.

## Teclado en pantalla (Android)

- `src/hooks/useKeyboardVisible()` indica si el teclado está abierto: compara la
  altura del `visualViewport` con la mayor observada, así funciona tanto con
  `interactive-widget=resizes-content` como con `overlays-content` (meta viewport
  en `index.html`). Devuelve `false` en escritorio, donde no hay teclado.
- Con el teclado abierto se ocultan los controles que quedarían encima de él:
  la barra inferior (papelera + Completada) en `TaskDetailView` y los botones
  principales de `FocusScreen`, añadiendo la clase `hidden`. Se restauran al
  cerrar el teclado y su comportamiento sin el flag es el de siempre.
- Para no cerrar y reabrir el teclado al pasar del título a las notas (y al
  revés) el foco se aplica en el mismo frame: `useLayoutEffect` + `el.focus()`
  (sin `setTimeout`) y `onMouseDown={preventDefault}` en la cabecera de notas de
  `TaskDetailView`.
- En `NuevaTareaModal` el panel de notas se cierra al tocar cualquier zona
  interior del modal o el botón Notas cuando la nota está vacía (con contenido
  solo lo cierra el botón); el editor de notas y la barra de formato hacen
  `stopPropagation` para no cerrarlo al escribir.

## Botón atrás de Android

- `src/utils/backButton.ts` mantiene una pila de manejadores y escucha el evento
  `backButton` de `@capacitor/app`: cierra la pantalla/modal más reciente y, si no
  hay nada abierto, sale de la app (`App.exitApp()`). `initBackButton()` se llama
  una vez desde `App.tsx` y es idempotente.
- Cada pantalla o modal llama a `useBackHandler(active, onBack)` (`src/hooks/useBackHandler.ts`).
  El que se registra último es el que está más arriba en pantalla, así que se
  cierra en orden correcto. **Al crear una pantalla o modal nuevo, añade esa línea**
  para que el botón atrás no salga de la app.
- `@capacitor/app` es una dependencia nueva; queda registrada a mano en
  `android/capacitor.settings.gradle` y `android/app/capacitor.build.gradle`
  (es lo que genera `npx cap sync android`).

## Sección Calendario

- `src/hooks/useCalendarData.ts` es la única fuente de datos del calendario: cruza
  tareas (`useTasks`), registros (`timeSessions`), actividades y eventos
  (`calendarEvents`) en una lista de `CalendarItem` con `kind`
  (`pending | completed | session | event`), fecha, minutos de inicio/fin y color.
  Las tareas y los registros se **derivan** de sus colecciones (no se copian); los
  eventos son la única fuente propia. Al añadir información al calendario, añade
  una capa ahí y usa `LAYER_META` para su color/etiqueta.
- Vistas: `MonthGrid` (mes), `TimeGrid` (rejilla horaria; con 7 días es semana y
  con 1 día es día), `DaySummary` (resumen) y `DayAgenda` (agenda cronológica).
  `CalendarToolbar` cambia de vista y filtra capas; los filtros se guardan en
  `users/{uid}` con la clave `calendar-layers` (`useUserStorage`).
- Los eventos ya **no** se siembran para usuarios nuevos (`useCalendarEvents`):
  el calendario arranca vacío y solo muestra lo que el usuario crea.
- `NuevaTareaModal` acepta `initialDate` para crear una tarea fechada desde el
  calendario; se guarda con `addTaskWithData` de `useTasks`, así que aparece igual
  en la sección de Tasks. El botón + de la barra de navegación abre
  `CalendarQuickAdd` (elegir tarea o evento).
- Detalles: los eventos usan `EventDetail`/`EventForm`, las tareas
  `TaskDetailView`, los registros `SessionDetailModal` (con
  `incrementTaskTime` al vincular/desvincular, igual que en `TimeTracker`).

## Quirks

- `vite.config.ts` sets `server.allowedHosts: true`; the compose file also
  passes `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` through for robustness.
- Firestore offline persistence (`enableIndexedDbPersistence`) logs a
  `failed-precondition` warning when the app is opened in several tabs — that is
  expected, not a bug.
- Firebase Auth sign-in is required for most screens; signed-out previews show
  the login screen only.

## How to verify it works

- `curl -s http://localhost:3000/ | head` must return the HTML shell **with**
  `<script type="module" src="/@vite/client">` — that proves the live Vite dev
  server (not a prebuilt bundle) is serving the page.
- `docker compose -f docker-compose.base44.yml ps` should show `web` as healthy.
