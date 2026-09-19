/**
 * Motor de sincronización Offline-First.
 *
 * Flujo:
 * 1. Subir cambios locales (outbox) a Firestore con writeBatch()
 * 2. Descargar deltas: where('updatedAt', '>', ultimaSincronizacion)
 * 3. Fusionar deltas en local (último en escribir gana)
 * 4. Actualizar ultimaSincronizacion
 *
 * Si no existe ultimaSincronizacion, hace carga completa (full load).
 */

import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import {
  bulkMergeLocal, getOutbox, removeOutbox, getMeta, setMeta, clearLocalDB,
  notifyLocal, getLocal,
} from './localDB';
import { clean } from './useFirestoreCollection';

const COLLECTIONS = ['tasks', 'taskLists', 'activities', 'timeSessions', 'calendarEvents'];

let syncing = false;
let currentUid: string | null = null;
let onlineHandler: (() => void) | null = null;
let visibilityHandler: (() => void) | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Procesa la bandeja de salida: sube los cambios locales a Firestore.
 * Coalesa entradas por documento (keep latest). Usa writeBatch para subir todo de golpe.
 */
async function processOutbox(uid: string): Promise<void> {
  const entries = await getOutbox();
  if (entries.length === 0) return;

  // Coalesar: conservar solo la entrada más reciente por documento
  const coalesced = new Map<string, typeof entries[number]>();
  for (const entry of entries) {
    const key = `${entry.collection}:${entry.docId}`;
    const existing = coalesced.get(key);
    if (!existing || entry.updatedAt > existing.updatedAt) {
      coalesced.set(key, entry);
    }
  }

  const batch = writeBatch(db);
  const toRemove: string[] = [];

  for (const entry of coalesced.values()) {
    const ref = doc(db, 'users', uid, entry.collection, entry.docId);

    if (entry.operation === 'delete') {
      batch.delete(ref);
    } else {
      // Para 'set' y 'update': leer el doc local y subirlo completo (set)
      const localDoc = await getLocal<Record<string, unknown>>(entry.collection, entry.docId);
      if (!localDoc) {
        // El doc fue eliminado localmente, omitir
        toRemove.push(entry.id);
        continue;
      }
      batch.set(ref, clean(localDoc));
    }
    toRemove.push(entry.id);
  }

  await batch.commit();

  for (const id of toRemove) {
    await removeOutbox(id);
  }
}

/**
 * Sincroniza una colección: consulta delta (o carga completa) y fusiona en local.
 */
async function syncCollection(uid: string, collName: string, lastSync: string | null): Promise<boolean> {
  const ref = collection(db, 'users', uid, collName);
  const snap = lastSync
    ? await getDocs(query(ref, where('updatedAt', '>', lastSync)))
    : await getDocs(ref); // Carga completa cuando no hay ultimaSincronizacion

  if (snap.empty) return false;

  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; updatedAt?: string }[];
  return bulkMergeLocal(collName, docs);
}

/**
 * Ejecuta un ciclo completo de sincronización.
 */
export async function syncAll(uid: string): Promise<void> {
  if (syncing || !uid) return;
  syncing = true;

  try {
    // Si cambió el usuario, limpiar DB local y empezar de cero
    const storedUid = await getMeta<string>('uid');
    if (storedUid && storedUid !== uid) {
      await clearLocalDB();
    }
    await setMeta('uid', uid);

    // 1. Subir cambios locales (outbox)
    await processOutbox(uid);

    // 2. Descargar deltas de la nube
    const lastSync = await getMeta<string>('lastSync');
    let anyChanged = false;
    for (const coll of COLLECTIONS) {
      const changed = await syncCollection(uid, coll, lastSync);
      if (changed) anyChanged = true;
    }

    // 3. Actualizar ultimaSincronizacion
    await setMeta('lastSync', new Date().toISOString());

    // 4. Notificar a los hooks para que relean de la DB local
    if (anyChanged) {
      for (const coll of COLLECTIONS) {
        notifyLocal(coll);
      }
    }
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    syncing = false;
  }
}

/**
 * Inicializa el motor de sincronización.
 * Sincroniza al inicio, al recuperar conexión, al regresar el foco, y cada 60s.
 */
export function initSyncEngine(uid: string): void {
  currentUid = uid;

  // Sincronización inicial
  syncAll(uid);

  // Sincronizar al recuperar conexión
  onlineHandler = () => syncAll(uid);
  window.addEventListener('online', onlineHandler);

  // Sincronizar al regresar el foco a la app
  visibilityHandler = () => {
    if (document.visibilityState === 'visible') syncAll(uid);
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  // Sincronización periódica cada 60 segundos
  intervalId = setInterval(() => syncAll(uid), 60000);
}

/**
 * Detiene el motor de sincronización (al cerrar sesión).
 */
export function stopSyncEngine(): void {
  if (onlineHandler) { window.removeEventListener('online', onlineHandler); onlineHandler = null; }
  if (visibilityHandler) { document.removeEventListener('visibilitychange', visibilityHandler); visibilityHandler = null; }
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  currentUid = null;
}
