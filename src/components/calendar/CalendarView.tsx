import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCalendarEvents, dateKey } from '../../hooks/useCalendarEvents';
import { TopBar } from '../ui/TopBar';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { MonthGrid } from './MonthGrid';
import { DayAgenda } from './DayAgenda';
import { EventForm } from './EventForm';
import { EventDetail } from './EventDetail';
import type { CalendarEvent } from '../../types';

interface Props {
  onMenuClick: () => void;
}

export function CalendarView({ onMenuClick }: Props) {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [anchorMonth, setAnchorMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; event?: CalendarEvent } | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(null);

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
    <section className="absolute top-0 left-0 w-full h-full p-5 pb-[110px] overflow-y-auto no-scrollbar">
      <TopBar title="Calendar" onMenuClick={onMenuClick} />

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

      {/* Botón flotante para crear eventos */}
      <motion.button
        onClick={() => setForm({ mode: 'create' })}
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        aria-label="Nuevo evento"
        className="fixed bottom-[95px] right-5 w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_6px_16px_rgba(127,112,255,0.4)] z-[90]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

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
