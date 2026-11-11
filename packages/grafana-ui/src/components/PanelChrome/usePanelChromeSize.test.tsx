import { act, render, screen } from '@testing-library/react';

import { usePanelChromeSize } from './usePanelChromeSize';

it('updates fill content in the observer callback before a later upstream pixel sample and cleans up', () => {
  let width = 600;
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width,
    height: 250,
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: width,
    bottom: 250,
    toJSON: () => ({}),
  }));
  const Original = window.ResizeObserver;
  const observers: Array<{ callback: ResizeObserverCallback; target?: Element; disconnect: jest.Mock }> = [];
  class Observer {
    target?: Element;
    disconnect = jest.fn();
    unobserve = jest.fn();
    constructor(public callback: ResizeObserverCallback) {
      observers.push(this);
    }
    observe(target: Element) {
      this.target = target;
    }
  }
  window.ResizeObserver = Observer as unknown as typeof ResizeObserver;
  function Frame() {
    const { ref, viewport } = usePanelChromeSize(true);
    return (
      <section ref={ref} data-testid="frame">
        <span>{viewport?.width}</span>
      </section>
    );
  }
  try {
    const { unmount } = render(<Frame />);
    const frame = screen.getByTestId('frame');
    expect(frame).toHaveTextContent('600');
    const observer = observers.find((observer) => observer.target === frame)!;
    for (const next of [720, 864, 500, 800]) {
      width = next;
      act(() => {
        observer.callback([{ contentRect: { width: width - 2 } } as ResizeObserverEntry], {} as ResizeObserver);
        // Check before act can finish: an async state update here would paint the
        // old chart/legend position inside the already enlarged frame.
        expect(frame.textContent).toBe(String(next));
      });
    }
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    const measurements = rect.mock.calls.length;
    observer.callback([{ contentRect: { width: 900 } } as ResizeObserverEntry], {} as ResizeObserver);
    expect(rect.mock.calls.length).toBe(measurements);
  } finally {
    window.ResizeObserver = Original;
    rect.mockRestore();
  }
});
