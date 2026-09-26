/**
 * Base de datos local (IndexedDB) para el modelo Offline-First.
 *
 * Almacena todas las subcolecciones en un único object store 'data',
 * indexado por _collection para consultas rápidas por colección.
 * Incluye outbox (bandeja de salida) y meta (ultimaSincronizacion, uid).
 */

const DB_NAME = 'lumina-offline';
const DB_VERSION = 2;

export interface OutboxEntry {
  id: string;
  collection: string;
  docId: string;
  operation: 'set' | 'update' | 'delete';
  updatedAt: string;
}

// ─── Event emitter para reactividad de los hooks ───
// Debounce: múltiples notifyLocal dentro del mismo tick se agrupan en una
// sola notificación, evitando re-lecturas redundantes de IndexedDB durante
// operaciones masivas (seeds, bulk updates, etc.).
const listeners = new Map<string, Set<() => void>>();
let pendingNotify: Set<string> | null = null;

export function subscribeLocal(collection: string, cb: () => void): () => void {
  if (!listeners.has(collection)) listeners.set(collection, new Set());
  listeners.get(collection)!.add(cb);
  return () => { listeners.get(collection)?.delete(cb); };
}

export function notifyLocal(collection: string): void {
  if (!pendingNotify) {
    pendingNotify = new Set();
    queueMicrotask(() => {
      const batch = pendingNotify!;
      pendingNotify = null;
      for (const coll of batch) {
        listeners.get(coll)?.forEach((cb) => cb());
      }
    });
  }
  pendingNotify.add(collection);
}

// ─── IndexedDB ───
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
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
      }

      // v1 → v2: limpiar datos locales corruptos (seed que sobreescribió datos reales)
      // para que el sync engine haga una carga completa desde Firestore.
      if (oldVersion === 1) {
        if (db.objectStoreNames.contains('data')) db.deleteObjectStore('data');
        if (db.objectStoreNames.contains('outbox')) db.deleteObjectStore('outbox');
        if (db.objectStoreNames.contains('meta')) db.deleteObjectStore('meta');
        const store = db.createObjectStore('data', { keyPath: 'key' });
        store.createIndex('by_collection', '_collection');
        db.createObjectStore('outbox', { keyPath: 'id' });
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
// Coalescing: la clave es `${collection}:${docId}` para que múltiples
// operaciones sobre el mismo documento se fusionen en una sola entrada,
// evitando writes redundantes a Firestore.

export async function getOutbox(): Promise<OutboxEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readonly');
    const req = tx.objectStore('outbox').getAll();
    req.onsuccess = () => resolve(req.result as OutboxEntry[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addOutbox(entry: Omit<OutboxEntry, 'id'>): Promise<void> {
  const id = `${entry.collection}:${entry.docId}`;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('outbox', 'readwrite');
    tx.objectStore('outbox').put({ ...entry, id });
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

// ─── Operaciones batch (una sola transacción IndexedDB) ───

/** Escribe múltiples documentos + sus entradas de outbox en una sola transacción. */
export async function batchPutLocal<T extends { id: string }>(
  collection: string,
  docs: T[],
): Promise<void> {
  if (docs.length === 0) return;
  const db = await openDB();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['data', 'outbox'], 'readwrite');
    for (const doc of docs) {
      const docWithUpdated = { ...doc, updatedAt: now };
      tx.objectStore('data').put({ key: keyFor(collection, doc.id), _collection: collection, ...docWithUpdated });
      tx.objectStore('outbox').put({ id: `${collection}:${doc.id}`, collection, docId: doc.id, operation: 'set', updatedAt: now });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Elimina múltiples documentos + crea entradas de outbox en una sola transacción. */
export async function batchDeleteLocal(
  collection: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDB();
  const now = new Date().toISOString();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['data', 'outbox'], 'readwrite');
    for (const id of ids) {
      tx.objectStore('data').delete(keyFor(collection, id));
      tx.objectStore('outbox').put({ id: `${collection}:${id}`, collection, docId: id, operation: 'delete', updatedAt: now });
    }
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
