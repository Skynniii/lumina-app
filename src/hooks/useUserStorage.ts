import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

/**
 * Almacén por usuario: un ÚNICO documento `users/{uid}` con toda la data.
 * Un solo documento minimiza el espacio (sin metadata extra por documento).
 */
class UserDataStore {
  uid: string | null = null;
  data: Record<string, unknown> = {};
  loading: Promise<void> | null = null;
  writeTimer: ReturnType<typeof setTimeout> | null = null;

  async load(uid: string) {
    if (this.uid === uid && this.loading) return this.loading;
    this.uid = uid;
    this.data = {};
    this.loading = (async () => {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        this.data = snap.data() as Record<string, unknown>;
      } else {
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
          await setDoc(ref, clean(migrated), { merge: true });
        }
      }
    })();
    return this.loading;
  }

  get(key: string) {
    return this.data[key];
  }

  set(key: string, value: unknown) {
    this.data[key] = value;
    this._scheduleWrite();
  }

  private _scheduleWrite() {
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      if (!this.uid) return;
      setDoc(doc(db, 'users', this.uid), clean(this.data), { merge: true }).catch((e) =>
        console.error('Firestore write error:', e),
      );
    }, 400);
  }

  reset() {
    this.uid = null;
    this.data = {};
    this.loading = null;
    if (this.writeTimer) clearTimeout(this.writeTimer);
  }
}

const store = new UserDataStore();

/**
 * Reemplazo directo de `useLocalStorage` que, cuando hay sesión iniciada,
 * guarda los datos en Firestore (un documento por usuario). Si no hay sesión,
 * usa localStorage como respaldo.
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
    store.load(uid).then(() => {
      if (!active) return;
      const v = store.get(key);
      setValueInternal(v === undefined ? initialRef.current : (v as T));
    });
    return () => {
      active = false;
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
