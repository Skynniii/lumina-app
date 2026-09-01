import { motion } from 'framer-motion';
import type { ViewType } from '../../types';

interface Props {
  activeView: ViewType;
  onViewChange: (v: ViewType) => void;
}

const TABS: { id: ViewType; icon: string; label: string }[] = [
  { id: 'cronometro', icon: '⏱️', label: 'Reloj' },
  { id: 'habitos', icon: '✅', label: 'Tasks' },
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
            className="relative text-base font-medium px-4 py-2 rounded-full transition-colors duration-200"
            style={{ color: active ? '#7f70ff' : '#888888', background: active ? '#f0edff' : 'transparent' }}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 bg-[#f0edff] rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">
              {tab.icon} {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
