import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Task, TaskList } from '../../types';
import { TareaItem } from './TareaItem';

interface Props {
  lists: TaskList[];
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onExpandTask: (id: string) => void;
}

const UPCOMING_DAYS = 7;

function dayDiff(dateStr: string): number {
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - todayUTC) / 86400000);
}

function dateLabel(dateStr: string): string {
  const diff = dayDiff(dateStr);
  if (diff < 0) return 'Atrasado';
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function GroupHeader({ title, color }: { title: string; color?: string }) {
  return (
    <motion.p
      layout
      className={`pt-4 first:pt-1 pb-1.5 text-[12px] font-bold uppercase tracking-wider ${color ? '' : 'text-[#a0a0a0]'}`}
      style={color ? { color } : undefined}
    >
      {title}
    </motion.p>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 first:mt-1">
      <div className="flex-1 h-px bg-[#eceaf3]" />
      <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0] whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[#eceaf3]" />
    </div>
  );
}

function TaskList({ items, render }: { items: Task[]; render: (t: Task) => ReactNode }) {
  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1.5 relative">
      <AnimatePresence mode="popLayout">
        {items.map(render)}
      </AnimatePresence>
    </ul>
  );
}

/**
 * Vista dinámica "Principal": agrega tareas de TODAS las listas para mostrar
 * lo más relevante al abrir la app. No es una lista: es un resumen inteligente.
 *  - Sección "Importante": tareas marcadas como importantes (sin completar),
 *    ordenadas por fecha. Si hay mezcla de con/sin fecha, separa con "Sin fecha".
 *  - Divisor "Próximamente" entre Importante y las fechas (solo si hay ambos).
 *  - Sección de fechas: tareas con fecha en los próximos 7 días (o atrasadas),
 *    agrupadas por día. Se excluyen las importantes para no duplicar.
 *  - Sin sección de completadas: es una vista de "lo pendiente".
 */
export function PrincipalView({ lists, tasks, onToggleTask, onUpdateTask, onExpandTask }: Props) {
  const listNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const l of lists) m[l.id] = l.name;
    return m;
  }, [lists]);

  const { importantDated, importantNoDate, upcomingGroups } = useMemo(() => {
    const pending = tasks.filter((t) => !t.completed);

    const important = pending
      .filter((t) => t.isImportant)
      .sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31'));
    const importantDated = important.filter((t) => t.dueDate);
    const importantNoDate = important.filter((t) => !t.dueDate);

    const upcoming = pending
      .filter((t) => !t.isImportant && t.dueDate)
      .filter((t) => dayDiff(t.dueDate!) <= UPCOMING_DAYS)
      .sort((a, b) => (a.dueDate!).localeCompare(b.dueDate!));

    const groups: { label: string; color?: string; tasks: Task[] }[] = [];
    for (const t of upcoming) {
      const label = dateLabel(t.dueDate!);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.tasks.push(t);
      else groups.push({ label, color: label === 'Atrasado' ? '#e53935' : undefined, tasks: [t] });
    }
    return { importantDated, importantNoDate, upcomingGroups: groups };
  }, [tasks]);

  const hasImportant = importantDated.length > 0 || importantNoDate.length > 0;
  const hasUpcoming = upcomingGroups.length > 0;
  const hasContent = hasImportant || hasUpcoming;

  const renderTask = (t: Task) => (
    <TareaItem
      key={t.id}
      task={t}
      listTag={listNameById[t.listId]}
      onToggle={onToggleTask}
      onUpdate={onUpdateTask}
      onExpand={onExpandTask}
    />
  );

  return (
    <div className="w-full flex-none shrink-0 box-border px-4 snap-start snap-always h-full overflow-y-auto no-scrollbar pb-[130px]" data-lista="principal">
      <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#f2f2f2] flex flex-col relative">
        {/* Header sticky */}
        <div className="sticky top-0 z-20">
          <div className="absolute -top-1 -left-1 -right-1 h-[50px] bg-[#f7f6f9] z-10" />
          <div className="relative z-20 bg-white rounded-t-[24px] pt-5 px-5">
            <div className="flex justify-center items-center mb-4 flex-none h-[24px]">
              <h3 className="text-center leading-none m-0 p-0 text-[22px] text-[#2b2b2b] font-bold tracking-tight">Principal</h3>
            </div>
            <hr className="border-t border-[#f0f0f5] m-0 mx-1 flex-none" />
          </div>
        </div>

        <div className="flex flex-col px-5 pb-5 pt-3">
          {/* Sección Importante */}
          {hasImportant && (
            <>
              <GroupHeader title="Importante" color="#eab308" />
              {importantDated.length > 0 && <TaskList items={importantDated} render={renderTask} />}
              {importantNoDate.length > 0 && (
                <>
                  {importantDated.length > 0 && (
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#b8b8b8] pt-3 pb-1">Sin fecha</p>
                  )}
                  <TaskList items={importantNoDate} render={renderTask} />
                </>
              )}
            </>
          )}

          {/* Divisor Próximamente entre Importante y las fechas */}
          {hasImportant && hasUpcoming && <Divider label="Próximamente" />}

          {/* Secciones por fecha */}
          {upcomingGroups.map((g) => (
            <div key={g.label}>
              <GroupHeader title={g.label} color={g.color} />
              <TaskList items={g.tasks} render={renderTask} />
            </div>
          ))}

          {!hasContent && (
            <p className="text-center text-[#a0a0a0] text-sm py-10 font-medium">Todo bajo control. Sin tareas próximas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
