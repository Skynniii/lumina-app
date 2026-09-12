import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { playCompleteSound } from '../../utils/sound';
import { useTimeTracker, todayKey, formatElapsed, isoToDateKey } from '../../hooks/useTimeTracker';
import { useFirestoreCollection, incrementTaskTime } from '../../hooks/useFirestoreCollection';
import { useCountdownTimer, type TimerMode } from '../../hooks/useCountdownTimer';
import { useUserStorage } from '../../hooks/useUserStorage';
import { setPendingTimerTask, getPendingTimerTask, clearPendingTimerTask } from '../../shared/pendingTimerTask';
import { TopBar } from '../ui/TopBar';
import { TodaySummary } from './TodaySummary';
import { FocusScreen } from './FocusScreen';
import { EntryList } from './EntryList';
import { SessionDetailModal } from './SessionDetailModal';
import type { Task, TaskList, TimerMode as AppTimerMode } from '../../types';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
}

const WORK_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

export function TimeTracker({ onMenuClick, onOpenAccount }: Props) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const tracker = useTimeTracker();
  const countdown = useCountdownTimer();
  const [mode, setMode] = useUserStorage<TimerMode>('timer-mode', 'rastreador');
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'break'>('work');
  const [pomodoroCycle, setPomodoroCycle] = useState(0);
  const [showFocus, setShowFocus] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const listsColl = useFirestoreCollection<TaskList>(uid, 'taskLists');
  const tasksColl = useFirestoreCollection<Task>(uid, 'tasks');
  const taskLists = listsColl.items;
  const tasks = tasksColl.items;

  const selectedEntry = selectedEntryId ? tracker.sessions.find((e) => e.id === selectedEntryId) ?? null : null;

  // Escuchar botón + de la barra de navegación y timer desde tareas
  useEffect(() => {
    const addHandler = () => {
      tracker.setDraft({ activityId: '', description: '', notes: '' });
      setShowFocus(true);
    };
    window.addEventListener('app-add', addHandler);
    return () => window.removeEventListener('app-add', addHandler);
  }, [tracker]);

  // Manejar tarea pendiente (iniciar timer desde TaskDetailView)
  useEffect(() => {
    const task = getPendingTimerTask();
    if (task) {
      clearPendingTimerTask();
      const plainNotes = task.notes ? task.notes.replace(/<[^>]*>/g, '').trim() : '';
      tracker.setDraft({ activityId: task.activityId || '', description: task.title, notes: plainNotes, taskId: task.id });
      setShowFocus(true);
    }
  }, [tracker]);

  const handleStop = async () => {
    await tracker.stop();
    if (settings.sounds) playCompleteSound();
  };

  const { setOnComplete, start: cdStart } = countdown;
  useEffect(() => {
    setOnComplete(() => {
      if (settings.sounds) playCompleteSound();
      if (mode === 'pomodoro') {
        if (pomodoroPhase === 'work') { setPomodoroPhase('break'); setPomodoroCycle((c) => c + 1); cdStart(BREAK_SEC); }
        else { setPomodoroPhase('work'); cdStart(WORK_SEC); }
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

  const handleDiscard = () => {
    if (mode === 'rastreador') tracker.discard();
    else countdown.reset();
    // Limpia taskId del draft para que no se herede en la próxima sesión
    tracker.setDraft((d) => ({ ...d, taskId: undefined }));
    setShowFocus(false);
  };

  const handleSaveSession = async (completeTask: boolean, taskId?: string) => {
    if (mode === 'rastreador') {
      await handleStop();
    } else {
      const elapsed = countdown.targetSeconds - countdown.remaining;
      if (elapsed >= 1) {
        const timerMode: AppTimerMode = mode === 'pomodoro' ? 'pomodoro' : 'timer';
        await tracker.saveSession(elapsed, timerMode);
        if (settings.sounds) playCompleteSound();
      }
      countdown.reset();
    }
    if (completeTask && taskId) {
      tasksColl.update(taskId, { completed: true, completedAt: new Date().toISOString() });
    }
    // Limpia taskId del draft para que la próxima sesión no se asocie a esta tarea
    tracker.setDraft((d) => ({ ...d, taskId: undefined }));
    setShowFocus(false);
  };

  const historyEntries = tracker.sessions.filter((e) => isoToDateKey(e.startTime) !== todayKey());

  const isTimerActive = mode === 'rastreador'
    ? tracker.running !== null
    : countdown.running || (countdown.remaining > 0 && countdown.remaining < countdown.targetSeconds);

  const activeElapsed = mode === 'rastreador'
    ? tracker.elapsed
    : countdown.targetSeconds - countdown.remaining;

  const activity = tracker.activities.find((a) => a.id === tracker.draft.activityId);

  const timerProps = {
    mode, onModeChange: handleModeChange,
    running: tracker.running, elapsed: tracker.elapsed,
    draft: tracker.draft, activities: tracker.activities,
    onStart: tracker.start, onPause: tracker.pause, onResume: tracker.resume, onStop: handleStop,
    onSetStartTime: tracker.setStartTime,
    onDescriptionChange: (v: string) => tracker.setDraft((d) => ({ ...d, description: v })),
    onActivityChange: (id: string) => tracker.setDraft((d) => ({ ...d, activityId: id })),
    onTaskIdChange: (id: string | undefined) => tracker.setDraft((d) => ({ ...d, taskId: id })),
    onCreateActivity: (name: string, color: string) => tracker.addActivity(name, color),
    countdown, pomodoroPhase, pomodoroCycle, onPomodoroSkip: handlePomodoroSkip,
  };

  return (
    <>
      <section className="absolute top-0 left-0 w-full h-full flex flex-col">
        <div className="px-5 pt-5 pb-2 shrink-0 z-50 bg-[#f7f6f9]">
          <TopBar title="Timer" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
          <div className="flex flex-col gap-5 mt-3">
            <TodaySummary
              entries={tracker.sessions}
              activities={tracker.activities}
              liveElapsed={tracker.running ? tracker.elapsed : 0}
              isRunning={tracker.isTicking}
              liveActivityId={tracker.draft.activityId}
              liveDescription={tracker.draft.description}
              onSelectEntry={(e) => setSelectedEntryId(e.id)}
            />

            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-[#eceaf3]" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Historial</span>
              <div className="flex-1 h-px bg-[#eceaf3]" />
            </div>

            <EntryList
              entries={historyEntries}
              activities={tracker.activities}
              onDelete={tracker.deleteSession}
              onSelectEntry={(e) => setSelectedEntryId(e.id)}
            />
          </div>
        </div>

        <AnimatePresence>
          {!showFocus && isTimerActive && (
            <motion.div
              key="bar"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setShowFocus(true)}
              className="absolute bottom-[85px] left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] bg-white rounded-2xl shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] flex items-center gap-3 px-4 py-3 cursor-pointer z-30"
            >
              {mode === 'rastreador' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity?.color ?? '#bbb' }} />
                  <span className="text-[14px] font-medium text-[#333] flex-1 truncate">{activity?.name ?? 'Sin actividad'}</span>
                  {tracker.isTicking && <span className="w-2 h-2 rounded-full bg-[#34c77b] animate-pulse shrink-0" />}
                  <span className="text-[15px] font-bold text-[#7f70ff] tabular-nums shrink-0">{formatElapsed(activeElapsed)}</span>
                </>
              )}
              {mode === 'temporizador' && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 5V2" /></svg>
                  <span className="text-[14px] font-medium text-[#333] flex-1">Temporizador</span>
                  <span className="text-[15px] font-bold text-[#7f70ff] tabular-nums shrink-0">{formatElapsed(activeElapsed)}</span>
                </>
              )}
              {mode === 'pomodoro' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }} />
                  <span className="text-[14px] font-medium text-[#333] flex-1">{pomodoroPhase === 'work' ? 'Trabajo' : 'Descanso'} · Ciclo {pomodoroCycle}</span>
                  <span className="text-[15px] font-bold tabular-nums shrink-0" style={{ color: pomodoroPhase === 'work' ? '#7f70ff' : '#34c77b' }}>{formatElapsed(activeElapsed)}</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showFocus && (
          <FocusScreen
            key="focus"
            onBack={() => setShowFocus(false)}
            {...timerProps}
            taskLists={taskLists}
            tasks={tasks}
            onNotesChange={(v) => tracker.setDraft((d) => ({ ...d, notes: v }))}
            onDiscard={handleDiscard}
            onSaveSession={handleSaveSession}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <SessionDetailModal
            key={selectedEntry.id}
            entry={selectedEntry}
            onUpdate={tracker.updateSession}
            onDelete={tracker.deleteSession}
            onClose={() => setSelectedEntryId(null)}
            tasks={tasks}
            taskLists={taskLists}
            onLinkTask={(entry, task) => { if (uid) incrementTaskTime(uid, task.id, entry.duration); }}
            onUnlinkTask={(entry) => { if (uid && entry.taskId) incrementTaskTime(uid, entry.taskId, -entry.duration); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
