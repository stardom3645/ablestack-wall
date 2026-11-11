import { act, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';

import { getDefaultTimeRange, LoadingState, PanelData } from '@grafana/data';
import { backendSrv } from 'app/core/services/backend_srv';
import { QueryInspector } from 'app/features/inspector/QueryInspector';

jest.mock('./WallQueryInspection', () => ({
  WallQueryInspection: ({
    exchanges,
    executed,
  }: React.ComponentProps<typeof import('./WallQueryInspection').WallQueryInspection>) => (
    <div>{JSON.stringify({ exchanges, executed })}</div>
  ),
}));

it('matches a transport response after PanelData receives its ID and releases the native stream on close', () => {
  const stream = new Subject<import('rxjs').ObservedValueOf<ReturnType<typeof backendSrv.getInspectorStream>>>();
  const spy = jest.spyOn(backendSrv, 'getInspectorStream').mockReturnValue(stream);
  let id = 'old';
  const data: PanelData = {
    state: LoadingState.Loading,
    series: [{ fields: [], length: 2, refId: 'A', meta: { executedQueryString: 'select 1' } }],
    timeRange: getDefaultTimeRange(),
  };
  const draw = (d: PanelData) => (
    <QueryInspector wall data={d} onRefreshQuery={() => {}} acceptResponse={(requestId) => requestId === id} />
  );
  const { rerender, unmount } = render(draw(data));
  expect(screen.getByText(/"frames":1/)).toHaveTextContent('"rows":2');
  act(() => {
    stream.next({
      requestId: 'other',
      response: { status: 200, data: { result: 'unrelated' }, config: { url: 'api/ds/query' } },
    });
    stream.next({
      requestId: 'new',
      response: { status: 400, data: { error: 'actual error', token: 'secret' }, config: { url: 'api/ds/query' } },
    });
  });
  expect(screen.queryByText(/actual error/)).not.toBeInTheDocument();
  id = 'new';
  rerender(draw({ ...data, state: LoadingState.Error }));
  expect(screen.getByText(/actual error/)).toHaveTextContent('[REDACTED]');
  expect(screen.getByText(/actual error/)).not.toHaveTextContent('unrelated');
  unmount();
  expect(stream.observed).toBe(false);
  spy.mockRestore();
});
