import { fireEvent, render, screen } from '@testing-library/react';
import { ContextType } from 'react';

import { createTheme, FieldType, ThresholdsMode, getDisplayProcessor, LoadingState, toDataFrame } from '@grafana/data';

import { WallPanelContent, WallDisplayProps, WallPanelContentContext } from './WallPanelContent';
import { capacityRelation, displayKinds, fieldText, usageFraction, thresholdMarks } from './model';

function props(fields: Array<{ name: string; type: FieldType; values: unknown[]; config?: object }>): WallDisplayProps {
  const frame = toDataFrame({ fields });
  frame.fields.forEach((field) => {
    field.display = getDisplayProcessor({ field, theme: createTheme() });
  });
  return {
    id: 32,
    timeZone: 'utc',
    title: 'CPU 사용률',
    data: { series: [frame], state: LoadingState.Done, timeRange: {} as WallDisplayProps['timeRange'] },
    options: { reduceOptions: { calcs: ['lastNotNull'] } },
    fieldConfig: { defaults: {}, overrides: [] },
    replaceVariables: (s) => s,
    width: 400,
    height: 140,
    timeRange: {} as WallDisplayProps['timeRange'],
  };
}
function renderDisplay(
  kind: NonNullable<ContextType<typeof WallPanelContentContext>>['kind'],
  panel: WallDisplayProps
) {
  return render(
    <WallPanelContentContext.Provider value={{ kind }}>
      <WallPanelContent panel={panel}>
        <div>Native fallback</div>
      </WallPanelContent>
    </WallPanelContentContext.Provider>
  );
}

it('validates fractions without clamping or guessing a conversion for invalid data', () => {
  expect(usageFraction(0.68, 'percentunit')).toBe(0.68);
  expect(usageFraction(68, 'percent')).toBe(0.68);
  for (const raw of [1200000000, -0.1, NaN, Infinity, null]) {
    expect(usageFraction(raw, 'percentunit')).toBeUndefined();
  }
  expect(usageFraction(68, 'bytes')).toBeUndefined();
  expect(capacityRelation(100, 60, 40)).toEqual({ ratio: 0.6, remaining: 40 });
  expect(capacityRelation(100, 100, 100)).toBeUndefined();
  expect(capacityRelation(0, 0)).toBeUndefined();
});

it('renders actual mapped service state and retains the source reduction', () => {
  const panel = props([
    {
      name: 'daemon',
      type: FieldType.number,
      values: [8, 0],
      config: { mappings: [{ type: 'value', options: { '0': { text: 'WARN', color: 'orange' } } }] },
    },
  ]);
  renderDisplay('service', panel);
  expect(screen.getByText('WARN')).toBeInTheDocument();
  expect(screen.queryByText('OK')).not.toBeInTheDocument();
  expect(panel.data.series[0].fields[0].values).toEqual([8, 0]);
});

it('reuses native formatting and draws only a valid native percentage meter', () => {
  const panel = props([
    { name: 'load', type: FieldType.number, values: [68], config: { unit: 'percent', decimals: 2, min: 0, max: 100 } },
  ]);
  renderDisplay('usage', panel);
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '68');
  expect(screen.getByText('68.00')).toBeInTheDocument();
  expect(panel.data.series[0].fields[0].config.unit).toBe('percent');
});

it('retains every frame, row, field and identifier, without a huge empty table or fake capacity', () => {
  const panel = props([
    { name: 'ceph_daemon', type: FieldType.string, values: ['osd.0', 'osd.1'] },
    { name: 'Value #A', type: FieldType.number, values: [1000, 2000], config: { unit: 'bytes' } },
    { name: 'Value #B', type: FieldType.number, values: [600, 800], config: { unit: 'bytes' } },
    { name: 'Value #C', type: FieldType.number, values: [0.6, 1200000000], config: { unit: 'percentunit' } },
    { name: 'extra', type: FieldType.string, values: ['retained-a', 'retained-b'] },
  ]);
  const before = JSON.stringify(
    panel.data.series.map((frame) => frame.fields.map((f) => ({ name: f.name, config: f.config, values: f.values })))
  );
  const { container } = renderDisplay('devices', panel);
  expect(screen.getByText('osd.0')).toBeInTheDocument();
  expect(screen.getByText('osd.1')).toBeInTheDocument();
  expect(screen.getByText('retained-b')).toBeInTheDocument();
  expect(screen.getAllByRole('article')).toHaveLength(2);
  expect(screen.getAllByRole('meter')).toHaveLength(1);
  expect(screen.getByText(/원본 사용률이/)).toBeInTheDocument();
  expect(container.querySelector('table')).not.toBeInTheDocument();
  expect(
    JSON.stringify(
      panel.data.series.map((frame) => frame.fields.map((f) => ({ name: f.name, config: f.config, values: f.values })))
    )
  ).toBe(before);
});

