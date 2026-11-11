import { LoadingState, PanelData, toDataFrame } from '@grafana/data';

import { isWallDashboardPanelRoute } from '../model';

import { panelContentPadding, panelDisplayState, panelHeaderHeight } from './panelPresentation';

const result = (state: LoadingState, values: Array<number | null> = []) =>
  ({
    state,
    series: [toDataFrame({ fields: [{ name: 'value', values }] })],
  }) as PanelData;

it('shares presentation across arbitrary dashboard UIDs, repeats, fullscreen and kiosk but not editors or solo embeds', () => {
  for (const path of ['/d/fec03giqwtw5cf/overview', '/d/another/dashboard', '/d/custom-uid']) {
    for (const query of ['', '?kiosk', '?viewPanel=panel-7&fullscreen', '?var-host=cube01']) {
      expect(isWallDashboardPanelRoute(path, query)).toBe(true);
    }
    expect(isWallDashboardPanelRoute(path, '?editPanel=7')).toBe(false);
    expect(isWallDashboardPanelRoute(path, '?editview=settings')).toBe(false);
  }
  expect(isWallDashboardPanelRoute('/d-solo/another/panel')).toBe(false);
  expect(isWallDashboardPanelRoute('/alerting/list')).toBe(false);
});

it('fits existing short panels while retaining type-specific internal padding', () => {
  expect(panelHeaderHeight('stat', 60)).toBe(28);
  expect(panelHeaderHeight('stat', 144)).toBe(32);
  expect(panelHeaderHeight('timeseries', 300)).toBe(44);
  expect(panelContentPadding('stat')).toEqual({ horizontal: 0, vertical: 0 });
  expect(panelContentPadding('table')).toEqual({ horizontal: 0, vertical: 0 });
  expect(panelContentPadding('external-plugin', true)).toEqual({ horizontal: 0, vertical: 0 });
  expect(panelContentPadding('timeseries')).toEqual({ horizontal: 16, vertical: 16 });
});

it('never masks mapped nulls, partial results or query-free plugins', () => {
  expect(panelDisplayState(result(LoadingState.Done))).toBe('empty');
  expect(panelDisplayState(result(LoadingState.Error))).toBe('error');
  expect(panelDisplayState(result(LoadingState.Loading))).toBe('loading');
  expect(panelDisplayState(result(LoadingState.NotStarted))).toBe('loading');
  expect(panelDisplayState(result(LoadingState.Done, [null]))).toBeUndefined();
  expect(panelDisplayState(result(LoadingState.Error, [42]))).toBeUndefined();
  expect(panelDisplayState(result(LoadingState.Loading, [42]))).toBeUndefined();
  expect(panelDisplayState(result(LoadingState.Done), true)).toBeUndefined();
  expect(panelDisplayState(undefined, true)).toBeUndefined();
});
