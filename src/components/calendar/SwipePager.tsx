import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';

type Offset = -1 | 0 | 1;

interface Props {
  /** Clave del periodo visible: al cambiar, las páginas se recolocan centradas. */
  pageKey: string;
  onPrev: () => void;
  onNext: () => void;
  renderPage: (offset: Offset) => ReactNode;
  className?: string;
}

/**
 * Ventana deslizante de tres páginas (anterior · actual · siguiente).
 * El contenido sigue al dedo o al cursor como las listas de Tasks: mientras se
 * arrastra se ve entrar el periodo vecino y, al soltar, se asienta en el más
 * cercano y se avisa al padre para cambiar de mes/semana/día.
 */
export function SwipePager({ pageKey, onPrev, onNext, renderPage, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const busy = useRef(false);

  // Ancho de la ventana visible (también sirve para el arrastre)
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Al montar y en cada cambio de periodo, la página central ocupa la ventana
  useLayoutEffect(() => {
    if (width > 0) x.set(-width);
  }, [pageKey, width, x]);

  const settle = useCallback((dir: Offset) => {
    if (!width || busy.current) return;
    if (dir === 0) {
      animate(x, -width, { type: 'spring', stiffness: 520, damping: 46 });
      return;
    }
    busy.current = true;
    animate(x, dir > 0 ? -2 * width : 0, { type: 'spring', stiffness: 420, damping: 42 }).then(() => {
      if (dir > 0) onNext(); else onPrev();
      busy.current = false;
    });
  }, [width, x, onNext, onPrev]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      <motion.div
        drag="x"
        dragConstraints={{ left: -2 * width, right: 0 }}
        dragElastic={0.06}
        dragMomentum={false}
        dragDirectionLock
        style={{ x, width: width * 3 || undefined }}
        onDragEnd={(_, info) => {
          const threshold = width * 0.22;
          if (info.offset.x < -threshold || info.velocity.x < -420) settle(1);
          else if (info.offset.x > threshold || info.velocity.x > 420) settle(-1);
          else settle(0);
        }}
        className="flex items-start"
      >
        {([-1, 0, 1] as Offset[]).map((off) => (
          <div key={off} className="shrink-0" style={{ width: width || '100%' }}>
            {renderPage(off)}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
