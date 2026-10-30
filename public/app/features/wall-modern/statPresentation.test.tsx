import { render, screen } from '@testing-library/react';

import {
  createTheme,
  FieldConfig,
  FieldType,
  getDefaultTimeRange,
  LoadingState,
  MappingType,
  PanelProps,
  toDataFrame,
} from '@grafana/data';
import {
  BigValueColorMode,
  BigValueGraphMode,
  BigValueJustifyMode,
  BigValueTextMode,
  PercentChangeColorMode,
  VizOrientation,
} from '@grafana/schema';
import { BigValue } from '@grafana/ui';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { StatPanel } from 'app/plugins/panel/stat/StatPanel';
import { Options } from 'app/plugins/panel/stat/panelcfg.gen';

import { isStorageStatPilot, STORAGE_VM_DASHBOARD_UID, wallStatCardPresentation } from './statPresentation';

const light = wallStatCardPresentation(createTheme({ colors: { mode: 'light' } }));
const dark = wallStatCardPresentation(createTheme({ colors: { mode: 'dark' } }));
const path = `/d/${STORAGE_VM_DASHBOARD_UID}/storage`;

function makeProps(numeric = 1200000000, field: FieldConfig = { unit: 'bytes', decimals: 2 }): PanelProps<Options> {
  const timeRange = getDefaultTimeRange();
  return {
    id: 34,
    title: '메모리 합계',
    width: 160,
    height: 110,
    transparent: false,
    timeRange,
    timeZone: 'utc',
    renderCounter: 1,
    data: {
      state: LoadingState.Done,
      timeRange,
      series: [toDataFrame({ fields: [{ name: 'memory', type: FieldType.number, values: [numeric], config: field }] })],
    },
    fieldConfig: { defaults: field, overrides: [] },
    options: {
      colorMode: BigValueColorMode.None,
      graphMode: BigValueGraphMode.None,
      justifyMode: BigValueJustifyMode.Center,
      textMode: BigValueTextMode.Auto,
      wideLayout: true,
      showPercentChange: false,
      percentChangeColorMode: PercentChangeColorMode.Standard,
      orientation: VizOrientation.Auto,
      text: {},
      reduceOptions: { calcs: ['lastNotNull'], values: false, fields: '' },
    },
    eventBus: {
      publish: jest.fn(),
      getStream: jest.fn(),
      subscribe: jest.fn(),
      removeAllListeners: jest.fn(),
      newScopedBus: jest.fn(),
    },
    onOptionsChange: jest.fn(),
    onFieldConfigChange: jest.fn(),
    onChangeTimeRange: jest.fn(),
    replaceVariables: (value) => value,
  };
}

describe('storage VM Stat pilot scope', () => {
  it.each(['', '?scenes=false', '?scenes=true', '?from=now-6h&var-scvm=test'])(
    'enables only the selected UID in either renderer: %s',
    (search) => {
      expect(isStorageStatPilot(path, search)).toBe(true);
      expect(isStorageStatPilot(`/d/${STORAGE_VM_DASHBOARD_UID}`, search)).toBe(true);
    }
  );
  it.each([
    ['/d/fec03giqwtw5cf/overview', ''],
    ['/dashboards', ''],
    [`/d/${STORAGE_VM_DASHBOARD_UID}-other/storage`, ''],
    [path, '?editPanel=34'],
    [path, '?viewPanel=34'],
    [path, '?kiosk'],
    [path, '?fullscreen'],
  ])('does not enable other dashboards or editing/embed views: %s%s', (pathname, search) => {
    expect(isStorageStatPilot(pathname, search)).toBe(false);
  });
});

