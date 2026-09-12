import { useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFirestoreCollection } from './useFirestoreCollection';
import type { CalendarEvent } from '../types';

export const EVENT_COLORS = ['#4d7cfe', '#7f70ff', '#9d51ff', '#34c77b', '#00b8a9', '#ffa94d', '#ff6b81', '#f26f5b'];

export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function offsetKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function seed(): CalendarEvent[] {
  return [
    { id: 'e1', title: 'Reunión de equipo', date: offsetKey(0), start: '09:00', end: '10:00', color: '#4d7cfe', location: 'Sala virtual' },
    { id: 'e2', title: 'Almuerzo con Laura', date: offsetKey(0), start: '12:30', end: '13:30', color: '#34c77b', location: 'Café Central' },
    { id: 'e3', title: 'Clase de inglés', date: offsetKey(1), start: '18:00', end: '19:30', color: '#ffa94d' },
    { id: 'e4', title: 'Sesión de gimnasio', date: offsetKey(2), start: '07:00', end: '08:00', color: '#ff6b81' },
  ];
}

export function useCalendarEvents() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const coll = useFirestoreCollection<CalendarEvent>(uid, 'calendarEvents');

  // Semilla para usuarios nuevos
  useEffect(() => {
    if (!uid || coll.loading) return;
    if (coll.items.length === 0) {
      seed().forEach((e) => coll.set(e.id, { title: e.title, date: e.date, start: e.start, end: e.end, color: e.color, location: e.location }));
    }
  }, [uid, coll]);

  const addEvent = useCallback((e: Omit<CalendarEvent, 'id'>): string => {
    const id = `ev-${Date.now()}`;
    coll.set(id, { title: e.title, date: e.date, start: e.start, end: e.end, color: e.color, location: e.location, notes: e.notes });
    return id;
  }, [coll]);

  const updateEvent = useCallback((e: CalendarEvent) => {
    coll.update(e.id, { title: e.title, date: e.date, start: e.start, end: e.end, color: e.color, location: e.location, notes: e.notes });
  }, [coll]);

  const deleteEvent = useCallback((id: string) => {
    coll.remove(id);
  }, [coll]);

  return { events: coll.items, addEvent, updateEvent, deleteEvent };
}

/** Semanas del mes: array de fechas YYYY-MM-DD (null = celda vacía). */
export function monthWeeks(y: number, m: number): (string | null)[][] {
  const first = new Date(y, m, 1);
  let lead = first.getDay() - 1;
  if (lead < 0) lead = 6;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(dateKey(new Date(y, m, d)));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function formatEventTime(hhmm: string, timeFormat: '12h' | '24h'): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (timeFormat === '24h') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const suffix = h >= 12 ? 'p.m.' : 'a.m.';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function addMinutes(hhmm: string, mins: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + mins);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
