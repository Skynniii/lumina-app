import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACTIVITY_COLORS } from '../../hooks/useTimeTracker';
import type { Activity } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, color: string) => void;
}

export function ActivityPicker({ isOpen, onClose, activities, selectedId, onSelect, onCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(ACTIVITY_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setCreating(false);
      setName('');
      setColor(ACTIVITY_COLORS[0]);
    }
  }, [isOpen]);

  const submitNew = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), color);
  };

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
            <p className="text-[16px] font-bold text-[#333] m-0 mb-4">Actividad</p>

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

              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-3 px-2 py-3 border-none bg-transparent cursor-pointer rounded-xl hover:bg-[#f8f7fb] transition-colors text-left"
                >
                  <span className="w-7 h-7 rounded-full bg-[#f0edff] flex items-center justify-center shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  <span className="text-[15px] text-[#7f70ff] font-semibold">Nueva actividad</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3 bg-[#f7f6f9] rounded-2xl p-4 shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitNew()}
                    placeholder="Nombre de la actividad"
                    autoFocus
                    className="w-full bg-white rounded-xl border-none py-2.5 px-3.5 text-[15px] text-[#333] placeholder:text-[#aaa] outline-none shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
                  />
                  <div className="flex flex-wrap gap-2.5">
                    {ACTIVITY_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center transition-transform"
                        style={{ background: c, transform: color === c ? 'scale(1.15)' : undefined, boxShadow: color === c ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}` : undefined }}
                      >
                        {color === c && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCreating(false)}
                      className="flex-1 border-none py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitNew}
                      disabled={!name.trim()}
                      className="flex-1 border-none py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      Crear
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
