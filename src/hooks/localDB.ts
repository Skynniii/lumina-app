/**
 * Base de datos local (IndexedDB) para el modelo Offline-First.
 *
 * Almacena todas las subcolecciones en un único object store 'data',
 * indexado por _collection para consultas rápidas por colección.
 * Incluye outbox (bandeja de salida) y meta (ultimaSincronizacion, uid).
 */

const DB_NAME = 'lumina-offline';
const DB_VERSION = 1;

export interface OutboxEntry {
  id: string;
  collection: string;
  docId: string;
  operation: 'set' | 'update' | 'delete';
  updatedAt: string;
}

// ─── Event emitter para reactividad de los hooks ───
const listeners = new Map<string, Set<() => void>>();

export function subscribeLocal(collection: string, cb: () => void): () => void {
  if (!listeners.has(collection)) listeners.set(collection, new Set());
  listeners.get(collection)!.add(cb);
  return () => { listeners.get(collection)?.delete(cb); };
}

export function notifyLocal(collection: string): void {
  listeners.get(collection)?.forEach((cb) => cb());
}

// ─── IndexedDB ───
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('data')) {
        const store = db.createObjectStore('data', { keyPath: 'key' });
        store.createIndex('by_collection', '_collection');
      }
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function keyFor(collection: string, id: string): string {
  return `${collection}:${id}`;
}

// ─── Operaciones de datos ───

export async function getAllLocal<T extends { id: string }>(collection: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const index = tx.objectStore('data').index('by_collection');
    const req = index.getAll(collection);
    req.onsuccess = () => {
      const results = (req.result as { key: string; _collection: string; [k: string]: unknown }[]).map(
        ({ key, _collection, ...doc }) => doc as T,
      );
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getLocal<T extends { id: string }>(collection: string, id: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const req = tx.objectStore('data').get(keyFor(collection, id));
    req.onsuccess = () => {
      if (!req.result) { resolve(null); return; }
      const { key, _collection, ...doc } = req.result as { key: string; _collection: string; [k: string]: unknown };
      resolve(doc as T);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function putLocal<T extends { id: string }>(collection: string, doc: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').put({ key: keyFor(collection, doc.id), _collection: collection, ...doc });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocal(collection: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').delete(keyFor(collection, id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Fusiona documentos delta de la nube al almacenamiento local.
 * Regla: último en escribir gana (compara updatedAt).
 * Si la nube gana, elimina la entrada de outbox correspondiente (el cambio local quedó obsoleto).
 * Retorna true si hubo cambios.
 */
export async function bulkMergeLocal(
  collection: string,
  docs: { id: string; updatedAt?: string }[],
): Promise<boolean> {
  const localDocs = await getAllLocal<{ id: string; updatedAt?: string }>(collection);
  const localMap = new Map(localDocs.map((d) => [d.id, d]));
  const outbox = await getOutbox();

  let changed = false;
  const toPut: Record<string, unknown>[] = [];
  const outboxToRemove: string[] = [];

  for (const serverDoc of docs) {
    const localDoc = localMap.get(serverDoc.id);
    const localUpdatedAt = localDoc?.updatedAt ?? '';
    const serverUpdatedAt = serverDoc.updatedAt ?? '';

    if (!localDoc || serverUpdatedAt > localUpdatedAt) {
      // La nube gana: sobrescribe el local
      toPut.push(serverDoc);
      outbox
        .filter((e) => e.collection === collection && e.docId === serverDoc.id)
        .forEach((e) => outboxToRemove.push(e.id));
      changed = true;
    }
    // Si el local gana, no hace nada (se subirá vía outbox)
  }

  if (toPut.length > 0) {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('data', 'readwrite');
      for (const doc of toPut) {
        tx.objectStore('data').put({ key: keyFor(collection, doc.id as string), _collection: collection, ...doc });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  for (const id of outboxToRemove) {
    await removeOutbox(id);
  }

  return changed;
}

// ─── Outbox (bandeja de salida) ───

export async function getOutbox(): Promise<OutboxEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readonly');
    const req = tx.objectStore('outbox').getAll();
    req.onsuccess = () => resolve(req.result as OutboxEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addOutbox(entry: OutboxEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeOutbox(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Meta (ultimaSincronizacion, uid) ───

export async function getMeta<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const req = tx.objectStore('meta').get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearLocalDB(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['data', 'outbox', 'meta'], 'readwrite');
    tx.objectStore('data').clear();
    tx.objectStore('outbox').clear();
    tx.objectStore('meta').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
