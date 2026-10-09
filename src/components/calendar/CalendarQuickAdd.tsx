import { motion, AnimatePresence } from 'framer-motion';
import { useBackHandler } from '../../hooks/useBackHandler';
import { longDateLabel } from '../../hooks/useCalendarData';

interface Props {
  isOpen: boolean;
  date: string;
  onClose: () => void;
  onNewTask: () => void;
  onNewEvent: () => void;
}

/** Elección rápida al pulsar + desde el calendario: tarea fechada o evento. */
export function CalendarQuickAdd({ isOpen, date, onClose, onNewTask, onNewEvent }: Props) {
  useBackHandler(isOpen, onClose);

  const optionCls = 'flex items-center gap-3 w-full p-3.5 rounded-2xl bg-[#f7f6f9] border-none cursor-pointer text-left active:scale-[0.98] transition-transform';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[2000] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-white rounded-t-[28px] p-5 pb-7 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
          >
            <div className="w-10 h-1.5 rounded-full bg-[#e0e0e0] mx-auto mb-4" />
            <p className="text-left text-[16px] font-bold text-[#2b2b2b] m-0">¿Qué quieres crear?</p>
            <p className="text-left text-[12px] text-[#999] m-0 mt-0.5">{longDateLabel(date)}</p>

            <div className="flex flex-col gap-2.5 mt-4">
              <button onClick={onNewTask} className={optionCls}>
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#f0edff] text-[#7f70ff]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[#333]">Nueva tarea</span>
                  <span className="block text-[12px] text-[#999]">Se guarda en tus listas y aparece también en Tasks</span>
                </span>
              </button>

              <button onClick={onNewEvent} className={optionCls}>
                <span className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#eef4ff] text-[#4d7cfe]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="12" y1="14" x2="12" y2="18" /><line x1="10" y1="16" x2="14" y2="16" />
                  </svg>
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-[#333]">Nuevo evento</span>
                  <span className="block text-[12px] text-[#999]">Con hora, duración, lugar y notas</span>
                </span>
              </button>
            </div>

            <button onClick={onClose} className="w-full mt-3 border-none py-3 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors">Cancelar</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
