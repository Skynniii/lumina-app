import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackHandler } from '../../hooks/useBackHandler';
import { longDateLabel } from '../../hooks/useCalendarData';
import { EventFormBody } from './EventForm';
import { BirthdayFormBody, BIRTHDAY_COLOR } from './BirthdayForm';
import type { CalendarEvent } from '../../types';

interface Props {
  isOpen: boolean;
  date: string;
  onClose: () => void;
  onNewTask: () => void;
  onCreateEvent: (e: Omit<CalendarEvent, 'id'>) => void;
}

type Step = 'choice' | 'event' | 'birthday';

const TaskGlyph = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const EventGlyph = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const CakeGlyph = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /><path d="M4 16h16" /><path d="M12 8V5" /><circle cx="12" cy="4" r="1" />
  </svg>
);

/** Fila compacta del selector: solo el icono y su nombre. */
function OptionRow({ tint, label, onClick, children }: { tint: string; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl bg-[#f7f6f9] border-none cursor-pointer text-left active:scale-[0.98] transition-transform"
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tint}1a`, color: tint }}>
        {children}
      </span>
      <span className="text-[15px] font-semibold text-[#333]">{label}</span>
    </button>
  );
}

/**
 * Modal compacto del botón + del calendario: tres opciones (tarea, evento y
 * cumpleaños) con solo su icono y su nombre. Al tocar evento o cumpleaños el
 * mismo modal se transforma en el formulario correspondiente.
 */
export function CalendarQuickAdd({ isOpen, date, onClose, onNewTask, onCreateEvent }: Props) {
  const [step, setStep] = useState<Step>('choice');
  // Al cerrar se vuelve al selector para que el modal reaparezca limpio
  const close = () => { setStep('choice'); onClose(); };

  useBackHandler(isOpen, close);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[2000] flex items-end justify-center backdrop-blur-sm" onClick={close}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-white rounded-t-[28px] px-5 pt-3 pb-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-10 h-1.5 bg-[#e4e4ed] rounded-full mx-auto mb-3" />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: step === 'choice' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === 'choice' ? 10 : -10 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {step === 'choice' ? (
                  <>
                    <p className="text-left text-[16px] font-bold text-[#2b2b2b] m-0">Crear</p>
                    <p className="text-left text-[12px] text-[#999] m-0 mt-0.5">{longDateLabel(date)}</p>

                    <div className="flex flex-col gap-2 mt-3">
                      <OptionRow tint="#7f70ff" label="Tarea" onClick={onNewTask}><TaskGlyph /></OptionRow>
                      <OptionRow tint="#4d7cfe" label="Evento" onClick={() => setStep('event')}><EventGlyph /></OptionRow>
                      <OptionRow tint={BIRTHDAY_COLOR} label="Cumpleaños" onClick={() => setStep('birthday')}><CakeGlyph /></OptionRow>
                    </div>
                  </>
                ) : step === 'event' ? (
                  <EventFormBody
                    initialDate={date}
                    submitLabel="Crear evento"
                    onCancel={() => setStep('choice')}
                    onSave={(e) => { onCreateEvent(e); close(); }}
                  />
                ) : (
                  <BirthdayFormBody
                    initialDate={date}
                    onCancel={() => setStep('choice')}
                    onSave={(e) => { onCreateEvent(e); close(); }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
