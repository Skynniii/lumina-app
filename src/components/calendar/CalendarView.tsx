import { useState } from 'react';
import { TopBar } from '../ui/TopBar';

interface Props {
  onMenuClick: () => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DOW = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function CalendarView({ onMenuClick }: Props) {
  const [month, setMonth] = useState(new Date());
  const y = month.getFullYear();
  const m = month.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  let firstDow = new Date(y, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;

  return (
    <section className="absolute top-0 left-0 w-full h-full p-5 pb-[100px] overflow-y-auto no-scrollbar">
      <TopBar title="Calendar" onMenuClick={onMenuClick} />
      <div className="bg-white rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#f2f2f2] p-5 mt-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(new Date(y, m - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="font-semibold text-[15px] text-[#333]">{MONTHS[m]} {y}</span>
          <button onClick={() => setMonth(new Date(y, m + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f7] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {DOW.map((d) => <span key={d} className="text-[11px] font-bold text-[#aaa] py-1">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const isToday = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` === new Date().toISOString().slice(0, 10);
            return (
              <button key={day} className={`w-9 h-9 mx-auto rounded-full text-[14px] flex items-center justify-center transition-colors ${isToday ? 'bg-[#7f70ff] text-white font-bold' : 'text-[#444] hover:bg-[#f0f0f0]'}`}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
