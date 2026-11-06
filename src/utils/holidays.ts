/**
 * Días festivos (Colombia). Los fijos se declaran tal cual; los "trasladables"
 * y los que dependen de la Pascua se calculan con la Ley Emiliani. Se cachean
 * por año porque la rejilla del mes los consulta día a día.
 *
 * Cuando los festivos vengan de otra fuente (ajustes o una API), basta con
 * reemplazar `holidaysOfYear` manteniendo el mismo mapa `YYYY-MM-DD → nombre`.
 */
/** Amarillo de los festivos: lo usan las vistas del calendario y sus ítems. */
export const HOLIDAY_COLOR = '#b8860b';

const cache = new Map<number, Map<string, string>>();

const pad = (n: number) => String(n).padStart(2, '0');

const keyOf = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

/** Domingo de Pascua (algoritmo gregoriano anónimo). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Siguiente lunes (si ya es lunes, el mismo día). */
function nextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  if (day !== 1) d.setDate(d.getDate() + ((8 - day) % 7));
  return d;
}

const shift = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Festivos del año: `YYYY-MM-DD` → nombre. */
export function holidaysOfYear(year: number): Map<string, string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const map = new Map<string, string>();
  const add = (date: Date, name: string) => map.set(keyOf(date.getFullYear(), date.getMonth(), date.getDate()), name);

  // Fijos
  add(new Date(year, 0, 1), 'Año Nuevo');
  add(new Date(year, 4, 1), 'Día del Trabajo');
  add(new Date(year, 6, 20), 'Independencia');
  add(new Date(year, 7, 7), 'Batalla de Boyacá');
  add(new Date(year, 11, 25), 'Navidad');

  // Trasladados al lunes (Ley Emiliani)
  add(nextMonday(new Date(year, 0, 6)), 'Día de los Reyes Magos');
  add(nextMonday(new Date(year, 2, 19)), 'Día de San José');
  add(nextMonday(new Date(year, 5, 29)), 'San Pedro y San Pablo');
  add(nextMonday(new Date(year, 7, 15)), 'Asunción de la Virgen');
  add(nextMonday(new Date(year, 9, 12)), 'Día de la Raza');
  add(nextMonday(new Date(year, 10, 1)), 'Todos los Santos');
  add(nextMonday(new Date(year, 10, 11)), 'Independencia de Cartagena');

  // Semana Santa y las fiestas que dependen de la Pascua
  const easterDay = easter(year);
  add(shift(easterDay, -3), 'Jueves Santo');
  add(shift(easterDay, -2), 'Viernes Santo');
  add(shift(easterDay, 43), 'Ascensión del Señor');
  add(shift(easterDay, 64), 'Corpus Christi');
  add(shift(easterDay, 71), 'Sagrado Corazón');

  cache.set(year, map);
  return map;
}

/** Nombre del festivo de esa fecha (`YYYY-MM-DD`) o `null`. */
export function holidayName(key: string): string | null {
  const year = Number(key.slice(0, 4));
  if (!year) return null;
  return holidaysOfYear(year).get(key) ?? null;
}
