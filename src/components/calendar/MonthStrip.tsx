import { motion } from 'framer-motion';
import { MONTHS } from '../../hooks/useCalendarEvents';

interface Props {
  anchor: Date;
  onMonthSelect: (year: number, month: number) => void;
}

/** Franja horizontal expandible con meses agrupados por año. */
export function MonthStrip({ anchor, onMonthSelect }: Props) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();

  const years: { year: number; months: number[] }[] = [];
  for (let year = y - 2; year <= y + 1; year++) {
    years.push({ year, months: Array.from({ length: 12 }, (_, i) => i) });
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden border-t border-[#f0f0f5]"
    >
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 py-2.5">
        {years.map(({ year, months }) => (
          <div key={year} className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[#c0c0c8] shrink-0 w-[34px]">{year}</span>
            {months.map((month) => {
              const isSelected = year === y && month === m;
              return (
                <button
                  key={month}
                  onClick={() => onMonthSelect(year, month)}
                  className={`px-2.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap border-none cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#7f70ff] text-white'
                      : 'bg-[#f0f0f5] text-[#666] hover:bg-[#e8e8f0]'
                  }`}
                >
                  {MONTHS[month].slice(0, 3)}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
