import { SlidersHorizontal } from 'lucide-react';
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Trans } from 'app/core/internationalization';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../ui';

export function fitFilters(width: number, sizes: number[], moreWidth: number, gap = 4) {
  if (sizes.reduce((sum, size) => sum + size + gap, -gap) <= width) {
    return sizes.length;
  }
  let used = moreWidth;
  let count = 0;
  for (const size of sizes) {
    if (used + gap + size > width) {
      break;
    }
    used += gap + size;
    count++;
  }
  return count;
}

/** Measure actual controls; leave native variable models as the only selection/URL owners. */
export function WallAdaptiveFilters({ items }: { items: Array<{ key: string; node: ReactNode }> }) {
  const root = useRef<HTMLDivElement>(null);
  const widths = useRef(new Map<string, number>());
  const [count, setCount] = useState(items.length);
  const [open, setOpen] = useState(false);
  const keys = items.map((item) => item.key).join('|');
  useLayoutEffect(() => {
    setCount(items.length);
  }, [keys, items.length]);
  const [revision, update] = useState(0);
  const blurFrame = useRef<number>();
  useEffect(
    () => () => {
      if (blurFrame.current != null) {
        cancelAnimationFrame(blurFrame.current);
      }
    },
    []
  );
  useLayoutEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const measure = () => {
      // Never reparent an active native input, or a variable popup with an uncommitted selection.
      if (open || element.contains(document.activeElement) || element.querySelector('[aria-expanded="true"]')) {
        return;
      }
      element.querySelectorAll<HTMLElement>('[data-filter-key]').forEach((item) => {
        widths.current.set(item.dataset.filterKey!, item.getBoundingClientRect().width);
      });
      const sizes = items.map((item) => widths.current.get(item.key) ?? 180);
      const available = element.getBoundingClientRect().width;
      if (available > 0) {
        const more = element.querySelector('[data-filter-overflow-trigger]')?.getBoundingClientRect().width ?? 86;
        const gap = parseFloat(getComputedStyle(element).columnGap) || 4;
        setCount(fitFilters(available, sizes, more, gap));
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.querySelectorAll<HTMLElement>('[data-filter-key]').forEach((item) => observer.observe(item));
    measure();
    return () => observer.disconnect();
  }, [items, open, revision, count]);
  if (!items.length) {
    return null;
  }
  const visible = typeof ResizeObserver === 'undefined' ? items.length : Math.min(count, items.length);
  const hidden = items.slice(visible);
  return (
    <div
      ref={root}
      className="wall-adaptive-filters"
      onBlur={() => {
        if (blurFrame.current == null) {
          blurFrame.current = requestAnimationFrame(() => {
            blurFrame.current = undefined;
            update((v) => v + 1);
          });
        }
      }}
    >
      {items.slice(0, visible).map((item) => (
        <div className="wall-filter-item" data-filter-key={item.key} key={item.key}>
          {item.node}
        </div>
      ))}
      {hidden.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={<Button className="wall-toolbar-control" />}
            data-filter-overflow-trigger
            aria-label={`추가 필터 ${hidden.length}개`}
          >
            <SlidersHorizontal size={14} />
            <Trans i18nKey="wall.wall-adaptive-filters.text-f53a6e99">필터 </Trans>
            <span>{hidden.length}</span>
          </PopoverTrigger>
          <PopoverContent align="start" aria-label="추가 조회 필터" className="wall-filter-overflow">
            {hidden.map((item) => (
              <div className="wall-filter-item" key={item.key}>
                {item.node}
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
