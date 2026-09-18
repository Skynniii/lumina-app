import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACTIVITY_COLORS } from '../../hooks/useTimeTracker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export function NewActivityModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(ACTIVITY_COLORS[0]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor(ACTIVITY_COLORS[0]);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), color);
    onClose();
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
            className="w-full max-w-[420px] bg-white rounded-t-[28px] p-5 pb-7 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
          >
            <div className="w-10 h-1.5 rounded-full bg-[#e0e0e0] mx-auto mb-4" />
            <p className="text-[16px] font-bold text-[#333] m-0 mb-4">Nueva actividad</p>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Nombre de la actividad"
                autoFocus
                className="w-full bg-[#f7f6f9] rounded-xl border-none py-2.5 px-3.5 text-[15px] text-[#333] placeholder:text-[#aaa] outline-none shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]"
              />
              <div className="flex flex-wrap gap-2.5">
                {ACTIVITY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-none cursor-pointer flex items-center justify-center transition-transform"
                    style={{
                      background: c,
                      transform: color === c ? 'scale(1.15)' : undefined,
                      boxShadow: color === c ? `0 0 0 2.5px #fff, 0 0 0 4.5px ${c}` : undefined,
                    }}
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
                  onClick={onClose}
                  className="flex-1 border-none py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-[#f0f0f0] text-[#666] hover:bg-[#e4e4e4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim()}
                  className="flex-1 border-none py-2.5 rounded-xl text-sm font-semibold cursor-pointer bg-[#7f70ff] text-white shadow-[2px_4px_10px_rgba(127,112,255,0.3)] hover:bg-[#6c5dd4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Crear
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
