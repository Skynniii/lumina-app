import { useEffect, useRef } from 'react';
import type { TaskList } from '../../../types';
import { TopBar } from '../../ui/TopBar';

interface Props {
  lists: TaskList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onAddList: () => void;
  onMenuClick: () => void;
}

export function NavTopHeader({ lists, activeListId, onSelectList, onAddList, onMenuClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const metrics = useRef<{ left: number; width: number; top: number; height: number }[]>([]);

  useEffect(() => {
    const visor = document.getElementById('visor-de-listas');
    if (!visor || !containerRef.current) return;
    let ticking = false;

    const measure = () => {
      if (!containerRef.current) return;
      const tabs = containerRef.current.querySelectorAll('.tab-lista');
      metrics.current = Array.from(tabs).map((t) => ({
        left: (t as HTMLElement).offsetLeft,
        width: (t as HTMLElement).offsetWidth,
        top: (t as HTMLElement).offsetTop,
        height: (t as HTMLElement).offsetHeight,
      }));
    };

    const update = () => {
      const vw = visor.offsetWidth;
      if (vw === 0 || metrics.current.length === 0) return;

      let prog = visor.scrollLeft / vw;
      prog = Math.max(0, Math.min(prog, lists.length - 1));
      const base = Math.floor(prog);
      const frac = prog - base;

      const cur = metrics.current[base];
      const next = metrics.current[base + 1];

      let left = 0, width = 0, top = 0, height = 0;
      if (cur && next) {
        left = cur.left + (next.left - cur.left) * frac;
        width = cur.width + (next.width - cur.width) * frac;
        top = cur.top + (next.top - cur.top) * frac;
        height = cur.height + (next.height - cur.height) * frac;
      } else if (cur) {
        left = cur.left; width = cur.width; top = cur.top; height = cur.height;
      }

      if (bubbleRef.current) {
        bubbleRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        bubbleRef.current.style.width = `${width}px`;
        bubbleRef.current.style.height = `${height}px`;
      }
      if (lineRef.current) {
        lineRef.current.style.transform = `translate3d(${left}px, 0, 0)`;
        lineRef.current.style.width = `${width}px`;
      }

      const center = left + width / 2;
      containerRef.current!.scrollLeft = center - containerRef.current!.offsetWidth / 2;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    };

    const onResize = () => { measure(); update(); };
    const init = setTimeout(() => { measure(); update(); }, 50);

    visor.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(init);
      visor.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [lists.length]);

  return (
    <div className="relative w-full bg-white z-[999] pb-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)] shrink-0 box-border">
      <TopBar title="Tasks" onMenuClick={onMenuClick} />

      <div className="relative">
        <div ref={containerRef} className="flex gap-3 overflow-x-auto pt-1 px-4 pb-3 relative z-10 no-scrollbar">
          <div ref={bubbleRef} className="absolute left-0 top-0 bg-[#7f70ff] rounded-[20px] shadow-[2px_4px_10px_rgba(127,112,255,0.2)] -z-10 pointer-events-none transform-gpu will-change-transform" />

          {lists.map((list) => (
            <button
              key={list.id}
              className="tab-lista relative px-4 py-2 rounded-[20px] text-sm font-medium whitespace-nowrap cursor-pointer select-none z-10 transition-colors duration-200"
              style={{ color: activeListId === list.id ? '#ffffff' : '#666666' }}
              onClick={() => onSelectList(list.id)}
            >
              {list.name}
            </button>
          ))}

          <button onClick={onAddList} className="relative px-4 py-2 rounded-[20px] text-sm font-medium whitespace-nowrap cursor-pointer select-none z-10 bg-[rgba(127,112,255,0.03)] border border-dashed border-[#7f70ff] text-[#7f70ff]">
            + New list
          </button>

          <div ref={lineRef} className="absolute left-0 bottom-0 h-[3px] bg-[#7f70ff] rounded-t-[3px] z-20 pointer-events-none transform-gpu will-change-transform" />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#eaeaea] z-0" />
      </div>
    </div>
  );
}
