import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { MONTHS, formatEventTime } from '../../hooks/useCalendarEvents';
import type { CalendarEvent } from '../../types';

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function IconRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-1 py-2.5">
      <span className="w-7 shrink-0 flex justify-center mt-0.5 text-[#999]">{icon}</span>
      <span className="text-[14px] text-[#444] leading-relaxed">{children}</span>
    </div>
  );
}

export function EventDetail({ event, onClose, onEdit, onDelete }: Props) {
  const { settings } = useSettings();
  const [y, m, d] = (event?.date ?? '2000-01-01').split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

  return (
    <AnimatePresence>
      {event && (
          <div className="fixed inset-0 bg-black/40 z-[2000] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[420px] bg-white rounded-t-[28px] p-5 pb-7 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="w-10 h-1.5 rounded-full bg-[#e0e0e0] mx-auto mb-4" />

              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-12 rounded-full shrink-0" style={{ background: event.color }} />
                <p className="text-[19px] font-bold text-[#333] m-0 flex-1">{event.title}</p>
              </div>

              <div className="flex flex-col divide-y divide-[#f2f2f2]">
                <IconRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}>
                  <span className="capitalize">{weekday.toLowerCase()}, {d} de {MONTHS[m - 1].toLowerCase()} {y}</span>
                </IconRow>
                <IconRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}>
                  {formatEventTime(event.start, settings.timeFormat)} – {formatEventTime(event.end, settings.timeFormat)}
                </IconRow>
                {event.location && (
                  <IconRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}>
                    {event.location}
                  </IconRow>
                )}
                {event.notes && (
                  <IconRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}>
                    {event.notes}
                  </IconRow>
                )}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => onEdit(event)}
                  className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0edff] text-[#7f70ff] hover:bg-[#e4dfff] transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(event.id)}
                  className="flex-1 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#fff5f5] text-[#ff4d4d] hover:bg-[#ffe8e8] transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
    </AnimatePresence>
  );
}
