import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';

const HOUR_H = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_COL = 38;

interface Props {
  days: string[];                     // 1 = vista de día, 7 = vista de semana
  itemsByDate: Map<string, CalendarItem[]>;
  onSelectItem: (i: CalendarItem) => void;
  detailed?: boolean;
  /** La fila "todo el día" se omite en la vista de día (ya está en la cabecera). */
  showAllDay?: boolean;
}

/** Distribuye los ítems con hora en "carriles" para que los solapados no se tapen. */
function layout(items: CalendarItem[]) {
  const timed = items
    .filter((i) => i.startMin !== undefined)
    .map((i) => ({
      it: i,
      start: i.startMin!,
      end: Math.max(i.endMin ?? i.startMin! + 30, i.startMin! + 12),
    }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const laneEnds: number[] = [];
  const blocks = timed.map((t) => {
    let lane = laneEnds.findIndex((end) => end <= t.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(t.end);
    } else {
      laneEnds[lane] = t.end;
    }
    return { ...t, lane };
  });

  return { blocks, laneCount: Math.max(1, laneEnds.length) };
}

/**
 * Rejilla horaria a ancho completo (sin tarjeta). Con varios días funciona como
 * vista de semana (columnas compactas por color) y con un día como vista de día.
 */
export function TimeGrid({ days, itemsByDate, onSelectItem, detailed = false, showAllDay = true }: Props) {
  const { settings } = useSettings();
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [now, setNow] = useState(() => new Date());

  // Cada minuto para la línea de "ahora"
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  const colTemplate = `${TIME_COL}px repeat(${days.length}, minmax(0, 1fr))`;
  const showsToday = days.includes(today);
  const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_H;

  const allDayByDay = days.map((d) => (itemsByDate.get(d) ?? []).filter((i) => i.startMin === undefined));
  const hasAllDay = showAllDay && allDayByDay.some((a) => a.length > 0);
  const allDayMax = detailed ? 3 : 4;

  /** Etiqueta de la hora según el formato elegido en ajustes (12h / 24h). */
  const hourLabel = (h: number) =>
    settings.timeFormat === '24h'
      ? `${String(h).padStart(2, '0')}:00`
      : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;

  return (
    <div className="bg-white">
      {/* Fila "todo el día": lo que no tiene hora (tareas sin hora, completadas…) */}
      {hasAllDay && (
        <div className="grid border-b border-[#f0f0f5]" style={{ gridTemplateColumns: colTemplate }}>
          <div className="flex items-center justify-end pr-1 text-[8px] font-semibold text-[#aaa] leading-tight text-right">Todo el día</div>
          {allDayByDay.map((arr, i) => (
            <div key={days[i]} className="border-l border-[#f2f2f5] p-1 flex flex-col gap-[3px] min-w-0">
              {arr.slice(0, allDayMax).map((it) =>
                detailed ? (
                  <button
                    key={it.id}
                    onClick={() => onSelectItem(it)}
                    className="text-left rounded-md px-1.5 py-0.5 border-none cursor-pointer truncate"
                    style={{ background: `${it.color}22`, borderLeft: `3px solid ${it.color}` }}
                  >
                    <span className={`text-[11px] font-medium ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>{it.title}</span>
                  </button>
                ) : (
                  <button
                    key={it.id}
                    onClick={() => onSelectItem(it)}
                    aria-label={it.title}
                    className="h-[6px] w-full rounded-full border-none cursor-pointer p-0"
                    style={{ background: it.color }}
                  />
                )
              )}
              {arr.length > allDayMax && <span className="text-[9px] text-[#999] text-center leading-none">+{arr.length - allDayMax}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Rejilla horaria */}
      <div className="relative">
        <div className="relative" style={{ height: HOUR_H * 24 }}>
          {HOURS.map((h) => (
            <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: h * HOUR_H, height: HOUR_H }}>
              <span className="w-[38px] shrink-0 text-[9px] text-[#bbb] tabular-nums text-right pr-1 -mt-[5px]">{hourLabel(h)}</span>
              <div className="flex-1 border-t border-[#f2f2f5]" />
            </div>
          ))}

          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: colTemplate }}>
            <div />
            {days.map((d) => {
              const { blocks, laneCount } = layout(itemsByDate.get(d) ?? []);
              const colW = 100 / laneCount;
              return (
                <div key={d} className="relative border-l border-[#f2f2f5]">
                  {blocks.map(({ it, lane, start, end }) => {
                    const top = (start / 60) * HOUR_H;
                    const height = Math.max(detailed ? 28 : 18, ((end - start) / 60) * HOUR_H);
                    return (
                      <motion.button
                        key={it.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => onSelectItem(it)}
                        className="absolute rounded-md overflow-hidden text-left px-1.5 py-0.5 border-none cursor-pointer"
                        style={{
                          top, height,
                          left: `calc(${lane * colW}% + 2px)`,
                          width: `calc(${colW}% - 4px)`,
                          background: `${it.color}22`,
                          borderLeft: `3px solid ${it.color}`,
                        }}
                      >
                        {detailed && (
                          <>
                            <span className={`block text-[11px] font-semibold truncate leading-tight ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>{it.title}</span>
                            {height >= 40 && (
                              <span className="block text-[10px] text-[#888] tabular-nums leading-tight truncate">
                                {formatEventTime(minToHHMM(start), settings.timeFormat)} – {formatEventTime(minToHHMM(end), settings.timeFormat)}
                              </span>
                            )}
                          </>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Línea de la hora actual */}
          {showsToday && (
            <div className="absolute right-0 pointer-events-none z-10" style={{ top: nowTop, left: TIME_COL }}>
              <div className="relative h-0 border-t-[1.5px] border-[#ff4d4d]">
                <span className="absolute -left-[3px] -top-[3.5px] w-[7px] h-[7px] rounded-full bg-[#ff4d4d]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
