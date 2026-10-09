import type { Task } from '../types';

export interface PendingTimerTask {
  task: Task;
  /** ID del avance (referencia) que lanzó el Timer, para marcarlo al completar. */
  avanceTaskId: string | null;
}

let pendingTask: PendingTimerTask | null = null;

export function setPendingTimerTask(task: Task, avanceTaskId?: string) {
  pendingTask = { task, avanceTaskId: avanceTaskId ?? null };
}

export function getPendingTimerTask(): PendingTimerTask | null {
  return pendingTask;
}

export function clearPendingTimerTask() {
  pendingTask = null;
}
