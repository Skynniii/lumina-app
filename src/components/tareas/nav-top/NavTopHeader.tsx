import { useEffect, useRef } from 'react';
import type { TaskList } from '../../../types';

interface NavTopHeaderProps {
  lists: TaskList[];
  activeListId: string;
  onSelectList: (id: string) => void;
  onAddList: () => void;
}

export const NavTopHeader = ({ 
  lists, 
  activeListId, 
  onSelectList, 
  onAddList 
}: NavTopHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<{left: number, width: number, top: number, height: number}[]>([]);

  useEffect(() => {
    const visor = document.getElementById('visor-de-listas');
    if (!visor || !containerRef.current) return;

    let ticking = false;

    const updateMetrics = () => {
      if (!containerRef.current) return;
      const tabs = containerRef.current.querySelectorAll('.tab-lista');
      metricsRef.current = Array.from(tabs).map(tab => ({
        left: (tab as HTMLElement).offsetLeft,
        width: (tab as HTMLElement).offsetWidth,
        top: (tab as HTMLElement).offsetTop,
        height: (tab as HTMLElement).offsetHeight,
      }));
    };

    const updateGeometry = () => {
      const anchoVisor = visor.offsetWidth;
      if (anchoVisor === 0 || metricsRef.current.length === 0) return;

      let progresoContinuo = visor.scrollLeft / anchoVisor;
      progresoContinuo = Math.max(0, Math.min(progresoContinuo, lists.length - 1));

      const baseIndex = Math.floor(progresoContinuo);
      const fraccion = progresoContinuo - baseIndex;

      const metrics = metricsRef.current;
      const tabActual = metrics[baseIndex];
      const tabSiguiente = metrics[baseIndex + 1];

      let left = 0, width = 0, top = 0, height = 0;

      if (tabActual && tabSiguiente) {
        left = tabActual.left + (tabSiguiente.left - tabActual.left) * fraccion;
        width = tabActual.width + (tabSiguiente.width - tabActual.width) * fraccion;
        top = tabActual.top + (tabSiguiente.top - tabActual.top) * fraccion;
        height = tabActual.height + (tabSiguiente.height - tabActual.height) * fraccion;
      } else if (tabActual) {
        left = tabActual.left;
        width = tabActual.width;
        top = tabActual.top;
        height = tabActual.height;
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

      const centroTarget = left + (width / 2);
      const scrollDestino = centroTarget - (containerRef.current!.offsetWidth / 2);
      containerRef.current!.scrollLeft = scrollDestino;
    };

    const handleResize = () => {
      updateMetrics();
      updateGeometry();
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateGeometry();
          ticking = false;
        });
        ticking = true;
      }
    };

    const initTimeout = setTimeout(() => {
      updateMetrics();
      updateGeometry();
    }, 50);

    visor.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initTimeout);
      visor.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [lists.length]);

  return (
    <div className="relative w-full bg-white z-[999] pt-[15px] pb-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)] shrink-0 box-border">
      <h1 className="text-center my-2.5 mx-0 w-full text-[#2b2b2b] font-bold text-2xl">Tasks</h1>
      
      <div className="relative">
        <div 
          ref={containerRef}
          className="flex gap-3 overflow-x-auto pt-1 px-4 pb-3 relative z-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div 
            ref={bubbleRef} 
            className="absolute left-0 top-0 bg-[#7f70ff] rounded-[20px] shadow-[2px_4px_10px_rgba(127,112,255,0.2)] -z-10 pointer-events-none transition-none transform-gpu will-change-transform" 
          />
          
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
          
          <button
            onClick={onAddList}
            className="relative px-4 py-2 rounded-[20px] text-sm font-medium whitespace-nowrap cursor-pointer select-none z-10 bg-[rgba(127,112,255,0.03)] border border-dashed border-[#7f70ff] text-[#7f70ff]"
          >
            + New list
          </button>

          <div 
            ref={lineRef} 
            className="absolute left-0 bottom-0 h-[3px] bg-[#7f70ff] rounded-t-[3px] z-20 pointer-events-none transition-none transform-gpu will-change-transform" 
          />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#eaeaea] z-0" />
      </div>
    </div>
  );
};