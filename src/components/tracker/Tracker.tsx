import { TopBar } from '../ui/TopBar';

interface Props {
  onMenuClick: () => void;
}

export function Tracker({ onMenuClick }: Props) {
  return (
    <section className="absolute top-0 left-0 w-full h-full p-5 pb-[100px] overflow-y-auto no-scrollbar">
      <TopBar title="Tracker" onMenuClick={onMenuClick} />
      <div className="mt-5 flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[#f0edff] flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7f70ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
        </div>
        <p className="text-[16px] font-semibold text-[#555]">Tracker</p>
        <p className="text-[14px] text-[#999] mt-1">Aquí verás el seguimiento de tus actividades</p>
      </div>
    </section>
  );
}
