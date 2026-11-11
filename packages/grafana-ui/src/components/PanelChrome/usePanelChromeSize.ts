import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useMeasure } from 'react-use';

interface ViewportSize {
  width: number;
  height: number;
  contentWidth: number;
}

/** Fill frames and their native visualization must consume the same paint's size.
 * The upstream Scenes measurement is allowed to arrive later. Observe only the
 * host-sized frame, never a chart or legend whose intrinsic size could feed back.
 */
export function usePanelChromeSize(fill: boolean) {
  const [legacyRef, legacySize] = useMeasure<HTMLElement>();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>();
  const current = useRef<ViewportSize>();
  const ref = useCallback(
    (element: HTMLElement | null) => {
      setHost(element);
      legacyRef(fill ? null! : element!);
    },
    [fill, legacyRef]
  );
  useLayoutEffect(() => {
    if (!fill || !host) {
      current.current = undefined;
      setViewport(undefined);
      return;
    }
    let disposed = false;
    const measure = (synchronous: boolean, contentWidth?: number) => {
      if (disposed) {
        return;
      }
      const { width, height } = host.getBoundingClientRect();
      if (width <= 0 || height <= 0) {
        return;
      }
      const next = { width, height, contentWidth: contentWidth ?? host.clientWidth };
      const previous = current.current;
      if (previous?.width === width && previous.height === height && previous.contentWidth === next.contentWidth) {
        return;
      }
      current.current = next;
      if (synchronous) {
        // ResizeObserver runs before paint, outside the React render lifecycle.
        flushSync(() => setViewport(next));
      } else {
        setViewport(next);
      }
    };
    measure(false);
    const observer = new ResizeObserver(([entry]) => measure(true, entry?.contentRect.width));
    observer.observe(host);
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [fill, host]);
  return {
    ref,
    viewport: fill ? viewport : undefined,
    loadingBarWidth: fill ? (viewport?.contentWidth ?? 0) : legacySize.width,
  };
}
