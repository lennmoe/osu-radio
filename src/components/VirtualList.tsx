'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  estimateSize: number;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  paddingStart?: number;
  paddingEnd?: number;
  /** Scroll back to the top whenever this changes (e.g. switching views). */
  resetKey?: string;
}

/** Only mounts the visible rows — libraries routinely hold thousands of maps. */
export function VirtualList<T>({
  items,
  estimateSize,
  getKey,
  renderItem,
  className,
  paddingStart = 0,
  paddingEnd = 0,
  resetKey,
}: VirtualListProps<T>): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    getItemKey: (i) => getKey(items[i], i),
    overscan: 10,
    paddingStart,
    paddingEnd,
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [resetKey]);

  return (
    <div ref={scrollRef} className={className}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            ref={virtualizer.measureElement}
            data-index={row.index}
            className="absolute left-0 top-0 w-full"
            style={{ transform: `translateY(${row.start}px)` }}
          >
            {renderItem(items[row.index], row.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
