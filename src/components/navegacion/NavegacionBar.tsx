import { motion } from 'framer-motion';
import type { ViewType } from '../../types';

interface Props {
  activeView: ViewType;
  onViewChange: (v: ViewType) => void;
  onAdd: () => void;
}

const ICONS: Record<ViewType, React.ReactNode> = {
  tracker: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  ),
  cronometro: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M9 2h6" />
      <path d="M12 5V2" />
    </svg>
  ),
  habitos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 9-1z" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

const TABS: ViewType[] = ['tracker', 'cronometro', 'habitos', 'calendar'];

export function NavegacionBar({ activeView, onViewChange, onAdd }: Props) {
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  const renderTab = (id: ViewType) => {
    const active = activeView === id;
    return (
      <button
        key={id}
        onClick={() => onViewChange(id)}
        className="relative flex items-center justify-center w-14 h-14 rounded-2xl transition-colors duration-200"
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            className="absolute inset-0 bg-[#f0edff] rounded-2xl -z-10"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          />
        )}
        <span className="relative z-10 transition-colors duration-200" style={{ color: active ? '#7f70ff' : '#888' }}>
          {ICONS[id]}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[100]">
      {leftTabs.map(renderTab)}

      {/* Botón + incrustado, sobresale del borde superior */}
      <button
        onClick={onAdd}
        className="relative -mt-[32px] w-[56px] h-[56px] rounded-full bg-gradient-to-br from-[#7f70ff] to-[#9d8aff] border-none cursor-pointer flex items-center justify-center shadow-[0_4px_14px_rgba(127,112,255,0.4)] shrink-0 active:scale-[0.88] transition-transform"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {rightTabs.map(renderTab)}
    </nav>
  );
}