it('leaves native plugins untouched without the workspace context', () => {
  render(
    <WallPanelContent panel={props([])}>
      <div>Native fallback</div>
    </WallPanelContent>
  );
  expect(screen.getByText('Native fallback')).toBeInTheDocument();
  expect(Object.keys(displayKinds)).toHaveLength(24);
});

it('does not apply an inherited percentage unit to device identifiers', () => {
  const field = toDataFrame({
    fields: [{ name: 'ceph_daemon', type: FieldType.string, values: ['osd.0'], config: { unit: 'percentunit' } }],
  }).fields[0];
  expect(fieldText(field, 0, createTheme())).toBe('osd.0');
});

it('does not fabricate a capacity bar when total, used and available do not reconcile', () => {
  const panel = props([]);
  panel.data.series = ['전체', '사용중', '사용 가능'].map((name) => {
    const frame = toDataFrame({
      fields: [{ name, type: FieldType.number, values: [1200], config: { unit: 'bytes', displayName: name } }],
    });
    frame.fields[0].display = getDisplayProcessor({ field: frame.fields[0], theme: createTheme() });
    return frame;
  });
  renderDisplay('capacity', panel);
  expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  expect(screen.getByText(/원본 값을 표시/)).toBeInTheDocument();
  expect(screen.getAllByText('1.17')).toHaveLength(3);
});

it('retains native identity field links and all frames rather than only the selected native table frame', () => {
  const panel = props([
    { name: 'Field', type: FieldType.string, values: ['osd.0'] },
    { name: 'Last', type: FieldType.number, values: [64] },
  ]);
  const links = jest.fn(() => [
    { href: '/inspect', title: 'Details', target: '_self' as const, origin: panel.data.series[0].fields[0] },
  ]);
  panel.data.series[0].fields[0].getLinks = links;
  panel.data.series.push(
    toDataFrame({
      name: 'extra-frame',
      fields: [
        { name: 'Field', type: FieldType.string, values: ['osd.1'] },
        { name: 'Last', type: FieldType.number, values: [80] },
      ],
    })
  );
  renderDisplay('records', panel);
  expect(screen.getByText('osd.0')).toBeInTheDocument();
  expect(screen.getByText('osd.1')).toBeInTheDocument();
  expect(links).toHaveBeenCalledWith({ valueRowIndex: 0 });
});

it('retains the actual configured threshold positions for percent and fractional-percent units', () => {
  expect(
    thresholdMarks({
      unit: 'percent',
      thresholds: {
        mode: ThresholdsMode.Absolute,
        steps: [
          { value: -Infinity, color: 'green' },
          { value: 75, color: 'orange' },
          { value: 85, color: 'red' },
        ],
      },
    })
  ).toEqual([
    { ratio: 0.75, color: 'orange' },
    { ratio: 0.85, color: 'red' },
  ]);
  expect(
    thresholdMarks({
      unit: 'percentunit',
      thresholds: { mode: ThresholdsMode.Percentage, steps: [{ value: 75, color: 'orange' }] },
    })
  ).toEqual([{ ratio: 0.75, color: 'orange' }]);
});

it('retains the compact panel identity when no SCVM data is available', () => {
  const panel = props([]);
  panel.data.series = [];
  renderDisplay('usage', panel);
  expect(screen.getByText('CPU 사용률')).toBeInTheDocument();
  expect(screen.getByText('표시할 데이터가 없습니다.')).toBeInTheDocument();
  expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});

it('does not mark an unmapped service value as healthy or invent a new fault threshold', () => {
  const panel = props([
    {
      name: 'daemon',
      type: FieldType.number,
      values: [10000],
      config: { mappings: [{ type: 'range', options: { from: 1, to: 9999, result: { text: 'OK', color: 'green' } } }] },
    },
  ]);
  const { container } = renderDisplay('service', panel);
  expect(container.querySelector('.wall-service-state')).toHaveAttribute('data-wall-state-known', 'false');
  expect(screen.queryByText('OK')).not.toBeInTheDocument();
});

