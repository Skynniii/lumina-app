import { useState, useEffect, useCallback } from 'react';
import {
  doc, deleteField, writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getAllLocal, putLocal, deleteLocal, getLocal,
  addOutbox, notifyLocal, subscribeLocal,
  type OutboxEntry,
} from './localDB';
import type { Task } from '../types';

/**
 * Elimina recursivamente los valores `undefined` (Firestore no los admite).
 * Preserva sentinelas de Firestore (deleteField, increment, etc.).
 */
export function clean<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(clean) as unknown as T;
  if (obj && typeof obj === 'object') {
    if (typeof (obj as { isEqual?: unknown }).isEqual === 'function') return obj;
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

// ─── Utilidades ───

function genId(): string {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Detecta si un valor es un sentinel deleteField() de Firestore. */
function isDeleteField(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_methodName' in value &&
    (value as { _methodName: string })._methodName === 'deleteField'
  );
}

// ─── Hook Offline-First ───

/**
 * Hook genérico para subcolecciones con arquitectura Offline-First.
 *
 * - Lee de IndexedDB local (instantáneo, sin lecturas de Firestore).
 * - Las escrituras van a local + outbox (bandeja de salida).
 * - El syncEngine sube el outbox y descarga deltas en segundo plano.
 * - Sin onSnapshot: cero lecturas pasivas de Firestore.
 */
export function useFirestoreCollection<T extends { id: string }>(
  uid: string | null,
  subcollection: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    let mounted = true;

    // Cargar de IndexedDB (instantáneo)
    getAllLocal<T>(subcollection).then((docs) => {
      if (!mounted) return;
      setItems(docs);
      setLoading(false);
    });

    // Suscribirse a cambios locales (notificados por el syncEngine)
    const unsub = subscribeLocal(subcollection, () => {
      getAllLocal<T>(subcollection).then((docs) => {
        if (mounted) setItems(docs);
      });
    });

    return () => { mounted = false; unsub(); };
  }, [uid, subcollection]);

  /** Crea un documento con ID autogenerado localmente. */
  const add = useCallback(async (data: Omit<T, 'id'>): Promise<string> => {
    const id = genId();
    const now = new Date().toISOString();
    const newDoc = { ...data, id, updatedAt: now } as T;
    await putLocal(subcollection, newDoc);
    await addOutbox({ id: genId(), collection: subcollection, docId: id, operation: 'set', updatedAt: now } satisfies OutboxEntry);
    notifyLocal(subcollection);
    return id;
  }, [subcollection]);

  /** Crea/reemplaza un documento con ID específico. */
  const set = useCallback(async (id: string, data: Omit<T, 'id'>): Promise<void> => {
    const now = new Date().toISOString();
    const newDoc = { ...data, id, updatedAt: now } as T;
    await putLocal(subcollection, newDoc);
    await addOutbox({ id: genId(), collection: subcollection, docId: id, operation: 'set', updatedAt: now } satisfies OutboxEntry);
    notifyLocal(subcollection);
  }, [subcollection]);

  /** Actualiza campos de un documento. Usa deleteField() para eliminar campos. */
  const update = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    const now = new Date().toISOString();
    const current = await getLocal<T>(subcollection, id);
    if (!current) return;

    // Fusionar update en el doc local, manejando deleteField()
    const merged: Record<string, unknown> = { ...current };
    for (const [key, value] of Object.entries(data)) {
      if (isDeleteField(value)) {
        delete merged[key];
      } else {
        merged[key] = value;
      }
    }
    merged.updatedAt = now;

    await putLocal(subcollection, merged as T);
    await addOutbox({ id: genId(), collection: subcollection, docId: id, operation: 'update', updatedAt: now } satisfies OutboxEntry);
    notifyLocal(subcollection);
  }, [subcollection]);

  /** Elimina un documento. */
  const remove = useCallback(async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    await deleteLocal(subcollection, id);
    await addOutbox({ id: genId(), collection: subcollection, docId: id, operation: 'delete', updatedAt: now } satisfies OutboxEntry);
    notifyLocal(subcollection);
  }, [subcollection]);

  return { items, loading, add, set, update, remove };
}

// ─── Función auxiliar: incrementar tiempo de tarea (offline-first) ───

/**
 * Incrementa el totalTimeSpent de una tarea.
 * Lee de la DB local, incrementa, y encola en outbox.
 */
