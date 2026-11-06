/** Día en que empieza la semana del calendario. */
export type WeekStart = 'monday' | 'sunday';

/** Índice de `Date.getDay()` del primer día de la semana (0 = domingo, 1 = lunes). */
export function weekStartIndex(weekStart: WeekStart): 0 | 1 {
  return weekStart === 'sunday' ? 0 : 1;
}

const SHORT_WEEKDAYS: Record<'es' | 'en', string[]> = {
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

/** Nombre del día (tres letras) en el idioma de la app. */
export function weekdayShort(language: 'es' | 'en', dayIndex: number): string {
  return (SHORT_WEEKDAYS[language] ?? SHORT_WEEKDAYS.es)[dayIndex] ?? '';
}

/** Cabeceras de la semana (tres letras) en el orden en que empieza la semana. */
export function weekdayHeaders(language: 'es' | 'en', weekStart: WeekStart): { day: number; label: string }[] {
  const start = weekStartIndex(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const day = (start + i) % 7;
    return { day, label: weekdayShort(language, day) };
  });
}

/** Número de semana ISO 8601 de una fecha. */
export function weekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
