import { render } from '@testing-library/react';

import { FieldConfigSource, FieldType, getDefaultTimeRange, LoadingState, toDataFrame } from '@grafana/data';
import { TableCellHeight } from '@grafana/schema';
import { Table } from '@grafana/ui';
import { TablePanel } from 'app/plugins/panel/table/TablePanel';

import { WallTypographyContext } from '../typography';

jest.mock('@grafana/ui', () => ({ ...jest.requireActual('@grafana/ui'), Table: jest.fn(() => null) }));

it.each(['existing width', 'existing field', 'new field'])(
  'updates only the native width override without mutating the saved input: %s',
  (kind) => {
    const fieldConfig: FieldConfigSource = {
      defaults: { unit: 'bytes', decimals: 2 },
      overrides:
        kind === 'new field'
          ? []
          : [
              {
                matcher: { id: 'byName', options: 'Value' },
                properties: [
                  { id: 'unit', value: 'bytes' },
                  ...(kind === 'existing width' ? [{ id: 'custom.width', value: 150 }] : []),
                ],
              },
            ],
    };
    const before = JSON.stringify(fieldConfig);
    const onFieldConfigChange = jest.fn();
    const timeRange = getDefaultTimeRange();
    render(
      <WallTypographyContext.Provider value={true}>
        <TablePanel
          id={1}
          title="용량"
          width={600}
          height={240}
          transparent={false}
          renderCounter={1}
          timeRange={timeRange}
          timeZone="utc"
          replaceVariables={(value) => value}
          fieldConfig={fieldConfig}
          onFieldConfigChange={onFieldConfigChange}
          onOptionsChange={jest.fn()}
          onChangeTimeRange={jest.fn()}
          eventBus={{
            publish: jest.fn(),
            getStream: jest.fn(),
            subscribe: jest.fn(),
            removeAllListeners: jest.fn(),
            newScopedBus: jest.fn(),
          }}
          data={{
            state: LoadingState.Done,
            timeRange,
            series: [toDataFrame({ fields: [{ name: 'Value', type: FieldType.number, values: [1024] }] })],
          }}
          options={{
            showHeader: true,
            showTypeIcons: false,
            cellHeight: TableCellHeight.Sm,
            frameIndex: 0,
            sortBy: [],
            footer: { show: false, reducer: [], countRows: false, fields: [], enablePagination: false },
          }}
        />
      </WallTypographyContext.Provider>
    );
    const calls = jest.mocked(Table).mock.calls;
    calls[calls.length - 1][0].onColumnResize!('Value', 244);
    const updated = onFieldConfigChange.mock.calls[0][0] as FieldConfigSource;
    expect(JSON.stringify(fieldConfig)).toBe(before);
    expect(updated.defaults).toEqual(fieldConfig.defaults);
    expect(updated.overrides[0].matcher).toEqual({ id: 'byName', options: 'Value' });
    expect(updated.overrides[0].properties.find((property) => property.id === 'custom.width')?.value).toBe(244);
    expect(updated.overrides[0].properties.filter((property) => property.id === 'custom.width')).toHaveLength(1);
    if (kind !== 'new field') {
      expect(updated.overrides[0].properties.find((property) => property.id === 'unit')?.value).toBe('bytes');
    }
  }
);
