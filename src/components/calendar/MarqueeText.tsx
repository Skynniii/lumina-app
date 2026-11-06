import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface Props {
  text: string;
  /** Caja exterior (la que recorta el texto). */
  className?: string;
  /** Tamaño/peso del texto. */
  textClassName?: string;
  textStyle?: CSSProperties;
}

/**
 * Texto de una sola línea. Si no cabe en su hueco se desplaza en bucle hasta
 * mostrar el final y vuelve; si cabe, queda quieto.
 */
export function MarqueeText({ text, className, textClassName, textStyle }: Props) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (!box.current || !inner.current) return;
      const diff = inner.current.scrollWidth - box.current.clientWidth;
      setShift(diff > 1 ? diff : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [text]);

  return (
    <span ref={box} className={`block overflow-hidden min-w-0 ${className ?? ''}`}>
      <span
        ref={inner}
        className={`block whitespace-nowrap ${shift > 0 ? 'marquee-text' : 'truncate'} ${textClassName ?? ''}`}
        style={shift > 0 ? ({ ...textStyle, '--marquee-shift': `-${shift}px` } as CSSProperties) : textStyle}
      >
        {text}
      </span>
    </span>
  );
}
