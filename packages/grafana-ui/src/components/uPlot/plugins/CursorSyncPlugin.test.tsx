import { render } from '@testing-library/react';
import uPlot from 'uplot';

import { DashboardCursorSync } from '@grafana/data';

import { CursorSyncPlugin } from './CursorSyncPlugin';

function builder(time = true) {
  const hooks: Record<string, Function> = {};
  return {
    scales: [{ props: { isTime: time } }],
    setCursor: jest.fn(),
    addHook: jest.fn((name, cb) => {
      hooks[name] = cb;
    }),
    hooks,
  };
}
it('clears pinned/dismissed sources through native sync, but never republishes a passive clear', () => {
  const pub = jest.fn();
  const sync = jest.spyOn(uPlot, 'sync').mockReturnValue({ pub } as unknown as ReturnType<typeof uPlot.sync>);
  const config = builder();
  render(
    <CursorSyncPlugin
      config={config as unknown as Parameters<typeof CursorSyncPlugin>[0]['config']}
      mode={1}
      scope="clear-test"
    />
  );
  const u = {
    cursor: { left: -10, event: null as MouseEvent | null },
    rect: { width: 400, height: 150 },
    root: document.createElement('div'),
    over: document.createElement('div'),
  };
  u.root.dataset.wallCursorFollower = 'false';
  config.hooks.setCursor(u);
  expect(pub).not.toHaveBeenCalled();
  u.root.dataset.wallCursorFollower = 'false';
  u.cursor.event = new MouseEvent('click');
  config.hooks.setCursor(u);
  expect(pub).toHaveBeenCalledTimes(1);
  config.hooks.ready(u);
  u.cursor.left = 80;
  u.over.dispatchEvent(new MouseEvent('mouseleave'));
  expect(pub).toHaveBeenCalledTimes(2);
  config.hooks.destroy(u);
  const count = pub.mock.calls.length;
  u.over.dispatchEvent(new MouseEvent('mouseleave'));
  expect(pub).toHaveBeenCalledTimes(count);
  sync.mockRestore();
});
it.each([DashboardCursorSync.Crosshair, DashboardCursorSync.Tooltip])(
  'uses native time-scale sync for mode %s without a tooltip dependency',
  (mode) => {
    const config = builder();
    render(
      <CursorSyncPlugin
        config={config as unknown as Parameters<typeof CursorSyncPlugin>[0]['config']}
        mode={mode}
        scope="dashboard-instance-1"
      />
    );
    const cursor = config.setCursor.mock.calls[0][0];
    expect(cursor.sync).toEqual({ key: 'dashboard-instance-1', scales: ['x', null] });
    const u = {
      cursor: { event: null as MouseEvent | null },
      rect: { width: 400 },
      root: document.createElement('div'),
    };
    expect(cursor.move(u, 120, 80)).toEqual([120, 80]);
    expect(cursor.move(u, 401, 80)).toEqual([-10, -10]);
    expect(cursor.move(u, -1, 80)).toEqual([-10, -10]);
    config.hooks.setCursor(u);
    expect(u.root.dataset.wallCursorFollower).toBe('true');
    u.cursor.event = new MouseEvent('mousemove');
    config.hooks.setCursor(u);
    expect(u.root.dataset.wallCursorFollower).toBe('false');
    config.hooks.destroy(u);
    expect(u.root).not.toHaveAttribute('data-wall-cursor-follower');
  }
);
it('does not opt an unset/off dashboard or non-time chart into sync', () => {
  for (const [mode, scope, time] of [
    [0, 'dashboard', true],
    [1, undefined, true],
    [1, 'dashboard', false],
  ] as const) {
    const config = builder(time);
    render(
      <CursorSyncPlugin
        config={config as unknown as Parameters<typeof CursorSyncPlugin>[0]['config']}
        mode={mode}
        scope={scope}
      />
    );
    expect(config.setCursor).not.toHaveBeenCalled();
  }
});
