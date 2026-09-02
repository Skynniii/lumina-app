import { motion, AnimatePresence } from 'framer-motion';
import type { ViewType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeView: ViewType;
  onNavigate: (v: ViewType) => void;
  onOpenSettings: () => void;
}

const SECTIONS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'cronometro',
    label: 'Reloj',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  },
  {
    id: 'habitos',
    label: 'Tasks',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 14l2 2 4-4" /></svg>,
  },
];

export function Sidebar({ isOpen, onClose, activeView, onNavigate, onOpenSettings }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-white z-[201] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="p-5 pt-[60px]">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-[#2b2b2b]">Lumina</h2>
              </div>

              {/* Secciones */}
              <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2 px-1">Secciones</h3>
              <div className="space-y-1 mb-6">
                {SECTIONS.map((s) => {
                  const active = activeView === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onNavigate(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${active ? 'bg-[#f0edff] text-[#7f70ff]' : 'text-[#555] hover:bg-[#f8f9fa]'}`}
                    >
                      {s.icon}
                      <span className="text-[15px] font-medium">{s.label}</span>
                    </button>
                  );
                })}
              </div>

              <hr className="border-[#f0f0f0] mb-5" />

              {/* Configuración */}
              <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2 px-1">Configuración</h3>
              <div className="space-y-1 mb-6">
                <button
                  onClick={onOpenSettings}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#555] hover:bg-[#f8f9fa] transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span className="text-[15px] font-medium">Ajustes</span>
                </button>
              </div>

              <hr className="border-[#f0f0f0] mb-5" />

              {/* Otras opciones */}
              <h3 className="text-xs font-bold text-[#999] uppercase tracking-wider mb-2 px-1">Más</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 rounded-xl text-[15px] text-[#555] hover:bg-[#f8f9fa] transition-colors">Ayuda</button>
                <button className="w-full text-left px-3 py-2.5 rounded-xl text-[15px] text-[#555] hover:bg-[#f8f9fa] transition-colors">Acerca de</button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
