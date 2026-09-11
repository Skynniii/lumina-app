import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: number, minutes: number) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function WheelPicker({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const items = [];
  for (let i = min; i <= max; i++) items.push(i);

  useEffect(() => {
    if (ref.current && !isScrollingRef.current) {
      ref.current.scrollTop = (value - min) * ITEM_HEIGHT;
    }
  }, [value, min]);

  const handleScroll = () => {
    isScrollingRef.current = true;
    if (ref.current) {
      const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(min, Math.min(max, min + idx));
      if (clamped !== value) onChange(clamped);
    }
    window.clearTimeout((handleScroll as any)._t);
    (handleScroll as any)._t = window.setTimeout(() => { isScrollingRef.current = false; }, 80);
  };

  return (
    <div className="relative overflow-hidden bg-[#f7f6f9] rounded-2xl shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]" style={{ height: CONTAINER_HEIGHT, width: 80 }}>
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 border-y border-[#e0deea] pointer-events-none z-10" style={{ height: ITEM_HEIGHT }} />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory touch-pan-y"
        style={{ paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT, WebkitOverflowScrolling: 'touch' }}
      >
        {items.map((n) => (
          <div key={n} className="snap-center flex items-center justify-center" style={{ height: ITEM_HEIGHT }}>
            <span className={`text-[24px] font-bold tabular-nums leading-none transition-colors ${n === value ? 'text-[#333]' : 'text-[#ccc]'}`}>{String(n).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomDurationModal({ isOpen, onClose, onSave }: Props) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);

  useEffect(() => {
    if (isOpen) { setHours(0); setMinutes(25); }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[10001] backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white rounded-3xl z-[10002] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.15)] mx-5"
              style={{ width: 'min(340px, 90vw)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-2 flex items-center justify-between shrink-0">
                <span className="text-[16px] font-bold text-[#333]">Duración personalizada</span>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f6f9] border-none cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 py-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#999]">Horas</span>
                  <WheelPicker value={hours} min={0} max={23} onChange={setHours} />
                </div>
                <span className="text-[28px] font-bold text-[#ccc] mt-5">:</span>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#999]">Minutos</span>
                  <WheelPicker value={minutes} min={0} max={59} onChange={setMinutes} />
                </div>
              </div>

              <div className="px-5 pb-5 pt-1">
                <button
                  onClick={() => { onSave(hours, minutes); onClose(); }}
                  disabled={hours === 0 && minutes === 0}
                  className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white bg-[#7f70ff] border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(127,112,255,0.25)]"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
