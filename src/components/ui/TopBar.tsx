import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface Props {
  title: string;
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

export function TopBar({ title, onMenuClick, onOpenAccount }: Props) {
  const { user } = useAuth();
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

  const photoURL = user?.photoURL || undefined;
  const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Usuario');
  const email = user?.email || '';

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

      <button onClick={() => setProfileOpen(!profileOpen)} className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform overflow-hidden relative bg-gradient-to-br from-[#7f70ff] to-[#9d8aff]">
        {photoURL ? (
          <img src={photoURL} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-12 right-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] py-2 w-[220px] z-[300] origin-top-right overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0]">
              <div className="w-10 h-10 rounded-full flex-none overflow-hidden bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] flex items-center justify-center">
                {photoURL ? (
                  <img src={photoURL} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#333] truncate capitalize">{name}</p>
                {email && <p className="text-xs text-[#999] mt-0.5 truncate">{email}</p>}
              </div>
            </div>
            <button
              onClick={() => { setProfileOpen(false); onOpenAccount(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[#555] hover:bg-[#f8f9fa] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M16 11l2 2 4-4" />
              </svg>
              Mi cuenta
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
