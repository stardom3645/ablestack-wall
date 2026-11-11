import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import {
  LoadingState,
  getDefaultTimeRange,
  type DataSourceApi,
  type DataQuery,
  type DataSourceInstanceSettings,
  type PanelData,
} from '@grafana/data';
import { QueryEditorRows } from 'app/features/query/components/QueryEditorRows';
import { QueryGroupOptionsEditor } from 'app/features/query/components/QueryGroupOptions';

import { queryAdvancedSlotContext } from './EditorPresentationContext';
import { WallQueryResultStatus } from './WallQueryParts';
import { WallQueryOptions, WallQueryToolbar } from './WallQueryToolbar';

jest.mock('app/features/query/components/QueryEditorRow', () => ({
  QueryEditorRow: ({ query }: { query: DataQuery }) => (
    <textarea aria-label={`Native ${query.refId}`} defaultValue={query.refId} />
  ),
}));
const settings = {
  uid: 'wall',
  type: 'prometheus',
  name: 'Wall',
  meta: { id: 'prometheus' },
} as DataSourceInstanceSettings;
const data: PanelData = { state: LoadingState.Done, series: [], timeRange: getDefaultTimeRange() };

it('selects one native query without changing models and preserves hidden edit buffers', () => {
  const onChange = jest.fn();
  function Workspace() {
    const [active, setActive] = useState('A');
    return (
      <QueryEditorRows
        workspace
        queries={[{ refId: 'A' }, { refId: 'B' }]}
        dsSettings={settings}
        data={data}
        activeQuery={active}
        onActiveQueryChange={setActive}
        onQueriesChange={onChange}
        onAddQuery={jest.fn()}
        onRunQueries={jest.fn()}
        queryRowWrapper={(children, id) => (
          <div key={id} hidden={id !== active}>
            {children}
          </div>
        )}
      />
    );
  }
  render(<Workspace />);
  const first = screen.getByRole('textbox', { name: 'Native A' });
  fireEvent.change(first, { target: { value: 'unfinished native draft' } });
  fireEvent.click(screen.getByRole('button', { name: '쿼리 B 선택' }));
  expect(screen.queryByRole('textbox', { name: 'Native A' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Native B' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '쿼리 A 선택' }));
  expect(screen.getByRole('textbox', { name: 'Native A' })).toBe(first);
  expect(first).toHaveValue('unfinished native draft');
  expect(onChange).not.toHaveBeenCalled();
});

it('routes navigation reorder through the unchanged native callback with original query objects', () => {
  const onChange = jest.fn();
  const original = [
    { refId: 'A', expr: 'original', options: { keep: true } },
    { refId: 'B', expr: 'other' },
  ];
  const model = new QueryEditorRows({
    queries: original,
    dsSettings: settings,
    data,
    onQueriesChange: onChange,
    onAddQuery: jest.fn(),
    onRunQueries: jest.fn(),
  });
  model.onDragEnd({
    source: { index: 0, droppableId: 'wall-query-navigation' },
    destination: { index: 1, droppableId: 'wall-query-navigation' },
    draggableId: 'A',
    type: 'DEFAULT',
    reason: 'DROP',
    mode: 'FLUID',
    combine: null,
  });
  expect(onChange).toHaveBeenCalledWith([original[1], original[0]]);
  expect(onChange.mock.calls[0][0][1]).toBe(original[0]);
  expect(original[0].refId).toBe('A');
});

it('shows only actual native result/error state and does not invent successful results', () => {
  const { rerender } = render(<WallQueryResultStatus data={data} />);
  expect(screen.getByRole('status')).toHaveTextContent('조회 완료 · 0개 결과');
  rerender(
    <WallQueryResultStatus data={{ ...data, state: LoadingState.Error, error: { message: 'actual query error' } }} />
  );
  expect(screen.getByRole('alert')).toHaveTextContent('actual query error');
  rerender(<WallQueryResultStatus data={{ ...data, state: LoadingState.Loading }} />);
  expect(screen.getByRole('status')).toHaveTextContent('결과 조회 중');
});

it('keeps native query option updates and validation when fields are presented in workspace sections', () => {
  const options = { queries: [{ refId: 'A', expr: 'unchanged' }], dataSource: { uid: 'wall' }, timeRange: {} };
  const onChange = jest.fn();
  const source = { meta: { queryOptions: {} }, interval: '15s' } as DataSourceApi;
  render(<QueryGroupOptionsEditor standalone options={options} data={data} dataSource={source} onChange={onChange} />);
  const points = screen.getByRole('spinbutton');
  fireEvent.change(points, { target: { value: '500' } });
  fireEvent.blur(points);
  expect(onChange).toHaveBeenLastCalledWith({ ...options, maxDataPoints: 500 });
  expect(onChange.mock.calls[0][0].queries).toBe(options.queries);
  onChange.mockClear();
  const relative = screen.getByRole('textbox', { name: '개별 시간 범위' });
  fireEvent.change(relative, { target: { value: 'not a duration' } });
  fireEvent.blur(relative);
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(relative, { target: { value: '5m' } });
  fireEvent.blur(relative);
  expect(onChange).toHaveBeenLastCalledWith({ ...options, timeRange: { from: '5m' } });
});

it('runs the native query from a compact footer without auxiliary query-building controls', async () => {
  const user = userEvent.setup();
  const onRun = jest.fn();
  const { rerender } = render(
    <WallQueryToolbar onRun={onRun} loading={false} stale expanded={false} onToggleExpand={jest.fn()} />
  );
  expect(screen.getByText('Shift + Enter')).toBeVisible();
  expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '쿼리 실행' }));
  expect(onRun).toHaveBeenCalledTimes(1);
  rerender(<WallQueryToolbar onRun={onRun} loading stale={false} expanded={false} onToggleExpand={jest.fn()} />);
  expect(screen.getByRole('button', { name: '실행 중' })).toBeDisabled();
});

it('keeps each query option draft in the same advanced-slot DOM while selection changes', () => {
  function Options() {
    const [host, setHost] = useState<HTMLDivElement | null>(null);
    const [active, setActive] = useState('A');
    return (
      <>
        <button onClick={() => setActive(active === 'A' ? 'B' : 'A')}>Switch native query</button>
        {['A', 'B'].map((id) => (
          <queryAdvancedSlotContext.Provider key={id} value={{ host, active: active === id }}>
            <WallQueryOptions title="Options" summary={[]}>
              <input aria-label={`Option ${id}`} defaultValue={id} />
            </WallQueryOptions>
          </queryAdvancedSlotContext.Provider>
        ))}
        <div ref={setHost} data-testid="advanced-slot" />
      </>
    );
  }
  render(<Options />);
  const first = screen.getByRole('textbox', { name: 'Option A' });
  expect(screen.getByTestId('advanced-slot')).toContainElement(first);
  fireEvent.change(first, { target: { value: 'unfinished option draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Switch native query' }));
  expect(screen.getByRole('textbox', { name: 'Option B' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Switch native query' }));
  expect(screen.getByRole('textbox', { name: 'Option A' })).toBe(first);
  expect(first).toHaveValue('unfinished option draft');
});
