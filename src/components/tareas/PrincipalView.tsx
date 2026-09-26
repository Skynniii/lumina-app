import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, TaskList, SortMode } from '../../types';
import { TareaItem } from './TareaItem';
import { SortMenu } from './SortMenu';
import { useSettings } from '../../context/SettingsContext';
import { useDeviceCapability } from '../../context/DeviceCapabilityContext';
import { useActivities } from '../../hooks/useActivities';

interface Props {
  lists: TaskList[];
  tasks: Task[];
  principalList: TaskList;
  onUpdateList: (id: string, updates: Partial<TaskList>) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onExpandTask: (id: string) => void;
}

const PRINCIPAL_SORTS: { value: SortMode; label: string }[] = [
  { value: 'custom', label: 'Normal' },
  { value: 'date', label: 'Por fecha' },
  { value: 'deadline', label: 'Por fecha límite' },
];

/* ---------- helpers de fecha (robustos a zona horaria) ---------- */

function dayDiff(dateStr: string): number {
  if (typeof dateStr !== 'string' || !dateStr) return NaN;
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - todayUTC) / 86400000);
}

function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function addDaysStr(dateStr: string, n: number): string {
  if (typeof dateStr !== 'string' || !dateStr) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function shortDate(dateStr: string): string {
  if (typeof dateStr !== 'string' || !dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function dateLabel(dateStr: string): string {
  if (typeof dateStr !== 'string' || !dateStr) return 'Sin fecha';
  const diff = dayDiff(dateStr);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff < 0) return 'Atrasado';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function sortByDateKey(key: 'scheduledDate' | 'dueDate') {
  return (a: Task, b: Task) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av !== 'string' || !av) return 1;
    if (typeof bv !== 'string' || !bv) return -1;
    return av.localeCompare(bv);
  };
}

// Importantes primero; dentro de cada bloque mantiene el orden de entrada.
function importantFirst(tasks: Task[]): Task[] {
  const imp = tasks.filter((t) => t.isImportant);
  const rest = tasks.filter((t) => !t.isImportant);
  return [...imp, ...rest];
}

interface Group {
  label: string;
  color?: string;
  tasks: Task[];
}

// Agrupa por la fecha de `key`, ordenadas asc; opcionalmente importantes primero en cada grupo.
function groupByKey(tasks: Task[], key: 'scheduledDate' | 'dueDate' | 'deadline', impFirst: boolean): Group[] {
  const actualKey = key === 'deadline' ? 'dueDate' : key;
  const sorted = [...tasks].sort(sortByDateKey(actualKey));
  const groups: Group[] = [];
  for (const t of sorted) {
    const dk = t[actualKey]!;
    const label = dateLabel(dk);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.tasks.push(t);
    else groups.push({ label, color: label === 'Atrasado' ? '#e53935' : undefined, tasks: [t] });
  }
  if (impFirst) for (const g of groups) g.tasks = importantFirst(g.tasks);
  return groups;
}

// Ordena igual que el modo de orden de una lista (para espejar "Hoy").
function sortLikeList(tasks: Task[], list: TaskList): Task[] {
  const mode = list.sortMode || 'custom';
  const arr = [...tasks];
  if (mode === 'recent') arr.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  else if (mode === 'date') arr.sort(sortByDateKey('scheduledDate'));
  else if (mode === 'deadline') arr.sort(sortByDateKey('dueDate'));
  else if (mode === 'custom' && list.taskOrder) {
    const orderMap = new Map(list.taskOrder.map((id, i) => [id, i]));
    arr.sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Infinity;
      const bi = orderMap.get(b.id) ?? Infinity;
      return ai - bi;
    });
  }
  return arr;
}

/* ---------- sub-componentes de presentación ---------- */

function GroupHeader({ title, color }: { title: string; color?: string }) {
  const cap = useDeviceCapability();
  return (
    <motion.p
      layout={cap.enableLayout}
      className={`pt-4 first:pt-1 pb-1.5 text-[12px] font-bold uppercase tracking-wider ${color ? '' : 'text-[#a0a0a0]'}`}
      style={color ? { color } : undefined}
    >
      {title}
    </motion.p>
  );
}

function DateSectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-4 first:pt-1 pb-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[14px] font-bold uppercase tracking-wide text-[#2b2b2b]">{title}</span>
        {subtitle && <span className="text-[12px] text-[#b0b0b0] capitalize">{subtitle}</span>}
      </div>
      {action}
    </div>
  );
}

function Divider({ label, color }: { label: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 my-5 first:mt-1">
      <div className="flex-1 h-px bg-[#eceaf3]" />
      <span className={`text-[12px] font-bold uppercase tracking-wider whitespace-nowrap ${color ? '' : 'text-[#a0a0a0]'}`} style={color ? { color } : undefined}>{label}</span>
      <div className="flex-1 h-px bg-[#eceaf3]" />
    </div>
  );
}

function SubLabel({ label }: { label: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b8b8b8] pt-3 pb-1">{label}</p>;
}

function TaskList({ items, render }: { items: Task[]; render: (t: Task) => ReactNode }) {
  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1.5 relative">
      <AnimatePresence mode="popLayout">{items.map(render)}</AnimatePresence>
    </ul>
  );
}

/* ---------- menú de vinculación de "Hoy" a una lista ---------- */

function HoyLinkMenu({ lists, hoyListId, onLink }: { lists: TaskList[]; hoyListId?: string; onLink: (id?: string) => void }) {
  const [open, setOpen] = useState(false);
  const linked = lists.find((l) => l.id === hoyListId && l.id !== 'principal');
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#f4f3fb] text-[#7f70ff] text-[11px] font-semibold hover:bg-[#eee9fb] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        {linked ? linked.name : 'Vincular'}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[400]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#eaeaea] rounded-2xl py-1.5 w-[180px] z-[401] max-h-[260px] overflow-y-auto no-scrollbar"
            >
              {linked && (
                <button
                  onClick={() => { onLink(undefined); setOpen(false); }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] text-[#ff4d4d] hover:bg-[#fff5f5] transition-colors"
                >
                  Quitar vínculo
                </button>
              )}
              {lists.filter((l) => l.id !== 'principal').map((l) => (
                <button
                  key={l.id}
                  onClick={() => { onLink(l.id); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] text-[#555] hover:bg-[#f8f9fa] transition-colors"
                >
                  <span>{l.name}</span>
                  {l.id === hoyListId && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- componente ---------- */

export function PrincipalView({ lists, tasks, principalList, onUpdateList, onToggleTask, onUpdateTask, onExpandTask }: Props) {
  const { settings } = useSettings();
  const { activities } = useActivities();
  const sortMode: SortMode = principalList.sortMode || 'custom';
  const activityMap = useMemo(() => {
    const m: Record<string, { color: string; name: string }> = {};
    for (const a of activities) m[a.id] = { color: a.color, name: a.name };
    return m;
  }, [activities]);
  const actColor = (t: Task) => {
    if (t.activityId) return activityMap[t.activityId]?.color;
    if (t.isActivityOnly) {
      const taskList = lists.find((l) => l.id === t.listId);
      if (taskList?.activityId) return activityMap[taskList.activityId]?.color;
    }
    if (t.linkedTaskId) {
      const linked = tasks.find((tk) => tk.id === t.linkedTaskId);
      if (linked?.activityId) return activityMap[linked.activityId]?.color;
    }
    return undefined;
  };
  const actName = (t: Task) => {
    if (t.activityId) return activityMap[t.activityId]?.name;
    if (t.isActivityOnly) {
      const taskList = lists.find((l) => l.id === t.listId);
      if (taskList?.activityId) return activityMap[taskList.activityId]?.name;
    }
    if (t.linkedTaskId) {
      const linked = tasks.find((tk) => tk.id === t.linkedTaskId);
      if (linked?.activityId) return activityMap[linked.activityId]?.name;
    }
    return undefined;
  };

  const listNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of lists) m[l.id] = l.name;
    return m;
  }, [lists]);

  const pending = useMemo(() => {
    const filtered = tasks.filter((t) => !t.completed && !t.isSeparator);
    if (settings.hideNoDateInPrincipal) {
      if (sortMode === 'deadline') return filtered.filter((t) => t.dueDate || t.isImportant);
      if (sortMode === 'date' && principalList.hoyListId) {
        // Permite ver tareas sin fecha de la lista vinculada a "Hoy"
        return filtered.filter((t) => t.scheduledDate || t.isImportant || t.listId === principalList.hoyListId);
      }
      return filtered.filter((t) => t.scheduledDate || t.isImportant);
    }
    return filtered;
  }, [tasks, settings.hideNoDateInPrincipal, sortMode]);

  // Importante: muestra lista + fecha (la fecha no está en cabecera aquí).
  const renderTask = (t: Task) => (
    <TareaItem key={t.id} task={t} listTag={listNameById[t.listId]} onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} activityColor={actColor(t)} activityName={actName(t)} />
  );
  // Secciones con fecha en cabecera (Hoy/Mañana/Próximamente): oculta la fecha de la tarea.
  const renderTaskNoDate = (t: Task) => (
    <TareaItem key={t.id} task={t} listTag={listNameById[t.listId]} hideDueDate onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} activityColor={actColor(t)} activityName={actName(t)} />
  );
  // Secciones "Sin fecha" agrupadas por lista: oculta el icono de lista (ya es la cabecera).
  const renderTaskNoList = (t: Task) => (
    <TareaItem key={t.id} task={t} compact hideListTag onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} activityColor={actColor(t)} activityName={actName(t)} />
  );
  // Espejo de una lista (Hoy vinculado): sin tag de lista (ya están en una sola),
  // modo compacto para respetar la regla de iconos del Principal.
  const renderCompact = (t: Task) => (
    <TareaItem key={t.id} task={t} compact onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} activityColor={actColor(t)} activityName={actName(t)} />
  );
  // Tareas atrasadas: muestra "hace X días" en lugar de la fecha.
  const renderTaskOverdue = (t: Task) => (
    <TareaItem key={t.id} task={t} listTag={listNameById[t.listId]} hideDueDate overdueDays={Math.abs(dayDiff(t.scheduledDate!))} onToggle={onToggleTask} onUpdate={onUpdateTask} onExpand={onExpandTask} activityColor={actColor(t)} activityName={actName(t)} />
  );

  const setHoyLink = (id?: string) => onUpdateList('principal', { hoyListId: id });

  /* ===== MODO NORMAL ===== */
  const renderNormal = () => {
    const today = todayStr();
    const tomorrow = addDaysStr(today, 1);
    const important = pending.filter((t) => t.isImportant);
    const importantDated = important.filter((t) => t.scheduledDate).sort(sortByDateKey('dueDate'));
    const importantNoDate = important.filter((t) => !t.scheduledDate);
    const nonImportant = pending.filter((t) => !t.isImportant);
    const hoyNI = nonImportant.filter((t) => t.scheduledDate === today);
    const mananaNI = nonImportant.filter((t) => t.scheduledDate === tomorrow);
    // Atrasadas = vencidas (dayDiff < 0). Próximamente = futuras más allá de Mañana.
    const beyondNI = nonImportant.filter((t) => t.scheduledDate && dayDiff(t.scheduledDate) !== 0 && dayDiff(t.scheduledDate) !== 1);
    const overdueNI = beyondNI.filter((t) => dayDiff(t.scheduledDate!) < 0).sort(sortByDateKey('dueDate'));
    const upcomingNI = beyondNI.filter((t) => dayDiff(t.scheduledDate!) > 1);
    const upcoming = groupByKey(upcomingNI, 'scheduledDate', false);
    const undatedNI = nonImportant.filter((t) => !t.scheduledDate);
    const undatedByList = new Map<string, Task[]>();
    for (const t of undatedNI) {
      const arr = undatedByList.get(t.listId) ?? [];
      arr.push(t);
      undatedByList.set(t.listId, arr);
    }
    const hasImportant = important.length > 0;
    const hasHoy = hoyNI.length > 0;
    const hasManana = mananaNI.length > 0;
    const hasOverdue = overdueNI.length > 0;
    const hasUpcoming = upcomingNI.length > 0;
    const hasUndated = undatedNI.length > 0;

    return (
      <>
        {hasImportant && (
          <TaskList items={[...importantDated, ...importantNoDate]} render={renderTask} />
        )}

        {hasOverdue && (
          <>
            <GroupHeader title="Atrasado" color="#e53935" />
            <TaskList items={overdueNI} render={renderTaskOverdue} />
          </>
        )}

        {hasHoy && (
          <>
            <DateSectionHeader title="Hoy" />
            <TaskList items={hoyNI} render={renderTaskNoDate} />
          </>
        )}

        {hasManana && (
          <>
            <DateSectionHeader title="Mañana" />
            <TaskList items={mananaNI} render={renderTaskNoDate} />
          </>
        )}

        {hasUpcoming && (
          <>
            {upcoming.map((g) => (
              <div key={g.label}>
                <GroupHeader title={g.label} color={g.color} />
                <TaskList items={g.tasks} render={renderTaskNoDate} />
              </div>
            ))}
          </>
        )}

        {hasUndated && (
          <>
            <DateSectionHeader title="Sin fecha" />
            {Array.from(undatedByList.entries()).map(([listId, ts]) => (
              <div key={listId}>
                <SubLabel label={listNameById[listId] || 'Lista'} />
                <TaskList items={ts} render={renderTaskNoList} />
              </div>
            ))}
          </>
        )}

        {!hasImportant && !hasHoy && !hasManana && !hasOverdue && !hasUpcoming && !hasUndated && (
          <p className="text-center text-[#a0a0a0] text-sm py-10 font-medium">Todo bajo control. Sin tareas pendientes.</p>
        )}
      </>
    );
  };

  /* ===== MODO POR FECHA ===== */
  const renderByDate = () => {
    const today = todayStr();
    const tomorrow = addDaysStr(today, 1);
    const hoyListId = principalList.hoyListId;
    const linkedList = lists.find((l) => l.id === hoyListId && l.id !== 'principal');

    // Tareas con fecha de hoy (de cualquier lista)
    const todayDated = importantFirst(pending.filter((t) => t.scheduledDate === today));
    // Tareas de la lista vinculada sin fecha programada (se muestran después de las de hoy)
    const linkedUndated = linkedList
      ? sortLikeList(pending.filter((t) => t.listId === linkedList.id && !t.scheduledDate), linkedList)
      : [];
    const mananaTasks = importantFirst(pending.filter((t) => t.scheduledDate === tomorrow));
    const beyond = pending.filter((t) => t.scheduledDate && dayDiff(t.scheduledDate) !== 0 && dayDiff(t.scheduledDate) !== 1);
    const overdueTasks = importantFirst(beyond.filter((t) => dayDiff(t.scheduledDate!) < 0).sort(sortByDateKey('dueDate')));
    const upcomingNI = beyond.filter((t) => dayDiff(t.scheduledDate!) > 1);
    const upcoming = groupByKey(upcomingNI, 'scheduledDate', true);
    // Sin fecha: tareas sin scheduledDate, excluyendo las de la lista vinculada (ya están en Hoy)
    const undated = pending.filter((t) => !t.scheduledDate && (!linkedList || t.listId !== linkedList.id));
    const undatedByList = new Map<string, Task[]>();
    for (const t of undated) {
      const arr = undatedByList.get(t.listId) ?? [];
      arr.push(t);
      undatedByList.set(t.listId, arr);
    }

    return (
      <>
        {overdueTasks.length > 0 && (
          <>
            <GroupHeader title="Atrasado" color="#e53935" />
            <TaskList items={overdueTasks} render={renderTaskOverdue} />
          </>
        )}

        <DateSectionHeader
          title="Hoy"
          action={<HoyLinkMenu lists={lists} hoyListId={hoyListId} onLink={setHoyLink} />}
        />
        {todayDated.length > 0 || linkedUndated.length > 0 ? (
          <>
            {todayDated.length > 0 && (
              <TaskList items={todayDated} render={renderTaskNoDate} />
            )}
            {linkedUndated.length > 0 && (
              <TaskList items={linkedUndated} render={renderCompact} />
            )}
          </>
        ) : (
          <p className="text-[13px] text-[#c0c0c0] py-2">Sin tareas para hoy.</p>
        )}

        <DateSectionHeader title="Mañana" />
        {mananaTasks.length > 0 ? (
          <TaskList items={mananaTasks} render={renderTaskNoDate} />
        ) : (
          <p className="text-[13px] text-[#c0c0c0] py-2">Sin tareas para mañana.</p>
        )}

        {upcoming.length > 0 && (
          upcoming.map((g) => (
            <div key={g.label}>
              <GroupHeader title={g.label} color={g.color} />
              <TaskList items={g.tasks} render={renderTaskNoDate} />
            </div>
          ))
        )}

        {undated.length > 0 && (
          <>
            <DateSectionHeader title="Sin fecha" />
            {Array.from(undatedByList.entries()).map(([listId, ts]) => (
              <div key={listId}>
                <SubLabel label={listNameById[listId] || 'Lista'} />
                <TaskList items={ts} render={renderTaskNoList} />
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  /* ===== MODO POR FECHA LÍMITE ===== */
  const renderByDeadline = () => {
    const withDeadline = pending.filter((t) => t.dueDate);
    const noDeadline = pending.filter((t) => !t.dueDate);
    const groups = groupByKey(withDeadline, 'deadline', true);
    const noDeadlineByList = new Map<string, Task[]>();
    for (const t of noDeadline) {
      const arr = noDeadlineByList.get(t.listId) ?? [];
      arr.push(t);
      noDeadlineByList.set(t.listId, arr);
    }

    return (
      <>
        {groups.map((g) => (
          <div key={g.label}>
            <GroupHeader title={g.label} color={g.color} />
            <TaskList items={g.tasks} render={renderTask} />
          </div>
        ))}
        {noDeadline.length > 0 && (
          <>
            <DateSectionHeader title="Sin fecha límite" />
            {Array.from(noDeadlineByList.entries()).map(([listId, ts]) => (
              <div key={listId}>
                <SubLabel label={listNameById[listId] || 'Lista'} />
                <TaskList items={ts} render={renderTask} />
              </div>
            ))}
          </>
        )}
        {withDeadline.length === 0 && noDeadline.length === 0 && (
          <p className="text-center text-[#a0a0a0] text-sm py-10 font-medium">Todo bajo control. Sin tareas pendientes.</p>
        )}
      </>
    );
  };

  return (
    <div className="w-full flex-none shrink-0 box-border px-2 snap-start snap-always h-full overflow-y-auto no-scrollbar pb-[80px]" data-lista="principal">
      <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#f0f0f3] flex flex-col relative">
        {/* Header sticky */}
        <div className="sticky top-0 z-20">
          <div className="absolute -top-1 -left-1 -right-1 h-[50px] bg-[#f7f6f9] z-10" />
          <div className="relative z-20 bg-white rounded-t-[10px] pt-4 px-3.5">
            <div className="flex justify-between items-center mb-4 flex-none">
              <SortMenu value={sortMode} onChange={(m) => onUpdateList('principal', { sortMode: m })} options={PRINCIPAL_SORTS} />
              <h3 className="flex-1 text-center leading-none m-0 p-0 text-[18px] text-[#2b2b2b] font-bold tracking-tight">Principal</h3>
              <div className="w-[36px] flex-none" />
            </div>
            <hr className="border-t border-[#f0f0f5] m-0 mx-1 flex-none" />
          </div>
        </div>

        <div className="flex flex-col px-3.5 pb-3 pt-2">
          {sortMode === 'date' ? renderByDate() : sortMode === 'deadline' ? renderByDeadline() : renderNormal()}
        </div>
      </div>
    </div>
  );
}
