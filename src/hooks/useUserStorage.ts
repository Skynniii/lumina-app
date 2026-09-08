import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Claves de datos locales que se migran a Firestore en el primer inicio de sesión.
const LOCAL_KEYS = [
  'lumina_settings',
  'lumina_lists',
  'lumina_tasks',
  'tracker-activities',
  'tracker-entries',
  'tracker-running',
  'tracker-draft',
  'calendar-events',
];

// Elimina recursivamente las claves con valor `undefined`.
// Firestore no admite undefined y omitir campos vacíos ahorra espacio.
function clean<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(clean) as unknown as T;
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
      const v = (obj as Record<string, unknown>)[k];
      if (v === undefined) continue;
      out[k] = clean(v);
    }
    return out as unknown as T;
  }
  return obj;
}

type Listener = (value: unknown) => void;

/**
 * Almacén por usuario: un ÚNICO documento `users/{uid}` con toda la data.
 * Usa `onSnapshot` para sincronización en TIEMPO REAL entre dispositivos:
 * cualquier cambio remoto (otro dispositivo) se refleja al instante aquí.
 * Las escrituras locales se aplican optimistamente y se persisten con un
 * pequeño debounce; mientras una clave está "sucia" (pendiente de escribir),
 * no se sobrescribe con datos remotos para no perder el cambio local.
 */
class UserDataStore {
  uid: string | null = null;
  data: Record<string, unknown> = {};
  loading: Promise<void> | null = null;
  writeTimer: ReturnType<typeof setTimeout> | null = null;
  dirtyKeys = new Set<string>();
  listeners = new Map<string, Set<Listener>>();
  unsub: (() => void) | null = null;

  async load(uid: string) {
    if (this.uid === uid && this.loading) return this.loading;
    this.teardown();
    this.uid = uid;
    this.data = {};
    this.loading = new Promise<void>((resolve) => {
      const ref = doc(db, 'users', uid);
      let firstDone = false;
      const finishFirst = () => { if (!firstDone) { firstDone = true; resolve(); } };
      this.unsub = onSnapshot(
        ref,
        async (snap) => {
          if (snap.exists()) {
            this.mergeData(snap.data() as Record<string, unknown>);
          } else if (!firstDone) {
            // Migración automática: sube los datos de localStorage la primera vez.
            const migrated: Record<string, unknown> = {};
            for (const k of LOCAL_KEYS) {
              const raw = localStorage.getItem(k);
              if (raw) {
                try {
                  migrated[k] = JSON.parse(raw);
                } catch {
                  /* ignore */
                }
              }
            }
            if (Object.keys(migrated).length) {
              this.data = migrated;
              this.dirtyKeys = new Set(Object.keys(migrated));
              try {
                await setDoc(ref, clean(migrated), { merge: true });
              } catch (e) {
                console.error('Firestore migration error:', e);
              }
              this.dirtyKeys.clear();
            }
          }
          finishFirst();
        },
        (err) => {
          console.error('Firestore snapshot error:', err);
          finishFirst();
        },
      );
    });
    return this.loading;
  }

  // Fusiona los datos entrantes del snapshot: notifica a los suscriptores de
  // las claves que cambiaron, sin pisar las claves con escritura pendiente.
  private mergeData(incoming: Record<string, unknown>) {
    for (const key of Object.keys(incoming)) {
      if (this.dirtyKeys.has(key)) continue;
      const prev = this.data[key];
      const next = incoming[key];
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        this.data[key] = next;
        this.listeners.get(key)?.forEach((cb) => cb(next));
      }
    }
  }

  get(key: string) {
    return this.data[key];
  }

  set(key: string, value: unknown) {
    this.data[key] = value;
    this.dirtyKeys.add(key);
    this._scheduleWrite();
  }

  private _scheduleWrite() {
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(async () => {
      if (!this.uid) return;
      this.writeTimer = null;
      try {
        await setDoc(doc(db, 'users', this.uid), clean(this.data), { merge: true });
        // Tras persistir, las claves dejan de estar sucias: futuros snapshots
        // remotos podrán actualizarlas (sync cross-device).
        this.dirtyKeys.clear();
      } catch (e) {
        console.error('Firestore write error:', e);
        this.dirtyKeys.clear();
      }
    }, 400);
  }

  subscribe(key: string, cb: Listener) {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(cb);
    return () => {
      this.listeners.get(key)?.delete(cb);
    };
  }

  teardown() {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.dirtyKeys.clear();
    this.listeners.clear();
  }

  reset() {
    this.teardown();
    this.uid = null;
    this.data = {};
    this.loading = null;
  }
}

const store = new UserDataStore();

/**
 * Reemplazo directo de `useLocalStorage` que, cuando hay sesión iniciada,
 * guarda los datos en Firestore (un documento por usuario) con sincronización
 * en tiempo real. Si no hay sesión, usa localStorage como respaldo.
 */
export function useUserStorage<T>(key: string, initialValue: T) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const initialRef = useRef(initialValue);
  initialRef.current = initialValue;
  const [value, setValueInternal] = useState<T>(initialValue);

  useEffect(() => {
    let active = true;
    if (uid === null) {
      // Sin sesión: cierra el listener remoto y usa localStorage.
      store.reset();
      try {
        const s = localStorage.getItem(key);
        if (s) setValueInternal(JSON.parse(s));
      } catch {
        /* ignore */
      }
      return () => {
        active = false;
      };
    }
    // Suscripción en tiempo real: actualiza el estado cuando el dato cambia
    // remotamente (otro dispositivo), sin recargar la página.
    const unsub = store.subscribe(key, (next) => {
      setValueInternal((prev) => {
        if (prev === next) return prev;
        return JSON.stringify(prev) === JSON.stringify(next) ? prev : (next as T);
      });
    });
    store.load(uid).then(() => {
      if (!active) return;
      const v = store.get(key);
      setValueInternal(v === undefined ? initialRef.current : (v as T));
    });
    return () => {
      active = false;
      unsub();
    };
  }, [uid, key]);

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;
        if (uid === null) {
          try {
            localStorage.setItem(key, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        } else {
          store.set(key, next);
        }
        return next;
      });
    },
    [key, uid],
  );

  return [value, setValue] as const;
}
