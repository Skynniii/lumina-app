import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  title: string;
  onMenuClick: () => void;
}

export function TopBar({ title, onMenuClick }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [profileOpen]);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 relative" ref={ref}>
      <button onClick={onMenuClick} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className="text-[#2b2b2b] font-bold text-2xl m-0">{title}</h1>

      <button onClick={() => setProfileOpen(!profileOpen)} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] flex items-center justify-center shadow-sm active:scale-90 transition-transform overflow-hidden relative">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] py-2 w-[200px] z-[300] origin-top-right"
          >
            <div className="px-4 py-3 border-b border-[#f0f0f0]">
              <p className="text-sm font-semibold text-[#333]">Usuario</p>
              <p className="text-xs text-[#999] mt-0.5">usuario@ejemplo.com</p>
            </div>
            <button className="w-full px-4 py-2.5 text-left text-sm text-[#555] hover:bg-[#f8f9fa] transition-colors">Mi cuenta</button>
            <button className="w-full px-4 py-2.5 text-left text-sm text-[#555] hover:bg-[#f8f9fa] transition-colors">Preferencias</button>
            <hr className="border-[#f0f0f0] my-1" />
            <button className="w-full px-4 py-2.5 text-left text-sm text-[#ff4d4d] hover:bg-[#fff5f5] transition-colors">Cerrar sesión</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
