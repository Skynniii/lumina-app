import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { MONTHS, dateKey } from '../../hooks/useCalendarEvents';
import { incrementTaskTime } from '../../hooks/useFirestoreCollection';
import { todayKey } from '../../hooks/useTimeTracker';
import {
  useCalendarData, VIEW_LAYERS, parseKey, shiftKey, weekDaysOf,
  type CalendarItem,
} from '../../hooks/useCalendarData';
import { smoothScrollTo } from '../../utils/smoothScroll';
import { sortListsForDisplay } from '../../utils/listOrder';
import { SectionHeader } from '../ui/SectionHeader';
import { ModalNeuromorfico } from '../ui/ModalNeuromorfico';
import { CalendarToolbar, type CalendarViewMode } from './CalendarToolbar';
import { MonthGrid } from './MonthGrid';
import { WeekHeader } from './WeekHeader';
import { TimeGrid } from './TimeGrid';
import { MonthDayInfo } from './MonthDayInfo';
import { DayHeadline } from './DayHeadline';
import { DayResumen } from './DayResumen';
import { AgendaView } from './AgendaView';
import { SwipePager } from './SwipePager';
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
  const { taskApi, sessionApi, eventsApi, itemsByDate, lists: rawLists, tasks, sessions, activities, events } = data;
  const lists = useMemo(() => sortListsForDisplay(rawLists), [rawLists]);

  const [mode, setMode] = useState<CalendarViewMode>('agenda');
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => todayKey());
  // Se incrementa al pulsar "Hoy" para que la agenda se deslice hasta el mes actual
  const [todayPulse, setTodayPulse] = useState(0);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const agendaScrollRef = useRef<HTMLDivElement>(null);

  // La agenda entra siempre centrada en el día de hoy, sin desplazamiento visible.
  // Se hace aquí (padre) porque el ref del contenedor con scroll solo está listo
  // después de que sus hijos terminen de montarse.
  useLayoutEffect(() => {
    if (mode !== 'agenda') return;
    const scroller = agendaScrollRef.current;
    const target = scroller?.querySelector<HTMLElement>('[data-agenda-today]');
    if (!scroller || !target) return;
    const delta = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop = Math.max(0, scroller.scrollTop + delta - scroller.clientHeight / 2 + target.offsetHeight / 2);
  }, [mode, data.loading]);

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

  // En las vistas normales solo se pintan tareas pendientes y eventos;
  // lo completado y los registros viven en "Detalles del día".
  const visibleByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const [d, arr] of itemsByDate) {
      const shown = arr.filter((i) => VIEW_LAYERS.includes(i.kind));
      if (shown.length > 0) map.set(d, shown);
    }
    return map;
  }, [itemsByDate]);

  // Registros de tiempo por día, para pintarlos en su franja horaria en semana/día
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of data.items) {
      if (it.kind !== 'session') continue;
      const arr = map.get(it.date);
      if (arr) arr.push(it);
      else map.set(it.date, [it]);
    }
    return map;
  }, [data.items]);

  const selectedItems = visibleByDate.get(selectedDate) ?? [];
  // "Detalles del día" sí recibe todo lo del día (agregadas, completadas y registros)
  const dayItems = itemsByDate.get(selectedDate) ?? [];
  const weekDays = useMemo(() => weekDaysOf(anchor), [anchor]);

  const title = useMemo(() => `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`, [anchor]);

  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDate(todayKey());
    setTodayPulse((n) => n + 1);
    // En mes, semana y día se vuelve arriba con animación; la agenda se desliza
    // hasta el mes actual desde dentro de AgendaView.
    if (mode !== 'agenda') smoothScrollTo(topScrollRef.current, 0, 600);
  }, [mode]);

  // Orden de las vistas: agenda → mes → semana → día
  const cycleMode = useCallback(() => {
    const order: CalendarViewMode[] = ['agenda', 'month', 'week', 'day'];
    const idx = order.indexOf(mode);
    const next = order[(idx + 1) % order.length];
    setMode(next);
    // La vista de día abre siempre en el día actual
    if (next === 'day') {
      setAnchor(new Date());
      setSelectedDate(todayKey());
    } else if (next === 'agenda') {
      // La agenda entra siempre situada en la fecha actual
      setAnchor(new Date());
      setSelectedDate(todayKey());
    }
  }, [mode, selectedDate]);

  const openItem = useCallback((it: CalendarItem) => {
    if (it.event) setEventDetail(it.event);
    else if (it.task) setOpenTaskId(it.task.id);
    else if (it.session) setOpenSessionId(it.session.id);
  }, []);

  const selectDate = useCallback((key: string) => {
    setSelectedDate(key);
    setAnchor(parseKey(key));
  }, []);

  // Al tocar el número de un día de la semana se pasa a la vista de día
  const openDay = useCallback((key: string) => {
    setSelectedDate(key);
    setAnchor(parseKey(key));
    setMode('day');
  }, []);

  const handleMonthSelect = useCallback((year: number, month: number) => {
    setAnchor(new Date(year, month, 1));
    if (mode === 'day' || mode === 'agenda') {
      setSelectedDate(dateKey(new Date(year, month, 1)));
    }
  }, [mode]);

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
        anchor={anchor}
        onMonthSelect={handleMonthSelect}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {mode === 'month' ? (
          // Vista de mes: la rejilla es una ventana que se desliza entre meses
          <motion.div
            key="month"
            ref={topScrollRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-[110px] pt-2"
          >
            <div className="px-2">
              <SwipePager
                pageKey={`${anchor.getFullYear()}-${anchor.getMonth()}`}
                onPrev={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1))}
                onNext={() => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1))}
                renderPage={(off) => (
                  <div className="px-1">
                    <MonthGrid
                      anchorMonth={new Date(anchor.getFullYear(), anchor.getMonth() + off, 1)}
                      selectedDate={selectedDate}
                      onSelectDate={selectDate}
                      itemsByDate={visibleByDate}
                    />
                  </div>
                )}
              />
            </div>
            <div className="px-2 pt-3 flex flex-col gap-3">
              <MonthDayInfo
                date={selectedDate}
                items={selectedItems}
                onSelectItem={openItem}
                onNewTask={() => setShowNewTask(true)}
                onNewEvent={() => setEventForm({ mode: 'create' })}
              />
              <DayResumen
                date={selectedDate}
                items={dayItems}
                allTasks={tasks}
                allEvents={events}
                lists={lists}
                activities={activities}
                onSelectItem={openItem}
              />
            </div>
          </motion.div>
        ) : mode === 'week' ? (
          // Vista de semana: la semana entera se desliza entre semanas
          <motion.div
            key="week"
            ref={topScrollRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#f2f1f6] pb-[110px]"
          >
            <SwipePager
              pageKey={weekDays[0]}
              onPrev={() => setAnchor((a) => parseKey(shiftKey(dateKey(a), -7)))}
              onNext={() => setAnchor((a) => parseKey(shiftKey(dateKey(a), 7)))}
              renderPage={(off) => {
                const days = off === 0 ? weekDays : weekDaysOf(parseKey(shiftKey(weekDays[0], off * 7)));
                return (
                  <>
                    <WeekHeader
                      days={days}
                      itemsByDate={visibleByDate}
                      selectedDate={selectedDate}
                      onOpenDay={openDay}
                    />
                    <TimeGrid
                      days={days}
                      itemsByDate={visibleByDate}
                      sessionItemsByDate={sessionsByDate}
                      onSelectItem={openItem}
                    />
                  </>
                );
              }}
            />
          </motion.div>
        ) : mode === 'day' ? (
          // Vista de día: el día entero se desliza entre días
          <div
            key="day"
            ref={topScrollRef}
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#f2f1f6] pb-[110px]"
          >
            <SwipePager
              pageKey={selectedDate}
              onPrev={() => { const k = shiftKey(selectedDate, -1); setSelectedDate(k); setAnchor(parseKey(k)); }}
              onNext={() => { const k = shiftKey(selectedDate, 1); setSelectedDate(k); setAnchor(parseKey(k)); }}
              renderPage={(off) => {
                const key = off === 0 ? selectedDate : shiftKey(selectedDate, off);
                return (
                  <>
                    <DayHeadline
                      date={key}
                      items={visibleByDate.get(key) ?? []}
                      onSelectItem={openItem}
                    />
                    <TimeGrid
                      days={[key]}
                      itemsByDate={visibleByDate}
                      sessionItemsByDate={sessionsByDate}
                      onSelectItem={openItem}
                      detailed
                    />
                    <div className="px-2 pt-3">
                      <DayResumen
                        date={key}
                        items={itemsByDate.get(key) ?? []}
                        allTasks={tasks}
                        allEvents={events}
                        lists={lists}
                        activities={activities}
                        onSelectItem={openItem}
                      />
                    </div>
                  </>
                );
              }}
            />
          </div>
        ) : (
          // Agenda: información agrupada por meses y semanas
          <motion.div
            key="agenda"
            ref={agendaScrollRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-[110px] pt-2"
          >
            <AgendaView
              itemsByDate={visibleByDate}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onSelectItem={openItem}
              anchor={anchor}
              todayPulse={todayPulse}
              scrollRef={agendaScrollRef}
            />
          </motion.div>
        )}
      </div>

      <CalendarQuickAdd
        isOpen={quickAdd}
        date={selectedDate}
        onClose={() => setQuickAdd(false)}
        onNewTask={() => { setQuickAdd(false); setShowNewTask(true); }}
        onCreateEvent={(e) => eventsApi.addEvent(e)}
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
