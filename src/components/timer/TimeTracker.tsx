import { useSettings } from '../../context/SettingsContext';
import { playCompleteSound } from '../../utils/sound';
import { useTimeTracker } from '../../hooks/useTimeTracker';
import { TopBar } from '../ui/TopBar';
import { TodaySummary } from './TodaySummary';
import { ActiveTimerCard } from './ActiveTimerCard';
import { EntryList } from './EntryList';

interface Props {
  onMenuClick: () => void;
}

export function TimeTracker({ onMenuClick }: Props) {
  const { settings } = useSettings();
  const tracker = useTimeTracker();

  const handleStop = () => {
    const saved = tracker.stop();
    if (saved && settings.sounds) playCompleteSound();
  };

  return (
    <section className="absolute top-0 left-0 w-full h-full p-5 pb-[110px] overflow-y-auto no-scrollbar">
      <TopBar title="Timer" onMenuClick={onMenuClick} />

      <div className="mt-3 flex flex-col gap-5">
        <TodaySummary
          entries={tracker.entries}
          activities={tracker.activities}
          liveElapsed={tracker.running ? tracker.elapsed : 0}
          isRunning={tracker.isTicking}
        />

        <ActiveTimerCard
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
          onCreateActivity={(name, color) => {
            const id = tracker.addActivity(name, color);
            return id;
          }}
        />

        <EntryList
          entries={tracker.entries}
          activities={tracker.activities}
          onDelete={tracker.deleteEntry}
        />
      </div>
    </section>
  );
}
