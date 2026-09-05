import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onRename: () => void;
  onDelete: () => void;
  onDeleteCompleted: () => void;
}

export function DesplegableMenu({ onRename, onDelete, onDeleteCompleted }: Props) {
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

  return (
    <div className="relative w-[36px] flex-none flex justify-center items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-transparent border-none text-[26px] pb-1 text-[#888] cursor-pointer w-[36px] h-[36px] flex items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
      >
        ⋮
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[40px] right-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] rounded-lg py-1.5 flex flex-col z-[100] border border-[#eaeaea] min-w-[140px] origin-top-right"
          >
            <button onClick={() => { setOpen(false); onRename(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
              Renombrar lista
            </button>
            <button onClick={() => { setOpen(false); onDeleteCompleted(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
              Eliminar tareas completadas
            </button>
            <button onClick={() => { setOpen(false); onDelete(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#ff4d4d] font-medium hover:bg-[#fff5f5] transition-colors">
              Eliminar lista
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
