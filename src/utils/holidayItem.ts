import type { CalendarItem } from '../hooks/useCalendarData';
import { holidayName } from './holidays';

/** Amarillo de los festivos (el mismo del texto "Festivo" del calendario). */
export const HOLIDAY_COLOR = '#c99a06';

/**
 * Festivo como ítem de calendario: se pinta como un evento de todo el día para
 * que las vistas de día y agenda lo muestren junto a tareas, eventos y
 * cumpleaños. No viene de ninguna colección: se calcula desde `holidays.ts`.
 */
export function holidayItem(key: string): CalendarItem | null {
  const name = holidayName(key);
  if (!name) return null;
  return {
    id: `hol-${key}`,
    kind: 'event',
    date: key,
    title: name,
    subtitle: 'Festivo',
    color: HOLIDAY_COLOR,
    holiday: true,
    order: -2,
  };
}
