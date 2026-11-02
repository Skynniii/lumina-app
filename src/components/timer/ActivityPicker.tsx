import { motion, AnimatePresence } from 'framer-motion';
import type { Activity } from '../../types';
import { useBackHandler } from '../../hooks/useBackHandler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * Selector de actividad unificado: se usa en todas las pantallas donde se
 * asigna una actividad (registros de tiempo, focus, tareas y nueva tarea).
 * Solo permite elegir una actividad existente; la creación se hace desde la
 * sección de Actividades.
 */
export function ActivityPicker({ isOpen, onClose, activities, selectedId, onSelect }: Props) {
  useBackHandler(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-end justify-center backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] bg-white rounded-t-[28px] p-5 pb-7 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] max-h-[75vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-10 h-1.5 rounded-full bg-[#e0e0e0] mx-auto mb-4" />
            <p className="text-[16px] font-bold text-[#333] m-0 mb-4">Actividades</p>

            <div className="flex flex-col">
              {activities.map((a) => {
                const selected = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className="flex items-center gap-3 px-2 py-3 border-none bg-transparent cursor-pointer rounded-xl hover:bg-[#f8f7fb] transition-colors text-left"
                  >
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="text-[15px] text-[#333] font-medium flex-1">{a.name}</span>
                    {selected && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
