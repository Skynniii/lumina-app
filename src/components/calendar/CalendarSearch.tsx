import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBackHandler } from '../../hooks/useBackHandler';
import { MONTHS } from '../../hooks/useCalendarEvents';
import { isoToDateKey, todayKey } from '../../hooks/useTimeTracker';
import type { CalendarEvent, Task, TaskList } from '../../types';

export interface SearchPick {
  date: string | null;
  task?: Task;
  event?: CalendarEvent;
}

type Result = SearchPick & {
  id: string;
  title: string;
  subtitle: string;
  kind: 'task' | 'event';
  color: string;
};

interface Props {
  open: boolean;
  tasks: Task[];
  events: CalendarEvent[];
  lists: TaskList[];
  onClose: () => void;
  onPick: (pick: SearchPick) => void;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function dateLabel(key: string | null) {
  if (!key) return 'Sin fecha';
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3).toLowerCase()} ${y}`;
}

/** Fila de un resultado de la búsqueda. */
function ResultRow({ r, onPick }: { r: Result; onPick: (pick: SearchPick) => void }) {
  return (
    <button
      onClick={() => onPick({ date: r.date, task: r.task, event: r.event })}
      className="flex items-center gap-3 w-full text-left bg-white rounded-2xl px-4 py-3 border-none cursor-pointer shadow-[3px_3px_8px_#ececec,-3px_-3px_8px_#ffffff] active:scale-[0.98] transition-transform"
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
      <div className="flex-1 min-w-0">
        <p className={`text-[14px] font-medium m-0 truncate ${r.task?.completed ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>{r.title}</p>
        <p className="text-[11px] text-[#aaa] m-0 truncate">
          {r.kind === 'event' ? 'Evento' : 'Tarea'}{r.subtitle ? ` · ${r.subtitle}` : ''}
        </p>
      </div>
      <span className="text-[11px] font-semibold text-[#999] tabular-nums shrink-0">{dateLabel(r.date)}</span>
    </button>
  );
}

/**
 * Buscador de tareas y eventos del calendario por nombre. Los pendientes y
 * futuros se listan en orden cronológico (los más cercanos primero) y lo ya
 * completado queda contraído, de lo más reciente a lo más antiguo.
 */
export function CalendarSearch({ open, tasks, events, lists, onClose, onPick }: Props) {
  useBackHandler(open, onClose);
  const [query, setQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setShowCompleted(false);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    const pending: Result[] = [];
    const completed: (Result & { completedAt: string })[] = [];
    if (!q) return { pending, completed };

    const listName = (id: string) => lists.find((l) => l.id === id)?.name ?? '';
    const today = todayKey();

    for (const t of tasks) {
      if (t.isSeparator || !t.title || !normalize(t.title).includes(q)) continue;
      const base = {
        id: `t-${t.id}`,
        kind: 'task' as const,
        title: t.title,
        subtitle: listName(t.listId),
        task: t,
        date: t.scheduledDate || t.dueDate || (t.completedAt ? isoToDateKey(t.completedAt) : null),
      };
      if (t.completed) {
        completed.push({ ...base, color: '#34c77b', completedAt: t.completedAt || '' });
      } else {
        pending.push({ ...base, color: '#7f70ff' });
      }
    }

    for (const e of events) {
      if (!e.title || !normalize(e.title).includes(q)) continue;
      pending.push({
        id: `e-${e.id}`,
        kind: 'event',
        title: e.title,
        subtitle: e.location || '',
        color: e.color,
        date: e.date,
        event: e,
      });
    }

    // Pendientes: cronológico, lo más cercano a hoy primero (sin fecha al final)
    const dist = (key: string) => {
      const [y, m, d] = key.split('-').map(Number);
      const day = new Date(y, m - 1, d).getTime();
      const [ty, tm, td] = today.split('-').map(Number);
      return Math.abs(day - new Date(ty, tm - 1, td).getTime());
    };
    pending.sort((a, b) => {
      if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : 0;
      return dist(a.date) - dist(b.date) || a.date.localeCompare(b.date);
    });
    completed.sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    return { pending: pending.slice(0, 40), completed: completed.slice(0, 40) };
  }, [query, tasks, events, lists]);

  const total = results.pending.length + results.completed.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[140] bg-white flex flex-col"
        >
          {/* Cabecera con el campo de búsqueda (deja aire bajo la barra de estado) */}
          <div
            className="shrink-0 px-4 pb-3 flex items-center gap-2 border-b border-[#f0f0f5]"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}
          >
            <button
              onClick={onClose}
              aria-label="Cerrar búsqueda"
              className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center border-none cursor-pointer text-[#666] shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1 flex items-center gap-2 bg-[#f5f5f7] rounded-xl px-3 h-9">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar tareas o eventos"
                className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#333] placeholder:text-[#aaa]"
              />
            </div>
          </div>

          {/* Resultados */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {query.trim() === '' ? (
              <p className="text-[13px] text-[#aaa] m-0 py-2">Escribe el nombre de una tarea o un evento.</p>
            ) : total === 0 ? (
              <p className="text-[13px] text-[#aaa] m-0 py-2">Sin resultados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {results.pending.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#aaa] m-0 px-1 mb-0.5">Pendientes</p>
                    {results.pending.map((r) => <ResultRow key={r.id} r={r} onPick={onPick} />)}
                  </>
                )}

                {results.completed.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-2 w-full mt-2 px-1 py-1.5 border-none bg-transparent cursor-pointer"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#aaa]">Completadas</span>
                      <span className="text-[11px] font-semibold text-[#c0c0c8] tabular-nums">{results.completed.length}</span>
                      <motion.svg
                        animate={{ rotate: showCompleted ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </motion.svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {showCompleted && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden flex flex-col gap-2"
                        >
                          {results.completed.map((r) => <ResultRow key={r.id} r={r} onPick={onPick} />)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