it('shows a single filesystem value as compact information with the original field name and byte unit', () => {
  const panel = props([
    {
      name: 'Value #A',
      type: FieldType.number,
      values: [1202590842.88],
      config: { unit: 'bytes', displayName: '사이즈', decimals: 2 },
    },
  ]);
  const source = () =>
    panel.data.series.map((frame) => frame.fields.map(({ name, config, values }) => ({ name, config, values })));
  const before = JSON.stringify(source());
  const { container } = renderDisplay('filesystem', panel);
  expect(container.querySelector('[data-wall-filesystem-mode="information"]')).toBeInTheDocument();
  expect(screen.getByText('사이즈')).toBeInTheDocument();
  expect(screen.getByText('1.12 GiB')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(screen.queryByText(/용량 합계/)).not.toBeInTheDocument();
  expect(JSON.stringify(source())).toBe(before);
});

it('uses a compact table for multiple filesystems, preserving all frames and original row links when sorted', () => {
  const panel = props([
    { name: 'mountpoint', type: FieldType.string, values: ['/', '/boot'] },
    {
      name: 'Value #A',
      type: FieldType.number,
      values: [2000, 1000],
      config: { unit: 'bytes', displayName: '사이즈' },
    },
  ]);
  const identity = panel.data.series[0].fields[0];
  const links = jest.fn(() => [{ href: '/inspect', title: 'Details', target: '_self' as const, origin: identity }]);
  identity.getLinks = links;
  panel.data.series.push(
    toDataFrame({ name: 'extra', fields: [{ name: 'extra', type: FieldType.string, values: ['retained'] }] })
  );
  renderDisplay('filesystem', panel);
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getAllByRole('row')).toHaveLength(4);
  expect(screen.getByText('/')).toBeInTheDocument();
  expect(screen.getByText('/boot')).toBeInTheDocument();
  expect(screen.getByText('retained')).toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '사이즈' }));
  expect(screen.getByRole('columnheader', { name: '사이즈 ↑' })).toHaveAttribute('aria-sort', 'ascending');
  expect(links).toHaveBeenCalledWith({ valueRowIndex: 1 });
});

it('does not leave an empty native table or frame selector when no filesystem data is available', () => {
  const panel = props([]);
  panel.data.series = [];
  const { container } = renderDisplay('filesystem', panel);
  expect(container.querySelector('[data-wall-filesystem-mode="information"]')).toBeInTheDocument();
  expect(screen.getByText('표시할 데이터가 없습니다.')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('shows a few distinct scalar frames as key-value information, rather than sparse table rows', () => {
  const panel = props([
    { name: 'size', type: FieldType.number, values: [1200000000], config: { unit: 'bytes', displayName: '사이즈' } },
  ]);
  panel.data.series.push(
    toDataFrame({
      fields: [
        { name: 'used', type: FieldType.number, values: [600000000], config: { unit: 'bytes', displayName: '사용량' } },
      ],
    })
  );
  const { container } = renderDisplay('filesystem', panel);
  expect(container.querySelector('[data-wall-filesystem-mode="information"]')).toBeInTheDocument();
  expect(screen.getByText('사이즈')).toBeInTheDocument();
  expect(screen.getByText('사용량')).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('does not combine capacity measurements from separate frames even when the device name matches', () => {
  const panel = props([]);
  panel.data.series = ['A', 'B', 'C'].map((refId, i) => {
    const frame = toDataFrame({
      refId,
      fields: [
        { name: 'ceph_daemon', type: FieldType.string, values: ['osd.0'] },
        {
          name: `Value #${refId}`,
          type: FieldType.number,
          values: [[1000, 600, 0.6][i]],
          config: { unit: refId === 'C' ? 'percentunit' : 'bytes' },
        },
      ],
    });
    frame.fields.forEach((field) => {
      field.display = getDisplayProcessor({ field, theme: createTheme() });
    });
    return frame;
  });
  renderDisplay('devices', panel);
  expect(screen.getAllByRole('article')).toHaveLength(3);
  expect(screen.getAllByText('osd.0')).toHaveLength(3);
  expect(screen.getAllByText(/다른 프레임과 임의로 결합하지/)).toHaveLength(3);
  expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});
