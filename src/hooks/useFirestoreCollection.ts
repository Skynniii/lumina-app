import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot,
  increment, deleteField, writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Elimina recursivamente los valores `undefined` (Firestore no los admite).
 * Los campos opcionales vacíos se omiten pasándolos como `undefined` antes de llamar clean().
 */
export function clean<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(clean) as unknown as T;
  if (obj && typeof obj === 'object') {
    // Preserva sentinelas de Firestore (deleteField, increment, etc.)
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

/**
 * Hook genérico para subcolecciones de Firestore con sincronización en tiempo real.
 * Escucha cambios vía onSnapshot y expone operaciones CRUD.
 */
export function useFirestoreCollection<T extends { id: string }>(
  uid: string | null,
  subcollection: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    const ref = collection(db, 'users', uid, subcollection);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore error on ${subcollection}:`, err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [uid, subcollection]);

  /** Crea un documento con ID autogenerado. */
  const add = useCallback(async (data: Omit<T, 'id'>): Promise<string> => {
    if (!uid) throw new Error('No user');
    const ref = await addDoc(collection(db, 'users', uid, subcollection), clean(data));
    return ref.id;
  }, [uid, subcollection]);

  /** Crea/reemplaza un documento con ID específico. */
  const set = useCallback(async (id: string, data: Omit<T, 'id'>): Promise<void> => {
    if (!uid) return;
    await setDoc(doc(db, 'users', uid, subcollection, id), clean(data));
  }, [uid, subcollection]);

  /** Actualiza campos de un documento. Usa deleteField() para eliminar campos. */
  const update = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, subcollection, id), clean(data));
  }, [uid, subcollection]);

  /** Elimina un documento. */
  const remove = useCallback(async (id: string): Promise<void> => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, subcollection, id));
  }, [uid, subcollection]);

  return { items, loading, add, set, update, remove };
}

/**
 * Incrementa atómicamente el totalTimeSpent de una tarea.
 * Si el campo no existe en Firestore, increment() lo crea.
 */
export async function incrementTaskTime(uid: string, taskId: string, seconds: number): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    totalTimeSpent: increment(seconds),
  });
}

/**
 * Migración one-time: mueve los datos del documento único users/{uid}
 * (formato anterior) a las subcolecciones nuevas.
 * Idempotente: si ya migró, no hace nada.
 */
export async function migrateToSubcollections(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  if (data._migrated_v2) return;

  const batch = writeBatch(db);

  // 1. taskLists
  if (Array.isArray(data.lumina_lists)) {
    data.lumina_lists.forEach((list: Record<string, unknown>, i: number) => {
      batch.set(doc(db, 'users', uid, 'taskLists', String(list.id)), clean({
        name: list.name,
        position: i,
        createdAt: new Date().toISOString(),
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
        createdAt: new Date().toISOString(),
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
