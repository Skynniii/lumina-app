import type { TaskList } from '../types';

/**
 * Orden de listas que usa la sección de Tasks: "Principal" siempre primero
 * y el resto según su posición. Se comparte para que los modales que listan
 * tareas muestren las listas en el mismo orden que la sección.
 */
export function sortListsForDisplay(lists: TaskList[]): TaskList[] {
  return [...lists].sort((a, b) => {
    if (a.id === 'principal') return -1;
    if (b.id === 'principal') return 1;
    return (a.position ?? 0) - (b.position ?? 0);
  });
}
