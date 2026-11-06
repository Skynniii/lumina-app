import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { weekStartIndex } from '../../utils/calendarDates';
import { MONTHS, dateKey } from '../../hooks/useCalendarEvents';
import { incrementTaskTime } from '../../hooks/useFirestoreCollection';
import { todayKey } from '../../hooks/useTimeTracker';
import {
  useCalendarData, VIEW_LAYERS, parseKey, shiftKey, weekDaysOf,
  type CalendarItem,
} from '../../hooks/useCalendarData';
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
import { CalendarSearch, type SearchPick } from './CalendarSearch';
import { EventForm } from './EventForm';
import { BirthdayForm } from './BirthdayForm';
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

/** Años navegables en la vista de mes y en la franja de meses. */
const MONTH_RANGE_YEARS = 10;

/**
 * Sección Calendario: vistas de mes, semana, día y agenda sobre la información
 * cruzada de tareas (pendientes y completadas), registros de tiempo y eventos.
 */
export function CalendarView({ onMenuClick, onOpenAccount, onNavigate }: Props) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { settings } = useSettings();
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
  const [searchOpen, setSearchOpen] = useState(false);

  // Rango navegable de la vista de mes (10 años a cada lado).
  const monthLimit = useMemo(() => {
    const now = new Date();
    return {
      min: new Date(now.getFullYear() - MONTH_RANGE_YEARS, now.getMonth(), 1),
      max: new Date(now.getFullYear() + MONTH_RANGE_YEARS, now.getMonth(), 1),
    };
  }, []);

  const canPrevMonth = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1) >= monthLimit.min;
  const canNextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1) <= monthLimit.max;

  // En la agenda, el mes del encabezado sigue al scroll (con animación al cambiar).
  const agendaTopsRef = useRef<{ key: string; top: number }[] | null>(null);
  useEffect(() => { agendaTopsRef.current = null; }, [data.items, mode]);

  useEffect(() => {
    if (mode !== 'agenda') return;
    const scroller = agendaScrollRef.current;
    if (!scroller) return;
    let raf = 0;

    const measure = () => {
      const base = scroller.getBoundingClientRect().top - scroller.scrollTop;
      const blocks = Array.from(scroller.querySelectorAll<HTMLElement>('[data-agenda-month]'));
      agendaTopsRef.current = blocks.map((b) => ({
        key: b.dataset.agendaMonth || '',
        top: b.getBoundingClientRect().top - base,
      }));
    };

    const update = () => {
      raf = 0;
      if (!agendaTopsRef.current) measure();
      const tops = agendaTopsRef.current;
      if (!tops || tops.length === 0) return;
      // El encabezado muestra el mes que ocupa el centro de la ventana, que es
      // donde queda el día de hoy al abrir la agenda.
      const y = scroller.scrollTop + scroller.clientHeight / 2;
      let key = tops[0].key;
      for (const t of tops) {
        if (t.top <= y) key = t.key;
        else break;
      }
      const [yy, mm] = key.split('-').map(Number);
      setAnchor((prev) => (prev.getFullYear() === yy && prev.getMonth() === mm - 1 ? prev : new Date(yy, mm - 1, 1)));
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode, data.loading]);

  const [quickAdd, setQuickAdd] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [eventForm, setEventForm] = useState<{ mode: 'create' | 'edit'; event?: CalendarEvent } | null>(null);
  // Los cumpleaños se editan con su propio formulario (nombre + fecha)
  const [birthdayEdit, setBirthdayEdit] = useState<CalendarEvent | null>(null);
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

  // Qué información entra al calendario según los ajustes de la sección
  const calendarItemsByDate = useMemo(() => {
    if (settings.showCompletedTasks && settings.showPastEvents) return itemsByDate;
    const t = todayKey();
    const map = new Map<string, CalendarItem[]>();
    for (const [d, arr] of itemsByDate) {
      const kept = arr.filter((i) => {
        if (i.kind === 'completed' && !settings.showCompletedTasks) return false;
        // Los cumpleaños se repiten cada año: no son eventos "pasados"
        if (i.kind === 'event' && !i.birthday && !settings.showPastEvents && d < t) return false;
        return true;
      });
      if (kept.length > 0) map.set(d, kept);
    }
    return map;
  }, [itemsByDate, settings.showCompletedTasks, settings.showPastEvents]);

  // En las vistas normales solo se pintan tareas pendientes y eventos;
  // lo completado y los registros viven en "Detalles del día".
  const visibleByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const [d, arr] of calendarItemsByDate) {
      const shown = arr.filter((i) => VIEW_LAYERS.includes(i.kind));
      if (shown.length > 0) map.set(d, shown);
    }
    return map;
  }, [calendarItemsByDate]);

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

  // Días con tareas completadas: en la rejilla del mes, el pasado se marca distinto
  const completedKeys = useMemo(() => {
    const set = new Set<string>();
    if (settings.showCompletedTasks) {
      for (const it of data.items) if (it.kind === 'completed') set.add(it.date);
    }
    return set;
  }, [data.items, settings.showCompletedTasks]);

  // Tareas pendientes de días anteriores: se muestran en el día de hoy como "Atrasado"
  const overdueItems = useMemo(() => {
    const t = todayKey();
    return data.items.filter((i) => i.kind === 'pending' && i.date < t);
  }, [data.items]);

  // Las tarjetas del día ("Orden del día" y "Detalles del día") muestran siempre
  // todo lo del día: los ajustes de visibilidad solo afectan a las vistas.
  const dayItems = itemsByDate.get(selectedDate) ?? [];
  const weekStartDay = weekStartIndex(settings.weekStart);
  const weekDays = useMemo(() => weekDaysOf(anchor, weekStartDay), [anchor, weekStartDay]);

  const title = useMemo(() => `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`, [anchor]);

  // "Hoy" lleva al día de hoy en la vista en la que esté el usuario.
  const goToday = useCallback(() => {
    setAnchor(new Date());
    setSelectedDate(todayKey());
    setTodayPulse((n) => n + 1);
  }, []);

  // Orden de las vistas: agenda → mes → semana → día
  const cycleMode = useCallback(() => {
    const order: CalendarViewMode[] = ['agenda', 'month', 'week', 'day'];
    const idx = order.indexOf(mode);
    const next = order[(idx + 1) % order.length];
    setMode(next);
    // Día, semana y agenda abren siempre en la fecha actual
    if (next === 'day' || next === 'week' || next === 'agenda') {
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

  // Cambiar de mes deja seleccionado su día primero
  const handleMonthSelect = useCallback((year: number, month: number) => {
    const first = new Date(year, month, 1);
    setAnchor(first);
    setSelectedDate(dateKey(first));
  }, []);

  /** Deslizar la rejilla del mes (con límite de 10 años a cada lado). */
  const shiftMonth = useCallback((delta: number) => {
    const next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
    if (next < monthLimit.min || next > monthLimit.max) return;
    setAnchor(next);
    setSelectedDate(dateKey(next));
  }, [anchor, monthLimit]);

  // Resultado del buscador: lleva al día del ítem y abre su detalle
  const handleSearchPick = useCallback((pick: SearchPick) => {
    setSearchOpen(false);
    const key = pick.event?.date ?? pick.date;
    if (key) {
      setSelectedDate(key);
      setAnchor(parseKey(key));
      setMode('day');
    }
    if (pick.event) setEventDetail(pick.event);
    else if (pick.task) setOpenTaskId(pick.task.id);
  }, []);

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
        onSearch={() => setSearchOpen(true)}
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
            {/* Sin márgenes laterales ni esquinas: al deslizar solo se mueven los números */}
            <SwipePager
              pageKey={`${anchor.getFullYear()}-${anchor.getMonth()}`}
              canPrev={canPrevMonth}
              canNext={canNextMonth}
              onPrev={() => shiftMonth(-1)}
              onNext={() => shiftMonth(1)}
              renderPage={(off) => (
                <MonthGrid
                  anchorMonth={new Date(anchor.getFullYear(), anchor.getMonth() + off, 1)}
                  selectedDate={selectedDate}
                  onSelectDate={selectDate}
                  itemsByDate={calendarItemsByDate}
                  completedKeys={completedKeys}
                />
              )}
            />
            <div className="px-2 pt-3 flex flex-col gap-3">
              <MonthDayInfo
                date={selectedDate}
                items={dayItems}
                overdueItems={overdueItems}
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
                const days = off === 0 ? weekDays : weekDaysOf(parseKey(shiftKey(weekDays[0], off * 7)), weekStartDay);
                return (
                  <>
                    <WeekHeader
                      days={days}
                      itemsByDate={visibleByDate}
                      selectedDate={selectedDate}
                      completedKeys={completedKeys}
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
          <motion.div
            key="day"
            ref={topScrollRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
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
                      completedItems={(calendarItemsByDate.get(key) ?? []).filter((i) => i.kind === 'completed')}
                      overdueItems={key === todayKey() ? overdueItems : []}
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
          </motion.div>
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
              onSelectItem={openItem}
              onOpenDay={openDay}
              todayPulse={todayPulse}
              scrollRef={agendaScrollRef}
            />
          </motion.div>
        )}
      </div>

      <CalendarSearch
        open={searchOpen}
        tasks={tasks}
        events={events}
        lists={lists}
        onClose={() => setSearchOpen(false)}
        onPick={handleSearchPick}
      />

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
          // Se conservan los campos que el formulario no maneja (p. ej. `birthday`)
          if (eventForm?.mode === 'edit' && eventForm.event) eventsApi.updateEvent({ ...eventForm.event, ...e, id: eventForm.event.id });
          else eventsApi.addEvent(e);
        }}
      />

      <BirthdayForm
        isOpen={birthdayEdit !== null}
        initialEvent={birthdayEdit ?? undefined}
        onClose={() => setBirthdayEdit(null)}
        onSave={(e) => { if (birthdayEdit) eventsApi.updateEvent({ ...birthdayEdit, ...e, id: birthdayEdit.id }); }}
      />

      <EventDetail
        event={eventDetail}
        onClose={() => setEventDetail(null)}
        onEdit={(e) => { setEventDetail(null); if (e.birthday) setBirthdayEdit(e); else setEventForm({ mode: 'edit', event: e }); }}
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
