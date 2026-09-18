import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onRename: () => void;
  onDelete: () => void;
  onDeleteCompleted: () => void;
  onAddSeparator: () => void;
  onDeleteSeparators: () => void;
  isProtected?: boolean;
}

export function DesplegableMenu({ onRename, onDelete, onDeleteCompleted, onAddSeparator, onDeleteSeparators, isProtected }: Props) {
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
    <div className="relative w-[28px] flex-none flex justify-center items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-transparent border-none text-[#888] cursor-pointer w-[28px] h-[28px] flex items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
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
            {!isProtected && (
              <button onClick={() => { setOpen(false); onRename(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
                Renombrar lista
              </button>
            )}
            <button onClick={() => { setOpen(false); onAddSeparator(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
              Añadir separador
            </button>
            <button onClick={() => { setOpen(false); onDeleteSeparators(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
              Eliminar separadores
            </button>
            <button onClick={() => { setOpen(false); onDeleteCompleted(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#555] hover:bg-[#f8f9fa] transition-colors">
              Eliminar tareas completadas
            </button>
            {!isProtected && (
              <button onClick={() => { setOpen(false); onDelete(); }} className="bg-transparent border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer text-[#ff4d4d] font-medium hover:bg-[#fff5f5] transition-colors">
                Eliminar lista
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
