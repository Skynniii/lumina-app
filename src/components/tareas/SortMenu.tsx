import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SortMode } from '../../types';

interface Props {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  options?: { value: SortMode; label: string }[];
}

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'custom', label: 'Personalizado' },
  { value: 'date', label: 'Por fecha' },
  { value: 'deadline', label: 'Por fecha límite' },
  { value: 'recent', label: 'Agregadas recientemente' },
];

export function SortMenu({ value, onChange, options = OPTIONS }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className="relative w-[36px] flex-none flex justify-center items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        title={`Ordenar: ${current.label}`}
        className="bg-transparent border-none text-[#999] cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 14 18 17 21 14" />
          <line x1="18" y1="7" x2="18" y2="17" />
          <polyline points="9 10 6 7 3 10" />
          <line x1="6" y1="17" x2="6" y2="7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[40px] left-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-lg py-1.5 flex flex-col z-[100] border border-[#eaeaea] min-w-[200px] origin-top-left"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer flex items-center justify-between gap-2 transition-colors hover:bg-[#f8f9fa]"
                style={{ color: opt.value === value ? '#7f70ff' : '#555', fontWeight: opt.value === value ? 600 : 400 }}
              >
                <span>{opt.label}</span>
                {opt.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
