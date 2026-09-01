import type { ViewType } from '../../types';

interface NavegacionBarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const NavegacionBar = ({ activeView, onViewChange }: NavegacionBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-[100]">
      <button
        onClick={() => onViewChange('cronometro')}
        className={`text-base font-medium px-4 py-2 rounded-full transition-all duration-200 ${
          activeView === 'cronometro'
            ? 'text-[#7f70ff] bg-[#f0edff]'
            : 'text-[#888888] bg-transparent'
        }`}
      >
        ⏱️ Reloj
      </button>
      <button
        onClick={() => onViewChange('habitos')}
        className={`text-base font-medium px-4 py-2 rounded-full transition-all duration-200 ${
          activeView === 'habitos'
            ? 'text-[#7f70ff] bg-[#f0edff]'
            : 'text-[#888888] bg-transparent'
        }`}
      >
        ✅ Tasks
      </button>
    </nav>
  );
};