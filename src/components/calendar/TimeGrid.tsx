import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import { formatEventTime } from '../../hooks/useCalendarEvents';
import { minToHHMM, type CalendarItem } from '../../hooks/useCalendarData';

const HOUR_H = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_COL = 40;

interface Props {
  days: string[];                     // 1 = vista de día, 7 = vista de semana
  itemsByDate: Map<string, CalendarItem[]>;
  /** Registros de tiempo: se pintan dentro de su rango horario real. */
  sessionItemsByDate?: Map<string, CalendarItem[]>;
  onSelectItem: (i: CalendarItem) => void;
  detailed?: boolean;
}

const ClockGlyph = ({ color }: { color: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </svg>
);

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
 * Rejilla horaria a ancho completo: una caja blanca de esquinas redondeadas por
 * hora y día (como en la referencia), con la línea de la hora actual solo en la
 * columna del día de hoy.
 */
export function TimeGrid({ days, itemsByDate, sessionItemsByDate, onSelectItem, detailed = false }: Props) {
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

  /** Etiqueta de la hora según el formato elegido en ajustes (12h / 24h). */
  const hourLabel = (h: number) =>
    settings.timeFormat === '24h'
      ? `${String(h).padStart(2, '0')}:00`
      : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;

  return (
    <div className="bg-[#f2f1f6]">
      <div className="relative" style={{ height: HOUR_H * 24 }}>
        {/* Franjas: una caja blanca redondeada por hora y día */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute inset-x-0 grid gap-x-[3px] px-1"
            style={{ top: h * HOUR_H, height: HOUR_H, gridTemplateColumns: colTemplate }}
          >
            <span className="flex items-start justify-end pr-1.5 pt-[7px] text-[10px] font-semibold text-[#555] tabular-nums">
              {hourLabel(h)}
            </span>
            {days.map((d) => (
              <div key={d} className="my-[2px] rounded-[6px] bg-white" />
            ))}
          </div>
        ))}

        {/* Contenido: ítems con hora por columna */}
        <div className="absolute inset-0 grid gap-x-[3px] px-1" style={{ gridTemplateColumns: colTemplate }}>
          <div />
          {days.map((d) => {
            const dayItems = [...(itemsByDate.get(d) ?? []), ...(sessionItemsByDate?.get(d) ?? [])];
            const { blocks, laneCount } = layout(dayItems);
            const colW = 100 / laneCount;
            return (
              <div key={d} className="relative">
                {blocks.map(({ it, lane, start, end }) => {
                  const top = (start / 60) * HOUR_H;
                  const height = Math.max(detailed ? 28 : 18, ((end - start) / 60) * HOUR_H);
                  const isSession = it.kind === 'session';
                  return (
                    <motion.button
                      key={it.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => onSelectItem(it)}
                      className="absolute rounded-lg overflow-hidden text-left px-1.5 py-0.5 border-none cursor-pointer"
                      style={{
                        top, height,
                        left: `calc(${lane * colW}% + 2px)`,
                        width: `calc(${colW}% - 4px)`,
                        background: isSession ? `${it.color}1c` : `${it.color}22`,
                        borderLeft: `3px solid ${it.color}`,
                      }}
                    >
                      <span className="flex items-start gap-1 min-w-0">
                        {isSession && <span className="mt-[1px]"><ClockGlyph color={it.color} /></span>}
                        {detailed && (
                          <span className="flex-1 min-w-0">
                            <span className={`block text-[11px] font-semibold truncate leading-tight ${it.kind === 'completed' ? 'text-[#a0a0a0] line-through' : 'text-[#333]'}`}>{it.title}</span>
                            {height >= 40 && (
                              <span className="block text-[10px] text-[#888] tabular-nums leading-tight truncate">
                                {formatEventTime(minToHHMM(start), settings.timeFormat)} – {formatEventTime(minToHHMM(end), settings.timeFormat)}
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}

                {/* Línea de la hora actual: solo en la columna del día de hoy */}
                {showsToday && d === today && (
                  <div className="absolute left-0 right-0 pointer-events-none z-20" style={{ top: nowTop }}>
                    <div className="relative border-t-2 border-[#ff3b30]">
                      <span className="absolute -left-[3px] -top-[5px] w-[8px] h-[8px] rounded-full bg-[#ff3b30] shadow-[0_0_4px_rgba(255,59,48,0.6)]" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
