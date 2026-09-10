import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { useTimeTracker, formatElapsed } from '../../hooks/useTimeTracker';
import { useCountdownTimer, type TimerMode } from '../../hooks/useCountdownTimer';
import { useUserStorage } from '../../hooks/useUserStorage';
import { TopBar } from '../ui/TopBar';
import { TodaySummary } from './TodaySummary';
import { TimerSetup } from './TimerSetup';
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
  const [showSetup, setShowSetup] = useState(false);

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

  // ¿Hay una sesión activa?
  const isTimerActive = mode === 'rastreador'
    ? tracker.running !== null
    : countdown.running || (countdown.remaining > 0 && countdown.remaining < countdown.targetSeconds);

  // Datos para la barra flotante
  const activity = tracker.activities.find((a) => a.id === tracker.draft.activityId);
  const cdMin = Math.floor(countdown.remaining / 60);
  const cdSec = countdown.remaining % 60;
  const cdDisplay = `${String(cdMin).padStart(2, '0')}:${String(cdSec).padStart(2, '0')}`;

  const timerProps = {
    mode,
    onModeChange: handleModeChange,
    running: tracker.running,
    elapsed: tracker.elapsed,
    draft: tracker.draft,
    activities: tracker.activities,
    onStart: tracker.start,
    onPause: tracker.pause,
    onResume: tracker.resume,
    onStop: handleStop,
    onDescriptionChange: (v: string) => tracker.setDraft((d) => ({ ...d, description: v })),
    onActivityChange: (id: string) => tracker.setDraft((d) => ({ ...d, activityId: id })),
    onCreateActivity: (name: string, color: string) => tracker.addActivity(name, color),
    countdown,
    pomodoroPhase,
    pomodoroCycle,
    onPomodoroSkip: handlePomodoroSkip,
  };

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col">
      {/* Header fijo */}
      <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
        <TopBar title="Timer" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
      </div>

      {/* Área de contenido */}
      <div className="flex-1 relative overflow-hidden">
        {/* Contenido principal: resumen + historial */}
        <div className="absolute inset-0 overflow-y-auto no-scrollbar px-5 pb-[110px]">
          <div className="flex flex-col gap-5 mt-3">
            <TodaySummary
              entries={tracker.entries}
              activities={tracker.activities}
              liveElapsed={tracker.running ? tracker.elapsed : 0}
              isRunning={tracker.isTicking}
            />
            <EntryList
              entries={tracker.entries}
              activities={tracker.activities}
              onDelete={tracker.deleteEntry}
            />
          </div>
        </div>

        {/* Overlay: pantalla de configuración, barra flotante, o botón + */}
        <AnimatePresence>
          {showSetup ? (
            <motion.div
              key="setup"
              layoutId="timer-surface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-[#f7f6f9] z-40 overflow-hidden"
            >
              <TimerSetup onBack={() => setShowSetup(false)} {...timerProps} />
            </motion.div>
          ) : isTimerActive ? (
            <motion.div
              key="bar"
              layoutId="timer-surface"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setShowSetup(true)}
              className="absolute bottom-[95px] left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] bg-white rounded-2xl shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex items-center gap-3 px-4 py-3 cursor-pointer z-30"
            >
              {mode === 'rastreador' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                  <span className="text-[14px] font-medium text-[#333] flex-1 truncate">{activity?.name ?? 'Actividad'}</span>
                  {tracker.isTicking && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                  <span className="text-[15px] font-bold text-[#7f70ff] tabular-nums shrink-0">{formatElapsed(tracker.elapsed)}</span>
                </>
              )}
              {mode === 'temporizador' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" />
                  </svg>
                  <span className="text-[14px] font-medium text-[#333] flex-1">Temporizador</span>
                  <span className="text-[15px] font-bold text-[#7f70ff] tabular-nums shrink-0">{cdDisplay}</span>
                </>
              )}
              {mode === 'pomodoro' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }} />
                  <span className="text-[14px] font-medium text-[#333] flex-1">{pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'} · Ciclo {pomodoroCycle}</span>
                  <span className="text-[15px] font-bold tabular-nums shrink-0" style={{ color: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }}>{cdDisplay}</span>
                </>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              onClick={() => setShowSetup(true)}
              className="absolute bottom-[95px] left-1/2 -translate-x-1/2 w-[55px] h-[55px] bg-white rounded-2xl shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] border-none text-[28px] text-[#7f70ff] cursor-pointer flex items-center justify-center z-30 active:shadow-[inset_2px_2px_5px_#e6e6e6]"
            >
              +
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
