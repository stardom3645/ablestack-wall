import { css, cx } from '@emotion/css';
import { HTMLAttributes, useEffect, useRef } from 'react';

export const panelScrollTokens = { rail: 6, clearance: 16, minimumMeterRow: 44, settle: 700 };

/** Native input and scroll position remain owned by the existing viewport. */
export function usePanelScrollActivity(getViewport: () => HTMLElement | null | undefined, enabled = true) {
  const get = useRef(getViewport);
  get.current = getViewport;
  useEffect(() => {
    const view = get.current();
    if (!enabled || !view) {
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      view.dataset.panelOverflow = String(view.scrollHeight > view.clientHeight || view.scrollWidth > view.clientWidth);
    };
    const scroll = () => {
      update();
      view.dataset.panelScrolling = 'true';
      clearTimeout(timer);
      timer = setTimeout(() => delete view.dataset.panelScrolling, panelScrollTokens.settle);
    };
    const observer = new ResizeObserver(update);
    const observe = () => {
      observer.disconnect();
      observer.observe(view);
      Array.from(view.children).forEach((child) => observer.observe(child));
      update();
    };
    const mutation = new MutationObserver(observe);
    mutation.observe(view, { childList: true });
    observe();
    view.addEventListener('scroll', scroll, { passive: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutation.disconnect();
      view.removeEventListener('scroll', scroll);
      delete view.dataset.panelScrolling;
      delete view.dataset.panelOverflow;
    };
  }, [enabled]);
}

/** Shared paint for both native lists and the existing CustomScrollbar tracks. */
export const panelScrollClass = css({
  '--panel-scroll-idle': 'rgba(125,135,150,.18)',
  '--panel-scroll-active': 'rgba(125,135,150,.55)',
  scrollbarWidth: 'thin',
  scrollbarColor: 'var(--panel-scroll-idle) transparent',
  overscrollBehavior: 'contain',
  '&:hover, &:focus-within, &[data-panel-scrolling]': {
    scrollbarColor: 'var(--panel-scroll-active) transparent',
  },
  '&::-webkit-scrollbar': { width: panelScrollTokens.rail, height: panelScrollTokens.rail },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: 'var(--panel-scroll-idle)', borderRadius: panelScrollTokens.rail },
  '&:hover::-webkit-scrollbar-thumb, &:focus-within::-webkit-scrollbar-thumb, &[data-panel-scrolling]::-webkit-scrollbar-thumb':
    {
      background: 'var(--panel-scroll-active)',
    },
  '&& .track-vertical': { width: `${panelScrollTokens.rail}px !important`, right: 2 },
  '&& .track-horizontal': { height: `${panelScrollTokens.rail}px !important`, bottom: 2 },
  '&& .thumb-vertical, & .thumb-horizontal': {
    background: 'var(--panel-scroll-active)',
    opacity: 0.18,
    transition: 'opacity var(--wall-motion-feedback-duration,150ms) var(--wall-motion-feedback-easing,ease-out)',
  },
  '&&:hover .thumb-vertical, &&:hover .thumb-horizontal, &&:focus-within .thumb-vertical, &&:focus-within .thumb-horizontal, && .scrollbar-view[data-panel-scrolling] ~ div > div':
    { opacity: 1 },
  '@media (prefers-reduced-motion: reduce)': { '&& .thumb-vertical, & .thumb-horizontal': { transition: 'none' } },
});

export function PanelScrollArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  usePanelScrollActivity(() => ref.current);
  return <div {...props} ref={ref} tabIndex={props.tabIndex ?? 0} className={cx(panelScrollClass, className)} />;
}
