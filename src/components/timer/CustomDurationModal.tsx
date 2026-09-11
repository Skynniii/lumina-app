import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hours: number, minutes: number) => void;
}

export function CustomDurationModal({ isOpen, onClose, onSave }: Props) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(25);

  useEffect(() => {
    if (isOpen) { setHours(0); setMinutes(25); }
  }, [isOpen]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const Stepper = ({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) => (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[12px] font-bold uppercase tracking-wide text-[#999]">{label}</span>
      <button onClick={() => onChange(clamp(value + 1, min, max))} className="w-11 h-11 flex items-center justify-center rounded-full bg-[#f0edff] text-[#7f70ff] border-none cursor-pointer active:scale-90 transition-transform">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>
      <div className="relative overflow-hidden h-[80px] w-20 flex items-center justify-center bg-[#f7f6f9] rounded-2xl shadow-[inset_2px_2px_5px_#e6e6e6,inset_-2px_-2px_5px_#ffffff]">
        <span className="text-[36px] font-bold text-[#333] tabular-nums leading-none">{String(value).padStart(2, '0')}</span>
      </div>
      <button onClick={() => onChange(clamp(value - 1, min, max))} className="w-11 h-11 flex items-center justify-center rounded-full bg-[#f0edff] text-[#7f70ff] border-none cursor-pointer active:scale-90 transition-transform">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[10001] backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[10002] flex flex-col shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#e0e0e0] rounded-full mx-auto mt-3 shrink-0" />
            <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
              <span className="text-[16px] font-bold text-[#333]">Duración personalizada</span>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f7f6f9] border-none cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex items-center justify-center gap-10 py-6">
              <Stepper label="Horas" value={hours} onChange={setHours} min={0} max={23} />
              <span className="text-[32px] font-bold text-[#ccc] mt-5">:</span>
              <Stepper label="Minutos" value={minutes} onChange={setMinutes} min={0} max={59} />
            </div>

            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => { onSave(hours, minutes); onClose(); }}
                disabled={hours === 0 && minutes === 0}
                className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white bg-[#7f70ff] border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(127,112,255,0.25)]"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
