import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MONTHS, dateKey } from '../../hooks/useCalendarEvents';
import { DatePickerModal } from '../tareas/DatePickerModal';
import { useBackHandler } from '../../hooks/useBackHandler';
import type { CalendarEvent } from '../../types';

/** Color fijo de los cumpleaños en el calendario. */
export const BIRTHDAY_COLOR = '#ff6b81';

const inputCls = 'w-full border border-[#e4e4ed] rounded-xl py-3 px-3.5 text-[15px] text-[#333] bg-[#fafafc] placeholder:text-[#bbb] outline-none focus:border-[#7f70ff] focus:bg-white transition-colors';

interface BodyProps {
  initialDate?: string;
  initialEvent?: CalendarEvent;
  onCancel: () => void;
  onSave: (e: Omit<CalendarEvent, 'id'>) => void;
}

/**
 * Formulario mínimo de cumpleaños: nombre + fecha. Se usa tanto para crearlo
 * desde el botón + como para editarlo desde su detalle, así que editar un
 * cumpleaños nunca abre el formulario de evento.
 */
export function BirthdayFormBody({ initialDate, initialEvent, onCancel, onSave }: BodyProps) {
  const [name, setName] = useState(initialEvent?.title ?? '');
  const [date, setDate] = useState(initialEvent?.date ?? initialDate ?? dateKey());
  const [pickerOpen, setPickerOpen] = useState(false);
  const editing = !!initialEvent;

  const prettyDate = (() => {
    const [y, m, d] = date.split('-').map(Number);
    return `${d} ${MONTHS[m - 1].toLowerCase()} ${y}`;
  })();

  const submit = () => {
    if (!name.trim()) return;
    onSave({
      title: name.trim(),
      date,
      start: initialEvent?.start ?? '00:00',
      end: initialEvent?.end ?? '23:59',
      color: initialEvent?.color ?? BIRTHDAY_COLOR,
      location: initialEvent?.location,
      notes: initialEvent?.notes,
      birthday: true,
    });
  };

  return (
    <>
      <p className="text-left text-[16px] font-bold text-[#2b2b2b] m-0 mb-3">
        {editing ? 'Editar cumpleaños' : 'Nuevo cumpleaños'}
      </p>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="¿Quién cumple años?"
          autoFocus
          className={inputCls}
        />

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`${inputCls} flex items-center gap-2.5 text-left cursor-pointer`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[15px] text-[#333] truncate">{prettyDate}</span>
        </button>

        <div className="flex gap-3 mt-1">
          <button onClick={onCancel} className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors">
            {editing ? 'Cancelar' : 'Volver'}
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Guardar
          </button>
        </div>
      </div>

      {pickerOpen && (
        <DatePickerModal
          initialDate={date}
          onClose={() => setPickerOpen(false)}
          onSave={(d) => setDate(d)}
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

/** Modal de cumpleaños (crear o editar) como hoja inferior, con el estilo de la app. */
export function BirthdayForm({ isOpen, onClose, onSave, initialDate, initialEvent }: Props) {
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
            <BirthdayFormBody
              key={initialEvent?.id ?? 'new'}
              initialDate={initialDate}
              initialEvent={initialEvent}
              onCancel={onClose}
              onSave={(e) => { onSave(e); onClose(); }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