describe('native Stat renderer with the optional card skin', () => {
  it('preserves the native formatted value/unit and source options while changing skins without a data refresh', () => {
    const props = makeProps();
    const renderPanel = (skin: typeof light | undefined) => (
      <StatCardPresentationContext.Provider value={skin}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    const { container, rerender } = render(renderPanel(undefined));
    const originalText = container.textContent;
    const originalOptions = JSON.stringify(props.options);
    const originalConfig = JSON.stringify(props.fieldConfig);
    rerender(renderPanel(light));
    expect(container.textContent).toBe(originalText);
    expect(screen.getByText('1.12')).toBeInTheDocument();
    expect(screen.getByText('GiB', { exact: false })).toBeInTheDocument();
    expect(container.querySelector('[data-viz-presentation="wall-stat-card"]')).toBeInTheDocument();
    expect(container.querySelector('.wall-stat-card-value')).toHaveStyle({ color: light.foreground });
    rerender(renderPanel(dark));
    expect(container.querySelector('.wall-stat-card-value')).toHaveStyle({ color: dark.foreground });
    expect(container.textContent).toBe(originalText);
    expect(JSON.stringify(props.options)).toBe(originalOptions);
    expect(JSON.stringify(props.fieldConfig)).toBe(originalConfig);
    expect(props.onOptionsChange).not.toHaveBeenCalled();
    expect(props.onFieldConfigChange).not.toHaveBeenCalled();
    rerender(renderPanel(undefined));
    expect(container.querySelector('[data-viz-presentation="wall-stat-card"]')).not.toBeInTheDocument();
    expect(container.textContent).toBe(originalText);
  });

  it('uses the existing mapping results for OK/WARN badges, preserving their text and original mappings', () => {
    const field: FieldConfig = {
      mappings: [
        { type: MappingType.ValueToText, options: { '0': { text: 'WARN', color: 'orange' } } },
        { type: MappingType.RangeToText, options: { from: 1, to: 9999, result: { text: 'OK', color: 'green' } } },
      ],
    };
    const snapshot = JSON.stringify(field);
    const props = makeProps(1, field);
    props.options.colorMode = BigValueColorMode.Value;
    const { rerender } = render(
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    expect(screen.getByText('OK').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'status');
    const warning = makeProps(0, field);
    warning.options.colorMode = BigValueColorMode.Value;
    rerender(
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...warning} />
      </StatCardPresentationContext.Provider>
    );
    expect(screen.getByText('WARN').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'status');
    expect(JSON.stringify(field)).toBe(snapshot);
  });

  it('keeps links, tooltips and explicit font sizes, and does not invent a trend', () => {
    const onClick = jest.fn();
    render(
      <BigValue
        width={220}
        height={110}
        theme={createTheme()}
        statPresentation={light}
        value={{ text: '24', numeric: 24, suffix: ' vCPU', title: 'CPU' }}
        colorMode={BigValueColorMode.None}
        graphMode={BigValueGraphMode.None}
        textMode={BigValueTextMode.Value}
        text={{ valueSize: 42 }}
        onClick={onClick}
      />
    );
    expect(screen.getByText('24').closest('.wall-stat-card-value')).toHaveStyle({ fontSize: 42 });
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'CPU');
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.querySelector('canvas')).toBeNull();
    expect(button.textContent).toBe('24 vCPU');
  });

  it('keeps a numeric value as a metric when its mapping changes color only', () => {
    const props = makeProps(24, {
      mappings: [{ type: MappingType.RangeToText, options: { from: 1, to: 100, result: { color: 'green' } } }],
    });
    props.options.colorMode = BigValueColorMode.Value;
    render(
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    expect(screen.getByText('24').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'metric');
  });

  it('leaves missing data neutral and keeps the text-mode-none visualization empty', () => {
    const { container, rerender } = render(
      <BigValue
        width={200}
        height={110}
        theme={createTheme()}
        statPresentation={light}
        value={{ text: 'No data', numeric: NaN, color: 'green' }}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.None}
      />
    );
    expect(screen.getByText('No data').closest('[data-wall-stat-kind]')).toHaveAttribute(
      'data-wall-stat-kind',
      'empty'
    );
    expect(container.querySelector('[data-wall-stat-indicator]')).toBeNull();
    rerender(
      <BigValue
        width={200}
        height={110}
        theme={createTheme()}
        statPresentation={light}
        isValueMapped
        value={{ text: 'OK', numeric: 1, color: 'green' }}
        colorMode={BigValueColorMode.Value}
        graphMode={BigValueGraphMode.None}
        textMode={BigValueTextMode.None}
      />
    );
    expect(container.textContent).toBe('');
    expect(container.querySelector('[data-wall-stat-indicator]')).toBeNull();
  });
});
