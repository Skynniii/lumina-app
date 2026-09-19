import { useRef, useLayoutEffect, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Props<T> {
  scrollRef: React.RefObject<HTMLElement | null>;
  items: T[];
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
}

/**
 * Generic windowed list built on @tanstack/react-virtual.
 * Only renders items visible in the scroll container (plus an overscan buffer),
 * dramatically reducing DOM nodes for long lists. Item heights are measured
 * dynamically after mount.
 */
export function VirtualizedList<T>({
  scrollRef,
  items,
  getItemKey,
  renderItem,
  estimateSize = 60,
  overscan = 6,
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Measure the offset of the list container from the top of the scroll
  // content.  The virtualizer needs this to correctly determine which items
  // are visible when the list is not at the very top of the scroll element.
  useLayoutEffect(() => {
    const measure = () => {
      const sc = scrollRef.current;
      const el = containerRef.current;
      if (!sc || !el) return;
      setScrollMargin(el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, [scrollRef]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
    getItemKey: (i: number) => getItemKey(items[i], i),
  });

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualizer.getVirtualItems().map((vi) => (
        <div
          key={vi.key}
          data-index={vi.index}
          ref={virtualizer.measureElement}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${vi.start}px)`,
          }}
        >
          {renderItem(items[vi.index], vi.index)}
        </div>
      ))}
    </div>
  );
}
