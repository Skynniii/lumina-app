import { motion } from 'framer-motion';
import type { TimerMode } from '../../hooks/useCountdownTimer';

interface Props {
  mode: TimerMode;
  onChange: (mode: TimerMode) => void;
}

const MODES: { value: TimerMode; label: string }[] = [
  { value: 'rastreador', label: 'Rastreador' },
  { value: 'temporizador', label: 'Temporizador' },
  { value: 'pomodoro', label: 'Pomodoro' },
];

export function TimerModeSelector({ mode, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-[#f0eef5] rounded-2xl w-full">
      {MODES.map((m) => {
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className="relative flex-1 py-2 rounded-xl text-[12px] font-semibold border-none cursor-pointer transition-colors"
            style={{ color: active ? '#fff' : '#888' }}
          >
            {active && (
              <motion.div
                layoutId="timer-mode-bubble"
                className="absolute inset-0 bg-[#7f70ff] rounded-xl shadow-[2px_4px_10px_rgba(127,112,255,0.2)]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
