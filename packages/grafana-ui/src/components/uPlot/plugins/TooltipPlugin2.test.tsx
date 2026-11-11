import { act, fireEvent, render, screen } from '@testing-library/react';

import { DashboardCursorSync } from '@grafana/schema';

import { TimeSeriesPresentationContext } from '../../VizPresentation/TimeSeriesPresentation';

import { TooltipHoverMode, TooltipPlugin2 } from './TooltipPlugin2';

function setup(mode: DashboardCursorSync, refined = true) {
  const hooks: Record<string, Function[]> = {};
  const config = {
    scales: [{ props: { isTime: true } }],
    setCursor: jest.fn(),
    addHook: (key: string, cb: Function) => {
      (hooks[key] ??= []).push(cb);
    },
  };
  const root = document.createElement('div');
  document.body.append(root);
  const plot = {
    root,
    over: root,
    rect: { width: 400, height: 150, left: 0, top: 0, right: 400, bottom: 150 },
    cursor: { left: 100, top: 50, event: null as MouseEvent | null, idxs: [0, 0] as Array<number | null> },
    scales: { x: { min: 0, max: 1000 } },
    setCursor: jest.fn(),
  };
  const content = jest.fn(() => <span>Actual point</span>);
  const outsideWheel = jest.fn();
  plot.setCursor.mockImplementation((next) => Object.assign(plot.cursor, next));
  const view = render(
    <div onWheel={outsideWheel}>
      <TimeSeriesPresentationContext.Provider
        value={
          (refined ? { refinedInteractions: true } : undefined) as unknown as React.ContextType<
            typeof TimeSeriesPresentationContext
          >
        }
      >
        <TooltipPlugin2
          config={config as unknown as Parameters<typeof TooltipPlugin2>[0]['config']}
          hoverMode={TooltipHoverMode.xAll}
          syncMode={mode}
          render={content}
        />
      </TimeSeriesPresentationContext.Provider>
    </div>
  );
  const fire = (key: string, ...args: unknown[]) => hooks[key]?.forEach((cb) => cb(plot, ...args));
  act(() => {
    fire('init');
    fire('ready');
  });
  const hover = async (local: boolean) => {
    await act(async () => {
      plot.cursor.event = local ? new MouseEvent('mousemove') : null;
      fire('setSeries', 1);
      fire('setLegend');
      await Promise.resolve();
    });
  };
  return {
    plot,
    content,
    outsideWheel,
    hover,
    fire,
    dispose: () => {
      view.unmount();
      root.remove();
    },
  };
}

it.each([DashboardCursorSync.Off, DashboardCursorSync.Crosshair, DashboardCursorSync.Tooltip])(
  'distinguishes local tooltip and passive follower DOM in mode %s',
  async (mode) => {
    const host = setup(mode);
    await host.hover(false);
    if (mode === DashboardCursorSync.Tooltip) {
      expect(screen.getByText('Actual point')).toBeVisible();
    } else {
      expect(host.content).not.toHaveBeenCalled();
      expect(screen.queryByText('Actual point')).toBeNull();
    }
    await host.hover(true);
    expect(screen.getByText('Actual point')).toBeVisible();
    await act(async () => {
      host.plot.cursor.left = -10;
      host.plot.cursor.top = -10;
      host.fire('setCursor');
      await Promise.resolve();
    });
    expect(screen.queryByText('Actual point')).toBeNull();
    // A stale focused series must not reopen after pointer leave or an invalid point.
    await host.hover(true);
    expect(screen.queryByText('Actual point')).toBeNull();
    host.dispose();
  }
);

