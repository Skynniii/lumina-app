import type { TimeSession } from '../types';
import type { RunningTimer, TrackerDraft } from '../hooks/useTimeTracker';
import { incrementTaskTime } from '../hooks/useFirestoreCollection';
import { putLocal, addOutbox, notifyLocal, deleteLocal } from '../hooks/localDB';

/** Segundos acumulados del cronómetro en curso. */
export function runningDuration(running: RunningTimer, end = Date.now()): number {
  return running.accumulated + (running.startedAt ? Math.floor((end - running.startedAt) / 1000) : 0);
}

/**
 * Guarda la sesión del cronómetro en curso (offline-first).
 * Reutilizado por el Timer y por la lista de Tasks, para que detener una
 * tarea-actividad desde ahí registre exactamente el mismo registro.
 */
export async function saveRunningSession(uid: string, running: RunningTimer, draft: TrackerDraft): Promise<number> {
  const end = Date.now();
  const duration = runningDuration(running, end);
  if (duration < 1) return 0;

  const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  const session: TimeSession = {
    id,
    taskId: draft.taskId || undefined,
    activityId: draft.activityId || '',
    description: draft.description.trim(),
    notes: draft.notes.trim() || undefined,
    startTime: new Date(running.sessionStart).toISOString(),
    endTime: new Date(end).toISOString(),
    duration,
    mode: draft.mode || 'stopwatch',
    createdAt: now,
    updatedAt: now,
  };

  await putLocal('timeSessions', session);
  await addOutbox({ collection: 'timeSessions', docId: id, operation: 'set', updatedAt: now });
  notifyLocal('timeSessions');

  if (draft.taskId) await incrementTaskTime(uid, draft.taskId, duration);
  return duration;
}

/**
 * Quita de la lista una tarea-actividad ya cronometrada
 * (misma regla que aplica el Timer al registrar su sesión).
 */
export async function removeTrackedActivityTask(taskId: string): Promise<void> {
  const now = new Date().toISOString();
  await deleteLocal('tasks', taskId);
  await addOutbox({ collection: 'tasks', docId: taskId, operation: 'delete', updatedAt: now });
  notifyLocal('tasks');
}