export async function incrementTaskTime(uid: string, taskId: string, seconds: number): Promise<void> {
  const task = await getLocal<Task>('tasks', taskId);
  if (!task) return;
  const now = new Date().toISOString();
  const newTime = (task.totalTimeSpent || 0) + seconds;
  const updated = { ...task, totalTimeSpent: newTime, updatedAt: now };
  await putLocal('tasks', updated);
  await addOutbox({ id: genId(), collection: 'tasks', docId: taskId, operation: 'update', updatedAt: now } satisfies OutboxEntry);
  notifyLocal('tasks');
}

// ─── Migración one-time ───

/**
 * Migración one-time: mueve los datos del documento único users/{uid}
 * (formato anterior) a las subcolecciones nuevas.
 * Idempotente: si ya migró, no hace nada.
 * Ahora incluye updatedAt en todos los documentos migrados.
 */
export async function migrateToSubcollections(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data._migrated_v2) return;

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. taskLists
  if (Array.isArray(data.lumina_lists)) {
    data.lumina_lists.forEach((list: Record<string, unknown>, i: number) => {
      batch.set(doc(db, 'users', uid, 'taskLists', String(list.id)), clean({
        name: list.name,
        position: i,
        createdAt: now,
        updatedAt: now,
        sortMode: list.sortMode,
        hoyListId: list.hoyListId,
      }));
    });
  }

  // 2. tasks
  if (Array.isArray(data.lumina_tasks)) {
    data.lumina_tasks.forEach((task: Record<string, unknown>) => {
      const scheduledDate = task.dueDate || undefined;
      const scheduledTime = task.dueTime || undefined;
      const dueDate = task.deadline || undefined;
      const subtasks = Array.isArray(task.subtasks)
        ? task.subtasks.map((s: Record<string, unknown>) => ({
            id: String(s.id),
            title: String(s.text ?? s.title ?? ''),
            completed: !!s.completed,
          }))
        : undefined;
      batch.set(doc(db, 'users', uid, 'tasks', String(task.id)), clean({
        listId: task.listId,
        title: task.text ?? task.title,
        completed: task.completed ?? false,
        isImportant: task.isImportant ?? false,
        createdAt: now,
        updatedAt: now,
        notes: task.notes || undefined,
        scheduledDate,
        scheduledTime,
        dueDate,
        activityId: task.activityId || undefined,
        completedAt: task.completedAt || undefined,
        subtasks,
        repeat: task.repeat,
        totalTimeSpent: task.totalTimeSpent || undefined,
      }));
    });
  }

  // 3. activities
  if (Array.isArray(data['tracker-activities'])) {
    data['tracker-activities'].forEach((act: Record<string, unknown>) => {
      batch.set(doc(db, 'users', uid, 'activities', String(act.id)), clean({
        name: act.name,
        color: act.color,
        updatedAt: now,
      }));
    });
  }

  // 4. timeSessions (from tracker-entries)
  if (Array.isArray(data['tracker-entries'])) {
    data['tracker-entries'].forEach((entry: Record<string, unknown>) => {
      const startedAt = Number(entry.startedAt);
      const endedAt = Number(entry.endedAt);
      batch.set(doc(db, 'users', uid, 'timeSessions', String(entry.id)), clean({
        taskId: entry.taskId || undefined,
        activityId: entry.activityId || '',
        description: entry.description || '',
        notes: entry.notes || undefined,
        startTime: new Date(startedAt).toISOString(),
        endTime: new Date(endedAt).toISOString(),
        duration: Number(entry.seconds) || 0,
        mode: 'stopwatch' as const,
        createdAt: new Date(endedAt).toISOString(),
        updatedAt: now,
      }));
    });
  }

  // 5. calendarEvents
  if (Array.isArray(data['calendar-events'])) {
    data['calendar-events'].forEach((ev: Record<string, unknown>) => {
      batch.set(doc(db, 'users', uid, 'calendarEvents', String(ev.id)), clean({
        title: ev.title,
        date: ev.date,
        start: ev.start,
        end: ev.end,
        color: ev.color,
        location: ev.location || undefined,
        notes: ev.notes || undefined,
        updatedAt: now,
      }));
    });
  }

  // Marca migración y limpia campos antiguos
  batch.update(userRef, {
    _migrated_v2: true,
    lumina_lists: deleteField(),
    lumina_tasks: deleteField(),
    'tracker-activities': deleteField(),
    'tracker-entries': deleteField(),
    'calendar-events': deleteField(),
  });

  await batch.commit();
}
