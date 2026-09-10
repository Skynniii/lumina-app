import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { useTimeTracker, todayKey } from '../../hooks/useTimeTracker';
import { useCountdownTimer, type TimerMode } from '../../hooks/useCountdownTimer';
import { useUserStorage } from '../../hooks/useUserStorage';
import { TopBar } from '../ui/TopBar';
import { TodaySummary } from './TodaySummary';
import { FocusScreen } from './FocusScreen';
import { EntryList } from './EntryList';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

export function TimeTracker({ onMenuClick, onOpenAccount }: Props) {
  const { settings } = useSettings();
  const tracker = useTimeTracker();
  const countdown = useCountdownTimer();
  const [mode, setMode] = useUserStorage<TimerMode>('timer-mode', 'rastreador');
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroCycle, setPomodoroCycle] = useState(0);
  const [showFocus, setShowFocus] = useState(false);

  const handleStop = () => {
    const saved = tracker.stop();
    if (saved && settings.sounds) playCompleteSound();
  };

  const { setOnComplete, start: cdStart } = countdown;
  useEffect(() => {
    setOnComplete(() => {
      if (settings.sounds) playCompleteSound();
      if (mode === 'pomodoro') {
        if (pomodoroPhase === 'work') {
          setPomodoroPhase('break');
          setPomodoroCycle((c) => c + 1);
          cdStart(BREAK_SEC);
        } else {
          setPomodoroPhase('work');
          cdStart(WORK_SEC);
        }
      }
    });
  }, [mode, pomodoroPhase, settings.sounds, setOnComplete, cdStart]);

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    if (newMode === 'temporizador') countdown.setTarget(25);
    else if (newMode === 'pomodoro') { countdown.setTarget(25); setPomodoroPhase('work'); setPomodoroCycle(0); }
  };

  const handlePomodoroSkip = () => {
    if (pomodoroPhase === 'work') { setPomodoroPhase('break'); setPomodoroCycle((c) => c + 1); countdown.start(BREAK_SEC); }
    else { setPomodoroPhase('work'); countdown.start(WORK_SEC); }
  };

  const historyEntries = tracker.entries.filter((e) => e.date !== todayKey());

  const timerProps = {
    mode, onModeChange: handleModeChange,
    running: tracker.running, elapsed: tracker.elapsed,
    draft: tracker.draft, activities: tracker.activities,
    onStart: tracker.start, onPause: tracker.pause, onResume: tracker.resume, onStop: handleStop,
    onDescriptionChange: (v: string) => tracker.setDraft((d) => ({ ...d, description: v })),
    onActivityChange: (id: string) => tracker.setDraft((d) => ({ ...d, activityId: id })),
    onCreateActivity: (name: string, color: string) => tracker.addActivity(name, color),
    countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip: handlePomodoroSkip,
  };

  return (
    <>
      <section className="absolute top-0 left-0 w-full h-full flex flex-col">
        {/* Header fijo */}
        <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
          <TopBar title="Timer" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
          <div className="flex flex-col gap-5 mt-3">
            <TodaySummary
              entries={tracker.entries}
              activities={tracker.activities}
              liveElapsed={tracker.running ? tracker.elapsed : 0}
              isRunning={tracker.isTicking}
            />

            {/* Separador Historial */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-[#eceaf3]" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Historial</span>
              <div className="flex-1 h-px bg-[#eceaf3]" />
            </div>

            <EntryList
              entries={historyEntries}
              activities={tracker.activities}
              onDelete={tracker.deleteEntry}
            />
          </div>
        </div>

        {/* Botón + */}
        <AnimatePresence>
          {!showFocus && (
            <motion.button
              key="add"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={() => setShowFocus(true)}
              className="absolute bottom-[95px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] bg-white rounded-2xl shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] border-none text-[28px] text-[#7f70ff] cursor-pointer flex items-center justify-center z-30 active:shadow-[inset_2px_2px_5px_#e6e6e6]"
            >
              +
            </motion.button>
          )}
        </AnimatePresence>
      </section>

      {/* Pantalla completa de focus */}
      <AnimatePresence>
        {showFocus && (
          <FocusScreen key="focus" onBack={() => setShowFocus(false)} {...timerProps} />
        )}
      </AnimatePresence>
    </>
  );
}
