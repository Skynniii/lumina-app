import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { useCountdownTimer, type TimerMode } from '../../hooks/useCountdownTimer';
import { useUserStorage } from '../../hooks/useUserStorage';
import { TopBar } from '../ui/TopBar';
import { TodaySummary } from './TodaySummary';
import { ActiveTimerCard } from './ActiveTimerCard';
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

  const handleStop = () => {
    const saved = tracker.stop();
    if (saved && settings.sounds) playCompleteSound();
  };

  // Transición automática de fases pomodoro
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
    if (newMode === 'temporizador') {
      countdown.setTarget(25);
    } else if (newMode === 'pomodoro') {
      countdown.setTarget(25);
      setPomodoroPhase('work');
      setPomodoroCycle(0);
    }
  };

  const handlePomodoroSkip = () => {
    if (pomodoroPhase === 'work') {
      setPomodoroPhase('break');
      setPomodoroCycle((c) => c + 1);
      countdown.start(BREAK_SEC);
    } else {
      setPomodoroPhase('work');
      countdown.start(WORK_SEC);
    }
  };

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col">
      {/* Header fijo */}
      <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
        <TopBar title="Timer" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
        {/* Pantalla inicial: llena el viewport */}
        <div className="flex flex-col gap-4 min-h-[calc(100dvh-155px)]">
          <TodaySummary
            entries={tracker.entries}
            activities={tracker.activities}
            liveElapsed={tracker.running ? tracker.elapsed : 0}
            isRunning={tracker.isTicking}
          />

          <ActiveTimerCard
            mode={mode}
            onModeChange={handleModeChange}
            running={tracker.running}
            elapsed={tracker.elapsed}
            draft={tracker.draft}
            activities={tracker.activities}
            onStart={tracker.start}
            onPause={tracker.pause}
            onResume={tracker.resume}
            onStop={handleStop}
            onDescriptionChange={(v) => tracker.setDraft((d) => ({ ...d, description: v }))}
            onActivityChange={(id) => tracker.setDraft((d) => ({ ...d, activityId: id }))}
            onCreateActivity={(name, color) => tracker.addActivity(name, color)}
            countdown={countdown}
            pomodoroPhase={pomodoroPhase}
            pomodoroCycle={pomodoroCycle}
            onPomodoroSkip={handlePomodoroSkip}
          />
        </div>

        {/* Historial: visible al deslizar hacia abajo */}
        <div className="mt-5">
          <EntryList
            entries={tracker.entries}
            activities={tracker.activities}
            onDelete={tracker.deleteEntry}
          />
        </div>
      </div>
    </section>
  );
}
