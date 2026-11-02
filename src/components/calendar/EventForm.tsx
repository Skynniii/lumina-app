import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVENT_COLORS, MONTHS, addMinutes, dateKey, timeToMinutes } from '../../hooks/useCalendarEvents';
import { DatePickerModal } from '../tareas/DatePickerModal';
import { TimePickerModal } from '../tareas/TimePickerModal';
import type { CalendarEvent } from '../../types';
import { useBackHandler } from '../../hooks/useBackHandler';

type TimeField = 'start' | 'end';

const inputCls = 'w-full border border-[#e4e4ed] rounded-xl py-3 px-3.5 text-[15px] text-[#333] bg-[#fafafc] placeholder:text-[#bbb] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors';

const CalendarGlyph = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockGlyph = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

interface BodyProps {
  initialDate?: string;
  initialEvent?: CalendarEvent;
  submitLabel: string;
  onCancel: () => void;
  onSave: (e: Omit<CalendarEvent, 'id'>) => void;
}

/**
 * Campos del formulario de evento con el estilo nativo de la app (mismo lenguaje
 * que "Nueva tarea"): se usa tanto en el modal de edición como dentro del modal
 * de creación del calendario.
 */
export function EventFormBody({ initialDate, initialEvent, submitLabel, onCancel, onSave }: BodyProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [date, setDate] = useState(initialEvent?.date ?? initialDate ?? dateKey());
  const [start, setStart] = useState(initialEvent?.start ?? '09:00');
  const [end, setEnd] = useState(initialEvent?.end ?? '10:00');
  const [color, setColor] = useState(initialEvent?.color ?? EVENT_COLORS[0]);
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [notes, setNotes] = useState(initialEvent?.notes ?? '');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerState, setTimePickerState] = useState<{ field: TimeField; hour: number; minute: number } | null>(null);

  const submit = () => {
    if (!title.trim()) return;
    let safeEnd = end;
    if (timeToMinutes(end) <= timeToMinutes(start)) safeEnd = addMinutes(start, 60);
    onSave({
      title: title.trim(),
      date,
      start,
      end: safeEnd,
      color,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const openTimePicker = (field: TimeField) => {
    const [h, m] = (field === 'start' ? start : end).split(':').map(Number);
    setTimePickerState({ field, hour: h, minute: m });
  };

  const prettyDate = (() => {
    if (!date) return 'Seleccionar fecha';
    const [y, m, d] = date.split('-').map(Number);
    return `${d} ${MONTHS[m - 1].toLowerCase()} ${y}`;
  })();

  return (
    <>
      <p className="text-left text-[16px] font-bold text-[#2b2b2b] m-0 mb-3">
        {initialEvent ? 'Editar evento' : 'Nuevo evento'}
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="¿Qué evento quieres añadir?"
          autoFocus
          className={inputCls}
        />

        {/* Fecha */}
        <button
          type="button"
          onClick={() => setDatePickerOpen(true)}
          className={`${inputCls} flex items-center gap-2.5 text-left cursor-pointer`}
        >
          <CalendarGlyph />
          <span className="text-[15px] text-[#333] truncate">{prettyDate}</span>
        </button>

        {/* Hora de inicio y fin */}
        <div className="flex gap-3">
          {(['start', 'end'] as TimeField[]).map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => openTimePicker(field)}
              className={`${inputCls} flex-1 flex items-center gap-2 text-left cursor-pointer`}
            >
              <ClockGlyph />
              <span className="text-[15px] text-[#333] tabular-nums">{field === 'start' ? start : end}</span>
              <span className="text-[11px] text-[#aaa]">{field === 'start' ? 'Inicio' : 'Fin'}</span>
            </button>
          ))}
        </div>

        {/* Color */}
        <div className="flex flex-wrap items-center gap-2.5 px-0.5 py-1">
          <span className="text-[13px] text-[#999] mr-1">Color</span>
          {EVENT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className="w-7 h-7 rounded-full border-none cursor-pointer flex items-center justify-center transition-transform"
              style={{ background: c, transform: color === c ? 'scale(1.15)' : undefined, boxShadow: color === c ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}` : undefined }}
            >
              {color === c && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ubicación (opcional)"
          className={inputCls}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          className={`${inputCls} resize-none`}
        />

        <div className="flex gap-3 mt-1">
          <button onClick={onCancel} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors">Cancelar</button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitLabel}
          </button>
        </div>
      </div>

      {datePickerOpen && (
        <DatePickerModal
          initialDate={date}
          onClose={() => setDatePickerOpen(false)}
          onSave={(d) => setDate(d)}
        />
      )}

      {timePickerState && (
        <TimePickerModal
          initialHour={timePickerState.hour}
          initialMinute={timePickerState.minute}
          onClose={() => setTimePickerState(null)}
          onSave={(hh, mm) => {
            const value = `${hh}:${mm}`;
            if (timePickerState.field === 'start') setStart(value);
            else setEnd(value);
            setTimePickerState(null);
          }}
          onClear={() => {}}
        />
      )}
    </>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (e: Omit<CalendarEvent, 'id'>) => void;
  initialDate?: string;
  initialEvent?: CalendarEvent;
}

/** Modal de evento (crear o editar) como hoja inferior, con el estilo de la app. */
export function EventForm({ isOpen, onClose, onSave, initialDate, initialEvent }: Props) {
  useBackHandler(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[2000] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-white rounded-t-[28px] px-5 pt-3 pb-6 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />
            <EventFormBody
              key={initialEvent?.id ?? 'new'}
              initialDate={initialDate}
              initialEvent={initialEvent}
              submitLabel={initialEvent ? 'Guardar cambios' : 'Crear evento'}
              onCancel={onClose}
              onSave={(e) => { onSave(e); onClose(); }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