it('keeps an unpinned local sample stable while the popup receives wheel, thumb and keyboard input', async () => {
  const host = setup(DashboardCursorSync.Crosshair);
  await host.hover(true);
  const popup = screen.getByText('Actual point').parentElement!;
  expect(popup).toHaveStyle({ pointerEvents: 'auto' });
  fireEvent.pointerEnter(popup);
  const calls = host.content.mock.calls.length;
  await act(async () => {
    host.plot.cursor.event = new MouseEvent('mouseleave', { relatedTarget: popup });
    host.plot.cursor.idxs = [null, null];
    host.plot.cursor.left = host.plot.cursor.top = -10;
    host.fire('setLegend');
    host.fire('setSeries', null);
    host.fire('setCursor');
    await Promise.resolve();
  });
  expect(screen.getByText('Actual point')).toBeVisible();
  expect(host.content).toHaveBeenCalledTimes(calls);
  // Native scrolling must remain uncancelled; events must not reach chart handlers.
  const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 80 });
  fireEvent(popup, wheel);
  expect(wheel.defaultPrevented).toBe(false);
  expect(host.outsideWheel).not.toHaveBeenCalled();
  fireEvent.focus(popup);
  expect(screen.getByText('Actual point')).toBeVisible();
  await act(async () => {
    fireEvent.keyDown(popup, { key: 'Escape' });
    await Promise.resolve();
  });
  expect(screen.queryByText('Actual point')).toBeNull();
  host.dispose();
});

it('dismisses on pointer exit even after keyboard scrolling focused the popup', async () => {
  const host = setup(DashboardCursorSync.Crosshair);
  await host.hover(true);
  const popup = screen.getByText('Actual point').parentElement!;
  fireEvent.pointerEnter(popup);
  fireEvent.focus(popup);
  await act(async () => {
    fireEvent(popup, new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
    await Promise.resolve();
  });
  expect(screen.queryByText('Actual point')).toBeNull();
  host.dispose();
});

it('allows crossing the plot-to-popup gap but closes an abandoned popup and cleans up its exit timer', async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
  const host = setup(DashboardCursorSync.Crosshair);
  await host.hover(true);
  await act(async () => {
    host.plot.cursor.event = new MouseEvent('mouseleave');
    host.plot.cursor.left = host.plot.cursor.top = -10;
    host.fire('setCursor');
    await Promise.resolve();
  });
  expect(screen.getByText('Actual point')).toBeVisible();
  act(() => {
    jest.advanceTimersByTime(101);
  });
  expect(screen.queryByText('Actual point')).toBeNull();
  host.dispose();
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

it('does not make a passive Shared Tooltip intercept pointer input', async () => {
  const host = setup(DashboardCursorSync.Tooltip);
  await host.hover(false);
  expect(screen.getByText('Actual point').parentElement).toHaveStyle({ pointerEvents: 'none' });
  host.dispose();
});

it('keeps the native click-to-pin interaction and non-Wall fallback', async () => {
  jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
  const host = setup(DashboardCursorSync.Off, false);
  await host.hover(true);
  expect(screen.getByText('Actual point').parentElement).toHaveStyle({ pointerEvents: 'none' });
  await act(async () => {
    fireEvent.click(host.plot.over);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
  });
  expect(host.plot.cursor).toHaveProperty('_lock', true);
  expect(screen.getByText('Actual point').parentElement).toHaveStyle({ pointerEvents: 'auto' });
  host.dispose();
  jest.useRealTimers();
});

it('does not create a tooltip when a synchronized timestamp has no real point', async () => {
  const host = setup(DashboardCursorSync.Tooltip);
  host.plot.cursor.idxs = [null, null];
  await host.hover(false);
  expect(host.content).not.toHaveBeenCalled();
  host.dispose();
});

it('renders one source and no follower content across 24 Crosshair-mode panels, then transfers ownership', async () => {
  const hosts = Array.from({ length: 24 }, () => setup(DashboardCursorSync.Crosshair));
  await hosts[0].hover(true);
  for (const host of hosts.slice(1)) {
    await host.hover(false);
  }
  expect(screen.getAllByText('Actual point')).toHaveLength(1);
  expect(hosts.slice(1).every((host) => host.content.mock.calls.length === 0)).toBe(true);
  await hosts[0].hover(false);
  await hosts[1].hover(true);
  expect(screen.getAllByText('Actual point')).toHaveLength(1);
  hosts.forEach((host) => host.dispose());
});
