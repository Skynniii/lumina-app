import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUserStorage } from '../../hooks/useUserStorage';
import { MONTHS, dateKey } from '../../hooks/useCalendarEvents';
import { incrementTaskTime } from '../../hooks/useFirestoreCollection';
import { todayKey } from '../../hooks/useTimeTracker';
import {
  useCalendarData, DEFAULT_LAYERS, parseKey, shiftKey, weekDaysOf, weekRangeLabel, longDateLabel,
  type CalendarItem, type CalendarLayer,
} from '../../hooks/useCalendarData';
import { sortListsForDisplay } from '../../utils/listOrder';
import { SectionHeader } from '../ui/SectionHeader';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { CalendarToolbar, type CalendarViewMode } from './CalendarToolbar';
import { MonthGrid } from './MonthGrid';
import { TimeGrid } from './TimeGrid';
import { DaySummary } from './DaySummary';
import { DayAgenda } from './DayAgenda';
import { CalendarQuickAdd } from './CalendarQuickAdd';
import { EventForm } from './EventForm';
import { EventDetail } from './EventDetail';
import { NuevaTareaModal } from '../tareas/NuevaTareaModal';
import { TaskDetailView } from '../tareas/TaskDetailView';
import { SessionDetailModal } from '../timer/SessionDetailModal';
import type { CalendarEvent, ViewType } from '../../types';

interface Props {
  onMenuClick: () => void;
  onOpenAccount: () => void;
  onNavigate?: (v: ViewType) => void;
}

/**
 * Sección Calendario: vistas de mes, semana y día sobre la información cruzada
 * de tareas (pendientes y completadas), registros de tiempo y eventos propios.
 */
