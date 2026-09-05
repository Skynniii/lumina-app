import { motion } from 'framer-motion';
import type { ViewType } from '../../types';

interface Props {
  activeView: ViewType;
  onViewChange: (v: ViewType) => void;
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
      <path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" />
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

const TABS: { id: ViewType; label: string }[] = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'cronometro', label: 'Timer' },
  { id: 'habitos', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
];

export function NavegacionBar({ activeView, onViewChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[100]">
      {TABS.map((tab) => {
        const active = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-colors duration-200"
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 bg-[#f0edff] rounded-2xl -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 transition-colors duration-200" style={{ color: active ? '#7f70ff' : '#888' }}>
              {ICONS[tab.id]}
            </span>
            <span className="relative z-10 text-[10px] font-medium transition-colors duration-200" style={{ color: active ? '#7f70ff' : '#888' }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
