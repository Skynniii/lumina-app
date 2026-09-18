import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatElapsed, formatClock, isoToDateKey, dayLabel } from '../../hooks/useTimeTracker';
import {
  formatDuration, getActivityTasks, getTimeByTasks, type ActivityStats,
} from './trackerUtils';
import { ConsistencyGraph } from './ConsistencyGraph';
import { ActivityTrendStats } from './ActivityTrendStats';
import type { Activity, TimeSession, Task } from '../../types';

interface Props {
  activity: Activity;
  stat: ActivityStats;
  sessions: TimeSession[];
  tasks: Task[];
  onBack: () => void;
}

type Tab = 'resumen' | 'tareas' | 'estadisticas' | 'registros';

const TABS: { key: Tab; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'tareas', label: 'Tareas' },
  { key: 'estadisticas', label: 'Estadísticas' },
  { key: 'registros', label: 'Registros' },
];

export function ActivityDetailModal({ activity, stat, sessions, tasks, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('resumen');

  const actSessions = sessions
    .filter((s) => s.activityId === activity.id)
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  const actTasks = getActivityTasks(tasks, activity.id);
  const completedTasks = actTasks.filter((t) => t.completed);
  const pendingTasks = actTasks.filter((t) => !t.completed);
  const timeByTasks = getTimeByTasks(sessions, tasks, activity.id);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[1500] bg-[#f7f6f9] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 shrink-0">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors active:scale-90 border-none bg-transparent cursor-pointer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: activity.color }} />
          <h1 className="text-[20px] font-bold text-[#333] m-0">{activity.name}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-2 shrink-0">
        <div className="flex gap-1 bg-[#eeeaf6] rounded-full p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-2 py-2 rounded-full text-[13px] font-semibold border-none cursor-pointer transition-all ${
                tab === t.key ? 'bg-white text-[#333] shadow-[2px_2px_6px_#e0e0e0,-2px_-2px_6px_#ffffff]' : 'text-[#999] bg-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4 mt-3"
          >
            {/* ===== RESUMEN ===== */}
            {tab === 'resumen' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1">
                    <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wide m-0">Tiempo</p>
                    <p className="text-[18px] font-bold text-[#333] tabular-nums leading-none m-0">{formatDuration(stat.totalSeconds)}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1">
                    <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wide m-0">Sesiones</p>
                    <p className="text-[18px] font-bold text-[#333] tabular-nums leading-none m-0">{stat.sessionCount}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl shadow-[4px_4px_10px_#e6e6e6,-4px_-4px_10px_#ffffff] flex flex-col gap-1">
                    <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wide m-0">Promedio</p>
                    <p className="text-[18px] font-bold text-[#333] tabular-nums leading-none m-0">{formatDuration(stat.avgSeconds)}</p>
                  </div>
                </div>

                {/* Tiempo por tarea (top 5) */}
                {timeByTasks.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-px bg-[#eceaf3]" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Tiempo por tarea</span>
                      <div className="flex-1 h-px bg-[#eceaf3]" />
                    </div>
                    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
                      {timeByTasks.slice(0, 5).map((t, i) => {
                        const maxTaskTime = Math.max(...timeByTasks.map((x) => x.totalSeconds), 1);
                        const pct = (t.totalSeconds / maxTaskTime) * 100;
                        return (
                          <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-[#333] truncate m-0">{t.taskName}</p>
                              <div className="h-1 rounded-full bg-[#f0f0f0] overflow-hidden mt-1.5">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: activity.color }} />
                              </div>
                            </div>
                            <span className="text-[13px] font-semibold text-[#555] tabular-nums shrink-0">{formatDuration(t.totalSeconds)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Últimas 3 sesiones */}
                {actSessions.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-px bg-[#eceaf3]" />
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0]">Últimas sesiones</span>
                      <div className="flex-1 h-px bg-[#eceaf3]" />
                    </div>
                    <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
                      {actSessions.slice(0, 3).map((s, i) => (
                        <div key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#333] truncate m-0">{s.description || 'Sin descripción'}</p>
                            <p className="text-[11px] text-[#999] m-0 mt-0.5">{dayLabel(isoToDateKey(s.startTime))} · {formatClock(s.startTime)} – {formatClock(s.endTime)}</p>
                          </div>
                          <span className="text-[14px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.duration)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {actTasks.length === 0 && actSessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-[15px] font-semibold text-[#555] m-0">Sin datos para esta actividad</p>
                    <p className="text-[13px] text-[#999] m-0">Registra tiempo o vincula tareas a esta actividad</p>
                  </div>
                )}
              </>
            )}

            {/* ===== TAREAS ===== */}
            {tab === 'tareas' && (
              <>
                {actTasks.length > 0 ? (
                  <>
                    {pendingTasks.length > 0 && (
                      <>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0] m-0">Pendientes ({pendingTasks.length})</p>
                        <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
                          {pendingTasks.map((t, i) => (
                            <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid #d1d1d6` }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-medium text-[#333] truncate m-0">{t.title}</p>
                                {t.totalTimeSpent != null && t.totalTimeSpent > 0 && (
                                  <p className="text-[11px] text-[#999] m-0 mt-0.5">{formatDuration(t.totalTimeSpent)} registrados</p>
                                )}
                              </div>
                              {t.isImportant && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffcc00" stroke="#ffcc00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {completedTasks.length > 0 && (
                      <>
                        <p className="text-[12px] font-bold uppercase tracking-wider text-[#a0a0a0] m-0">Completadas ({completedTasks.length})</p>
                        <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
                          {completedTasks.map((t, i) => (
                            <div key={t.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: activity.color }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-medium text-[#a0a0a0] line-through truncate m-0">{t.title}</p>
                                {t.totalTimeSpent != null && t.totalTimeSpent > 0 && (
                                  <p className="text-[11px] text-[#999] m-0 mt-0.5">{formatDuration(t.totalTimeSpent)} registrados</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-[15px] font-semibold text-[#555] m-0">Sin tareas vinculadas</p>
                    <p className="text-[13px] text-[#999] m-0">Vincula tareas a esta actividad para verlas aquí</p>
                  </div>
                )}
              </>
            )}

            {/* ===== ESTADÍSTICAS ===== */}
            {tab === 'estadisticas' && (
              <>
                <ActivityTrendStats sessions={sessions} activity={activity} />
                <ConsistencyGraph sessions={sessions} activity={activity} />
              </>
            )}

            {/* ===== REGISTROS ===== */}
            {tab === 'registros' && (
              <>
                {actSessions.length > 0 ? (
                  <div className="bg-white rounded-[24px] shadow-[6px_6px_12px_#e6e6e6,-6px_-6px_12px_#ffffff] overflow-hidden">
                    {actSessions.map((s, i) => (
                      <div key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-[#f2f2f2]' : ''}`}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: activity.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-[#333] truncate m-0">{s.description || 'Sin descripción'}</p>
                          <p className="text-[12px] text-[#999] m-0 mt-0.5">{dayLabel(isoToDateKey(s.startTime))} · {formatClock(s.startTime)} – {formatClock(s.endTime)}</p>
                        </div>
                        <span className="text-[15px] font-semibold text-[#555] tabular-nums shrink-0">{formatElapsed(s.duration)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <p className="text-[15px] font-semibold text-[#555] m-0">Sin sesiones registradas</p>
                    <p className="text-[13px] text-[#999] m-0">Inicia un contador para esta actividad</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