export function CalendarView({ onMenuClick, onOpenAccount, onNavigate }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const data = useCalendarData();
  const { taskApi, sessionApi, eventsApi, itemsByDate, lists: rawLists, tasks, sessions } = data;
  const lists = useMemo(() => sortListsForDisplay(rawLists), [rawLists]);

  const [mode, setMode] = useState<CalendarViewMode>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  const [layers, setLayers] = useUserStorage<Record<CalendarLayer, boolean>>('calendar-layers', DEFAULT_LAYERS);

  const [quickAdd, setQuickAdd] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [eventForm, setEventForm] = useState<{ mode: 'create' | 'edit'; event?: CalendarEvent } | null>(null);
  const [eventDetail, setEventDetail] = useState<CalendarEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CalendarEvent | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  // Botón + de la barra de navegación
  useEffect(() => {
    const handler = () => setQuickAdd(true);
    window.addEventListener('app-add', handler);
    return () => window.removeEventListener('app-add', handler);
  }, []);

  const visibleByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const [d, arr] of itemsByDate) {
      const filtered = arr.filter((i) => layers[i.kind] !== false);
      if (filtered.length > 0) map.set(d, filtered);
    }
    return map;
  }, [itemsByDate, layers]);

  const selectedItems = visibleByDate.get(selectedDate) ?? [];

  const weekDays = useMemo(() => weekDaysOf(anchor), [anchor]);
  const today = todayKey();

  const isToday = useMemo(() => {
    if (mode === 'month') {
      const now = new Date();
      return anchor.getMonth() === now.getMonth() && anchor.getFullYear() === now.getFullYear();
    }
    if (mode === 'week') return weekDays.includes(today);
    return selectedDate === today;
  }, [mode, anchor, weekDays, selectedDate, today]);

  const title = useMemo(() => {
    if (mode === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
    if (mode === 'week') return weekRangeLabel(weekDays);
    return longDateLabel(selectedDate);
  }, [mode, anchor, weekDays, selectedDate]);

  const goPrev = useCallback(() => {
    if (mode === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
    else if (mode === 'week') setAnchor((a) => parseKey(shiftKey(dateKey(a), -7)));
    else {
      const prev = shiftKey(selectedDate, -1);
      setSelectedDate(prev);
      setAnchor(parseKey(prev));
    }
  }, [mode, anchor, selectedDate]);

  const goNext = useCallback(() => {
    if (mode === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
    else if (mode === 'week') setAnchor((a) => parseKey(shiftKey(dateKey(a), 7)));
    else {
      const next = shiftKey(selectedDate, 1);
      setSelectedDate(next);
      setAnchor(parseKey(next));
    }
  }, [mode, anchor, selectedDate]);

  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDate(todayKey());
  }, []);

  const toggleLayer = useCallback((l: CalendarLayer) => {
    setLayers((prev) => ({ ...prev, [l]: !prev[l] }));
  }, [setLayers]);

  const openItem = useCallback((it: CalendarItem) => {
    if (it.event) setEventDetail(it.event);
    else if (it.task) setOpenTaskId(it.task.id);
    else if (it.session) setOpenSessionId(it.session.id);
  }, []);

  const selectDate = useCallback((key: string) => {
    setSelectedDate(key);
    setAnchor(parseKey(key));
  }, []);

  const changeMode = useCallback((m: CalendarViewMode) => {
    setMode(m);
    if (m === 'day') setAnchor(parseKey(selectedDate));
  }, [selectedDate]);

  const openTask = openTaskId ? tasks.find((t) => t.id === openTaskId) ?? null : null;
  const openSession = openSessionId ? sessions.find((s) => s.id === openSessionId) ?? null : null;

  const availableLists = useMemo(() => lists.filter((l) => l.id !== 'principal'), [lists]);
  const defaultListId = availableLists[0]?.id ?? lists[0]?.id ?? 'principal';

  if (data.loading) {
    return (
      <section className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-[#f7f6f9]">
        <span className="w-7 h-7 border-2 border-[#7f70ff] border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="absolute top-0 left-0 w-full h-full flex flex-col bg-[#f7f6f9]">
      <SectionHeader title="Calendario" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} background="#f7f6f9" className="z-50" />

      <CalendarToolbar
        mode={mode}
        onModeChange={changeMode}
        layers={layers}
        onToggleLayer={toggleLayer}
        title={title}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        isToday={isToday}
      />

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-[110px]">
        <div className="pt-2 flex flex-col gap-4">
          {mode === 'month' ? (
            <MonthGrid
              anchorMonth={anchor}
              onMonthChange={setAnchor}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              itemsByDate={visibleByDate}
            />
          ) : (
            <TimeGrid
              days={mode === 'day' ? [selectedDate] : weekDays}
              itemsByDate={visibleByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onSelectItem={openItem}
              detailed={mode === 'day'}
            />
          )}

          <DaySummary date={selectedDate} items={selectedItems} />

          <DayAgenda
            date={selectedDate}
            items={selectedItems}
            onSelectItem={openItem}
            onNewTask={() => setShowNewTask(true)}
            onNewEvent={() => setEventForm({ mode: 'create' })}
          />
        </div>
      </div>

      <CalendarQuickAdd
        isOpen={quickAdd}
        date={selectedDate}
        onClose={() => setQuickAdd(false)}
        onNewTask={() => { setQuickAdd(false); setShowNewTask(true); }}
        onNewEvent={() => { setQuickAdd(false); setEventForm({ mode: 'create' }); }}
      />

      <NuevaTareaModal
        isOpen={showNewTask}
        defaultListId={defaultListId}
        availableLists={availableLists}
        allLists={lists}
        allTasks={tasks}
        initialDate={selectedDate}
        onClose={() => setShowNewTask(false)}
        onCreate={(taskData, listId) => taskApi.addTaskWithData(listId, taskData)}
      />

      <EventForm
        isOpen={eventForm !== null}
        onClose={() => setEventForm(null)}
        initialDate={selectedDate}
        initialEvent={eventForm?.mode === 'edit' ? eventForm.event : undefined}
        onSave={(e) => {
          if (eventForm?.mode === 'edit' && eventForm.event) eventsApi.updateEvent({ ...e, id: eventForm.event.id });
          else eventsApi.addEvent(e);
        }}
      />

      <EventDetail
        event={eventDetail}
        onClose={() => setEventDetail(null)}
        onEdit={(e) => { setEventDetail(null); setEventForm({ mode: 'edit', event: e }); }}
        onDelete={(id) => {
          const ev = eventsApi.events.find((e) => e.id === id) ?? null;
          setEventDetail(null);
          setPendingDelete(ev);
        }}
      />

      <ModalNeuromorfico
        isOpen={pendingDelete !== null}
        type="confirm"
        title="¿Eliminar este evento?"
        onConfirm={() => {
          if (pendingDelete) eventsApi.deleteEvent(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />

      <ModalNeuromorfico {...taskApi.modalConfig} />

      <AnimatePresence>
        {openTask && (
          <TaskDetailView
            key={openTask.id}
            task={openTask}
            lists={lists}
            allTasks={tasks}
            onBack={() => setOpenTaskId(null)}
            onToggle={taskApi.toggleTask}
            onUpdate={taskApi.updateTask}
            onDelete={(id) => taskApi.deleteTask(id)}
            onNavigate={onNavigate}
            onOpenTask={setOpenTaskId}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openSession && (
          <SessionDetailModal
            key={openSession.id}
            entry={openSession}
            onUpdate={sessionApi.update}
            onDelete={sessionApi.remove}
            onClose={() => setOpenSessionId(null)}
            tasks={tasks}
            taskLists={lists}
            onLinkTask={(entry, task) => { if (uid) incrementTaskTime(uid, task.id, entry.duration); }}
            onUnlinkTask={(entry) => { if (uid && entry.taskId) incrementTaskTime(uid, entry.taskId, -entry.duration); }}
            onSyncToTask={(taskId, updates) => taskApi.updateTask(taskId, updates)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
