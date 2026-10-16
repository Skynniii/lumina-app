import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useUserStorage } from '../../hooks/useUserStorage';
import { MONTHS, dateKey } from '../../hooks/useCalendarEvents';
import { incrementTaskTime } from '../../hooks/useFirestoreCollection';
import { todayKey } from '../../hooks/useTimeTracker';
import {
  useCalendarData, DEFAULT_LAYERS, parseKey, shiftKey, weekDaysOf,
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
 * Sección Calendario: vistas de mes, semana, día y agenda sobre la información
 * cruzada de tareas (pendientes y completadas), registros de tiempo y eventos.
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

  const title = useMemo(() => `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`, [anchor]);

  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDate(todayKey());
  }, []);

  const cycleMode = useCallback(() => {
    const order: CalendarViewMode[] = ['month', 'week', 'day', 'agenda'];
    const idx = order.indexOf(mode);
    const next = order[(idx + 1) % order.length];
    setMode(next);
    if (next === 'day' || next === 'agenda') setAnchor(parseKey(selectedDate));
  }, [mode, selectedDate]);

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

  const handleMonthSelect = useCallback((year: number, month: number) => {
    setAnchor(new Date(year, month, 1));
    if (mode === 'day' || mode === 'agenda') {
      setSelectedDate(dateKey(new Date(year, month, 1)));
    }
  }, [mode]);

  // Navegación por deslizamiento para semana/día/agenda
  const touchStart = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) <= 50) return;
    if (mode === 'week') {
      setAnchor((a) => parseKey(shiftKey(dateKey(a), diff > 0 ? 7 : -7)));
    } else {
      const next = shiftKey(selectedDate, diff > 0 ? 1 : -1);
      setSelectedDate(next);
      setAnchor(parseKey(next));
    }
  };

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
      <SectionHeader title="Calendario" onMenuClick={onMenuClick} onOpenAccount={onOpenAccount} background="#FFFFFF" className="z-50" />

      <CalendarToolbar
        mode={mode}
        onCycleMode={cycleMode}
        title={title}
        onToday={goToday}
        layers={layers}
        onToggleLayer={toggleLayer}
        anchor={anchor}
        onMonthSelect={handleMonthSelect}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {mode === 'month' ? (
          <>
            {/* Calendario: mitad superior */}
            <div className="flex-1 min-h-0 overflow-hidden px-5 pt-2">
              <MonthGrid
                anchorMonth={anchor}
                onMonthChange={setAnchor}
                selectedDate={selectedDate}
                onSelectDate={selectDate}
                itemsByDate={visibleByDate}
                fillHeight
              />
            </div>
            {/* Info del día: mitad inferior */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-[110px]">
              <div className="pt-3 flex flex-col gap-3">
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
          </>
        ) : mode === 'week' ? (
          <div
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-[110px] pt-2"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <TimeGrid
              days={weekDays}
              itemsByDate={visibleByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onSelectItem={openItem}
              detailed={false}
            />
          </div>
        ) : mode === 'day' ? (
          <div
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-[110px] pt-2"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="mb-3">
              <DaySummary date={selectedDate} items={selectedItems} />
            </div>
            <TimeGrid
              days={[selectedDate]}
              itemsByDate={visibleByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onSelectItem={openItem}
              detailed
            />
          </div>
        ) : (
          // Agenda
          <div
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-[110px] pt-3"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <DayAgenda
              date={selectedDate}
              items={selectedItems}
              onSelectItem={openItem}
              onNewTask={() => setShowNewTask(true)}
              onNewEvent={() => setEventForm({ mode: 'create' })}
            />
          </div>
        )}
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
