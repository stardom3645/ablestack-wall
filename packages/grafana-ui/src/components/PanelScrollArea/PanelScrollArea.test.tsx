import { act, fireEvent, render, screen } from '@testing-library/react';

import { PanelScrollArea, panelScrollTokens } from './PanelScrollArea';

it('retains native input, measures overflow, settles activity and cleans up observers', () => {
  jest.useFakeTimers();
  const original = global.ResizeObserver;
  let measure = () => {};
  const disconnect = jest.fn();
  global.ResizeObserver = class {
    constructor(callback: () => void) {
      measure = callback;
    }
    observe() {}
    unobserve() {}
    disconnect = disconnect;
  } as unknown as typeof ResizeObserver;
  const { unmount } = render(
    <PanelScrollArea aria-label="목록">
      <div>content</div>
    </PanelScrollArea>
  );
  const view = screen.getByLabelText('목록');
  expect(view).toHaveAttribute('tabindex', '0');
  Object.defineProperties(view, { clientHeight: { value: 60 }, scrollHeight: { value: 300, configurable: true } });
  act(() => measure());
  expect(view).toHaveAttribute('data-panel-overflow', 'true');
  fireEvent.scroll(view);
  expect(view).toHaveAttribute('data-panel-scrolling', 'true');
  act(() => jest.advanceTimersByTime(panelScrollTokens.settle));
  expect(view).not.toHaveAttribute('data-panel-scrolling');
  Object.defineProperty(view, 'scrollHeight', { value: 60 });
  act(() => measure());
  expect(view).toHaveAttribute('data-panel-overflow', 'false');
  unmount();
  expect(disconnect).toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
  global.ResizeObserver = original;
  jest.useRealTimers();
});
