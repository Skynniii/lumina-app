import type { ActiveTimerCardProps } from './ActiveTimerCard';
import { ActiveTimerCard } from './ActiveTimerCard';

interface Props extends ActiveTimerCardProps {
  onBack: () => void;
}

export function TimerSetup({ onBack, ...timerProps }: Props) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-5 py-3 text-[#555] font-semibold text-[15px] bg-transparent border-none cursor-pointer hover:bg-black/5 rounded-xl transition-colors self-start"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Atrás
      </button>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
        <div className="flex items-center justify-center min-h-full">
          <ActiveTimerCard {...timerProps} />
        </div>
      </div>
    </div>
  );
}
