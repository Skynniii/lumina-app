import type { CalendarItem } from '../hooks/useCalendarData';

/**
 * Orden de las familias dentro de un mismo día en las vistas de día, agenda y
 * cabecera de la semana: festivos, cumpleaños, tareas, eventos, registros y al
 * final las tareas completadas.
 */
export function familyRank(item: CalendarItem): number {
  if (item.holiday) return 0;
  if (item.birthday) return 1;
  if (item.kind === 'pending') return 2;
  if (item.kind === 'event') return 3;
  if (item.kind === 'session') return 4;
  return 5;
}

/** Copia ordenada por familia; dentro de cada familia conserva el orden recibido. */
export function sortByFamily(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => familyRank(a) - familyRank(b));
}
