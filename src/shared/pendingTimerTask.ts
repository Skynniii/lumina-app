import type { Task } from '../types';

let pendingTask: Task | null = null;

export function setPendingTimerTask(task: Task) {
  pendingTask = task;
}

export function getPendingTimerTask(): Task | null {
  return pendingTask;
}

export function clearPendingTimerTask() {
  pendingTask = null;
}
