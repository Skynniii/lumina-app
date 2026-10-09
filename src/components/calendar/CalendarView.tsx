import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCalendarEvents, dateKey } from '../../hooks/useCalendarEvents';
import { SectionHeader } from '../ui/SectionHeader';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { MonthGrid } from './MonthGrid';
import { DayAgenda } from './DayAgenda';
import { EventForm } from './EventForm';
import { EventDetail } from './EventDetail';
import type { CalendarEvent } from '../../types';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

export function CalendarView({ onMenuClick, onOpenAccount }: Props) {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [anchorMonth, setAnchorMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; event?: CalendarEvent } | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(null);

  // Escuchar botón + de la barra de navegación
  useEffect(() => {
    const handler = () => setForm({ mode: 'create' });
    window.addEventListener('app-add', handler);
    return () => window.removeEventListener('app-add', handler);
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  const selectedEvents = useMemo(
    () => (eventsByDate.get(selectedDate) ?? []).sort((a, b) => a.start.localeCompare(b.start)),
    [eventsByDate, selectedDate]
  );

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col bg-[#f7f6f9]">
      <SectionHeader title="Calendar" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} background="#f7f6f9" className="z-50" />

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
        <div className="mt-3 flex flex-col gap-5">
          <MonthGrid
            anchorMonth={anchorMonth}
            onMonthChange={setAnchorMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            eventsByDate={eventsByDate}
          />

          <DayAgenda date={selectedDate} events={selectedEvents} onSelectEvent={setDetail} />
        </div>
      </div>

      <EventForm
        isOpen={form !== null}
        onClose={() => setForm(null)}
        initialDate={selectedDate}
        initialEvent={form?.mode === 'edit' ? form.event : undefined}
        onSave={(e) => {
          if (form?.mode === 'edit' && form.event) updateEvent({ ...e, id: form.event.id });
          else addEvent(e);
        }}
      />

      <EventDetail
        event={detail}
        onClose={() => setDetail(null)}
        onEdit={(e) => {
          setDetail(null);
          setForm({ mode: 'edit', event: e });
        }}
        onDelete={(id) => {
          const ev = events.find((e) => e.id === id) ?? null;
          setDetail(null);
          setPendingDelete(ev);
        }}
      />

      <ModalNeuromorfico
        isOpen={pendingDelete !== null}
        type="confirm"
        title="¿Eliminar este evento?"
        onConfirm={() => {
          if (pendingDelete) deleteEvent(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
