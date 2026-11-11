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
import { Sparkline } from '@grafana/ui/src/components/Sparkline/Sparkline';
import { StatPanel } from 'app/plugins/panel/stat/StatPanel';
import { Options } from 'app/plugins/panel/stat/types';

import { isStorageStatPilot, STORAGE_VM_DASHBOARD_UID, wallStatCardPresentation } from './statPresentation';
import { WallPanelContentContext } from './visualizations/WallPanelContent';

jest.mock('@grafana/ui/src/components/Sparkline/Sparkline', () => ({
  Sparkline: jest.fn(() => <div data-testid="native-stat-sparkline" />),
}));

const light = wallStatCardPresentation(createTheme({ colors: { mode: 'light' } }));
const dark = wallStatCardPresentation(createTheme({ colors: { mode: 'dark' } }));
const path = `/d/${STORAGE_VM_DASHBOARD_UID}/storage`;

describe('explicit Wall Stat presentation', () => {
  it.each([
    BigValueColorMode.Value,
    BigValueColorMode.Background,
    BigValueColorMode.BackgroundSolid,
    BigValueColorMode.None,
  ])('relocates only the native %s color when a modern style is explicitly selected', (colorMode) => {
    const props = makeProps(13, { color: { mode: 'fixed', fixedColor: '#d82f46' }, unit: 'percent', decimals: 1 });
    props.width = 435;
    props.height = 224;
    props.options.colorMode = colorMode;
    props.data.series[0].fields.push({
      ...props.data.series[0].fields.find((f) => f.type === FieldType.number)!,
      name: 'second',
    });
    const original = JSON.stringify(props.options);
    const draw = (wallStatStyle?: Options['wallStatStyle']) => (
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...props} options={{ ...props.options, wallStatStyle }} />
      </StatCardPresentationContext.Provider>
    );
    const { container, rerender } = render(draw());
    const readout = () => container.querySelector<HTMLElement>('.wall-stat-readout')!;
    const tile = () => container.querySelector<HTMLElement>('[data-viz-presentation]')!;
    const legacyBackground = tile().style.background;
    if (colorMode === BigValueColorMode.BackgroundSolid) {
      expect(legacyBackground).toBe('rgb(216, 47, 70)');
    }
    for (const style of ['soft', 'minimal'] as const) {
      rerender(draw(style));
      expect(readout()).toHaveStyle({ color: light.foreground });
      expect(readout().textContent).toBe('13.0%');
      expect(container.querySelector('[data-wall-stat-accent]') !== null).toBe(colorMode !== BigValueColorMode.None);
      if (colorMode !== BigValueColorMode.None) {
        expect(container.querySelector('[data-wall-stat-accent]')).toHaveStyle({ background: '#d82f46' });
      }
      expect(tile()).toHaveStyle({ background: 'transparent' });
      if (style === 'soft') {
        expect(container.querySelector('[data-wall-stat-surface]')).toHaveStyle({ background: light.softSurface });
      } else {
        expect(container.querySelector('[data-wall-stat-surface]')).toBeNull();
      }
      if (style === 'minimal' && colorMode !== BigValueColorMode.None) {
        expect(container.querySelector('[data-wall-stat-accent]')).toHaveStyle({
          insetInlineStart: '50%',
          transform: 'translateX(-50%)',
        });
      }
      expect(props.onOptionsChange).not.toHaveBeenCalled();
    }
    rerender(draw());
    // JSDOM does not parse native linear-gradient; its real restoration is browser-tested.
    if (colorMode !== BigValueColorMode.Background) {
      expect(tile().style.background).toBe(legacyBackground);
    }
    expect(JSON.stringify(props.options)).toBe(original);
  });

  it.each(['soft', 'minimal'] as const)(
    'keeps text mapping and Name mode without synthesizing health in %s',
    (style) => {
      const props = makeProps(0, {
        mappings: [{ type: MappingType.ValueToText, options: { '0': { text: '장애', color: 'red' } } }],
      });
      props.width = 435;
      props.height = 224;
      props.data.series[0].fields.push({
        ...props.data.series[0].fields.find((f) => f.type === FieldType.number)!,
        name: 'second',
      });
      props.options = { ...props.options, wallStatStyle: style, colorMode: BigValueColorMode.BackgroundSolid };
      const { container, rerender } = render(
        <StatCardPresentationContext.Provider value={light}>
          <StatPanel {...props} />
        </StatCardPresentationContext.Provider>
      );
      expect(container.querySelector('.wall-stat-number')).toHaveTextContent('장애');
      expect(container.querySelector('[data-wall-stat-colored]')).toBeNull();
      expect(container.querySelectorAll('[data-wall-stat-accent]')).toHaveLength(2);
      rerender(
        <StatCardPresentationContext.Provider value={light}>
          <StatPanel {...props} options={{ ...props.options, textMode: BigValueTextMode.Name }} />
        </StatCardPresentationContext.Provider>
      );
      expect(container.querySelector('.wall-stat-number')).toHaveTextContent('memory');
      expect(container.querySelector('.wall-stat-number')).not.toHaveTextContent('장애');
      expect(container.textContent).not.toContain('정상');
    }
  );

  it('uses the same modern theme on the dashboard and preview, and preserves native fallback', () => {
    const props = makeProps(0, { color: { mode: 'fixed', fixedColor: 'red' } });
    props.options = { ...props.options, wallStatStyle: 'soft', colorMode: BigValueColorMode.BackgroundSolid };
    props.data.series[0].fields.push({
      ...props.data.series[0].fields.find((f) => f.type === FieldType.number)!,
      name: 'second',
    });
    const { container, rerender } = render(
      <StatCardPresentationContext.Provider value={dark}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    expect(container.querySelector('[data-wall-stat-surface]')).toHaveStyle({ background: dark.softSurface });
    expect(container.querySelector('.wall-stat-readout')).toHaveStyle({ color: dark.foreground });
    rerender(<StatPanel {...props} />);
    expect(container.querySelector('[data-viz-presentation]')).toBeNull();
    expect(container.querySelector('[data-wall-stat-accent]')).toBeNull();
    expect(container.querySelector('div[style*="background"]')).not.toBeNull();
  });
});

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

it('renders a native Sparkline only when enabled and backed by a genuine time series', () => {
  const props = makeProps(24, { unit: 'percent', decimals: 2 });
  props.width = 280;
  props.height = 140;
  props.options.graphMode = BigValueGraphMode.Area;
  props.data.series = [
    toDataFrame({
      fields: [
        { name: 'Time', type: FieldType.time, values: [1000, 2000, 3000] },
        { name: 'Usage', type: FieldType.number, values: [10, null, 24], config: props.fieldConfig.defaults },
      ],
    }),
  ];
  const before = JSON.stringify({ options: props.options, config: props.fieldConfig });
  const draw = (p: typeof props) => (
    <StatCardPresentationContext.Provider value={light}>
      <StatPanel {...p} />
    </StatCardPresentationContext.Provider>
  );
  const { rerender } = render(draw(props));
  expect(screen.getByTestId('native-stat-sparkline')).toBeInTheDocument();
  expect(screen.getByText('24.00')).toBeInTheDocument();
  const args = jest.mocked(Sparkline).mock.calls[jest.mocked(Sparkline).mock.calls.length - 1][0];
  expect(args.sparkline!.y.values).toEqual([10, null, 24]);
  expect(args.sparkline!.x!.values).toEqual([1000, 2000, 3000]);
  expect(JSON.stringify({ options: props.options, config: props.fieldConfig })).toBe(before);
  rerender(draw({ ...props, renderCounter: 2, options: { ...props.options, graphMode: BigValueGraphMode.None } }));
  expect(screen.queryByTestId('native-stat-sparkline')).not.toBeInTheDocument();
  rerender(
    draw({ ...props, data: { ...props.data, series: [toDataFrame({ fields: [props.data.series[0].fields[1]] })] } })
  );
  expect(screen.queryByTestId('native-stat-sparkline')).not.toBeInTheDocument();
});

it('preserves field-specific color settings for UP/DOWN/IN/OUT without inferring health from counts or names', () => {
  const props = makeProps();
  props.options.colorMode = BigValueColorMode.Value;
  props.options.orientation = VizOrientation.Auto;
  props.width = 600;
  props.height = 110;
  props.data.series = [
    toDataFrame({
      fields: ['UP', 'DOWN', 'IN', 'OUT'].map((name, index) => ({
        name,
        type: FieldType.number,
        values: [index % 2 === 0 ? 9 : 0],
        config: { color: { mode: 'fixed', fixedColor: ['green', 'orange', 'green', 'red'][index] } },
      })),
    }),
  ];
  const snapshot = () =>
    JSON.stringify({
      options: props.options,
      config: props.fieldConfig,
      data: props.data.series.map((frame) =>
        frame.fields.map(({ name, values, config }) => ({ name, values, config }))
      ),
    });
  const before = snapshot();
  const draw = (legacy?: 'counts') => (
    <StatCardPresentationContext.Provider value={light}>
      <WallPanelContentContext.Provider value={legacy ? { kind: legacy } : undefined}>
        <StatPanel {...props} />
      </WallPanelContentContext.Provider>
    </StatCardPresentationContext.Provider>
  );
  const { container, rerender } = render(draw());
  const readouts = () =>
    [...container.querySelectorAll<HTMLElement>('.wall-stat-readout')].map((e) => ({
      text: e.textContent,
      color: e.style.color,
      state: e.querySelector<HTMLElement>('.wall-stat-state-dot')?.style.background,
    }));
  const dashboard = readouts();
  expect(dashboard.map((v) => v.text)).toEqual(['9', '0', '9', '0']);
  expect(container.querySelector('.wall-stat-readout')).toHaveStyle({ color: light.foreground });
  expect(dashboard[1].state).not.toBe(dashboard[3].state);
  rerender(draw('counts'));
  expect(readouts()).toEqual(dashboard);
  expect(container.querySelectorAll('.wall-stat-state-dot')).toHaveLength(4);
  expect(screen.queryByText(/정상|주의|심각/)).not.toBeInTheDocument();
  // Native reducer/range caches in field.state are expected; raw values and saved settings are immutable.
  expect(snapshot()).toBe(before);
});

it.each([1, 2, 4, 8])(
  'keeps all %i fields and legible auto-grid cells, independently of the original legacy wrapper',
  (count) => {
    const props = makeProps();
    props.width = 300;
    props.height = 120;
    props.options.orientation = VizOrientation.Auto;
    props.data.series = [
      toDataFrame({
        fields: Array.from({ length: count }, (_, i) => ({
          name: `자원 ${i}`,
          type: FieldType.number,
          values: [i + 1],
          config: { unit: 'none' },
        })),
      }),
    ];
    const { container } = render(
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    expect(container.querySelectorAll('.wall-stat-readout')).toHaveLength(count);
    expect(screen.getByLabelText('수치 항목 목록')).toHaveStyle({ height: '120px', overflowY: 'auto' });
    const cells = container.querySelectorAll('[data-viz-presentation="wall-stat-card"]');
    // Content-driven cells retain a legible value instead of a fixed 80px floor.
    expect(
      parseFloat(container.querySelector<HTMLElement>('.wall-stat-readout')!.style.fontSize)
    ).toBeGreaterThanOrEqual(25);
    expect(container.querySelector('[data-wall-display]')).toBeNull();
  }
);

it.each([BigValueTextMode.Name, BigValueTextMode.Value, BigValueTextMode.ValueAndName, BigValueTextMode.None])(
  'keeps native text mode %s and background contrast',
  (textMode) => {
    const { container } = render(
      <BigValue
        statPresentation={light}
        theme={createTheme()}
        width={180}
        height={90}
        value={{ text: '12', numeric: 12, title: '긴 자원명', color: '#1261a0', suffix: ' GiB' }}
        textMode={textMode}
        colorMode={BigValueColorMode.BackgroundSolid}
        graphMode={BigValueGraphMode.None}
      />
    );
    const panel = container.querySelector<HTMLElement>('[data-viz-presentation]')!;
    expect(panel.style.background).toBe('rgb(18, 97, 160)');
    expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
    expect(Boolean(screen.queryByText('12'))).toBe(
      textMode === BigValueTextMode.Value || textMode === BigValueTextMode.ValueAndName
    );
    expect(Boolean(screen.queryByText('긴 자원명'))).toBe(
      textMode === BigValueTextMode.Name || textMode === BigValueTextMode.ValueAndName
    );
  }
);

it('fits four short fields on one row and reflows them symmetrically only when space is insufficient', () => {
  const props = makeProps();
  props.width = 506;
  props.height = 224;
  props.options.orientation = VizOrientation.Auto;
  props.data.series = [
    toDataFrame({ fields: ['UP', 'DOWN', 'IN', 'OUT'].map((name) => ({ name, type: FieldType.number, values: [0] })) }),
  ];
  const draw = (width: number) => (
    <StatCardPresentationContext.Provider value={light}>
      <StatPanel {...props} width={width} />
    </StatCardPresentationContext.Provider>
  );
  const { container, rerender } = render(draw(435));
  const positions = () =>
    [...container.querySelectorAll<HTMLElement>('[data-viz-presentation]')].map((e) => ({
      top: e.parentElement!.style.top,
      left: e.parentElement!.style.left,
    }));
  expect(new Set(positions().map((p) => p.top)).size).toBe(1);
  rerender(draw(180));
  const cells = positions();
  expect(cells[0].top).toBe(cells[1].top);
  expect(cells[2].top).toBe(cells[3].top);
  expect(cells[2].top).not.toBe(cells[0].top);
  expect(cells[0].left).toBe(cells[2].left);
});

it('distinguishes the native no-values placeholder from a real zero and preserves explicit null mappings', () => {
  const props = makeProps(0, {});
  const draw = () => (
    <StatCardPresentationContext.Provider value={light}>
      <StatPanel {...props} />
    </StatCardPresentationContext.Provider>
  );
  const { container, rerender } = render(draw());
  expect(screen.getByText('0').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'metric');
  props.data = { ...props.data, series: [] };
  rerender(draw());
  expect(screen.getByText('No data').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'empty');
  props.fieldConfig = {
    defaults: {
      mappings: [
        { type: MappingType.SpecialValue, options: { match: 'null', result: { text: '미수집', color: 'orange' } } },
      ],
    },
    overrides: [],
  };
  props.options = { ...props.options, colorMode: BigValueColorMode.Value };
  props.renderCounter++;
  rerender(draw());
  expect(screen.getByText('미수집').closest('[data-wall-stat-kind]')).toHaveAttribute('data-wall-stat-kind', 'status');
  expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
});

describe('single Wall readout auto sizing', () => {
  const draw = (width: number, height: number, text = 'OK', count = 1, valueSize?: number) => (
    <BigValue
      width={width}
      height={height}
      count={count}
      theme={createTheme()}
      statPresentation={light}
      isValueMapped
      value={{ text, numeric: 1, color: '#37883a' }}
      colorMode={BigValueColorMode.Value}
      graphMode={BigValueGraphMode.None}
      textMode={BigValueTextMode.Value}
      text={valueSize ? { valueSize } : undefined}
    />
  );
  it('uses native auto-fit for one value without a chip and leaves repeated mappings unchanged', () => {
    const { container, rerender } = render(draw(220, 110));
    const readout = () => container.querySelector<HTMLElement>('.wall-stat-readout')!;
    const before = Number.parseFloat(readout().style.fontSize);
    expect(container.querySelector('[data-wall-stat-single]')).not.toBeNull();
    expect(container.querySelector('[data-wall-stat-colored]')).toBeNull();
    expect(readout()).toHaveStyle({ color: '#37883a' });
    rerender(draw(440, 220));
    expect(Number.parseFloat(readout().style.fontSize)).toBeGreaterThan(before);
    expect(container.querySelector('[data-wall-stat-accent]')).toBeNull();
    rerender(draw(110, 60));
    expect(Number.parseFloat(readout().style.fontSize)).toBeLessThan(before);
    expect(readout()).toHaveTextContent('OK');
    rerender(draw(440, 220, 'OK', 4));
    expect(container.querySelector('[data-wall-stat-single]')).toBeNull();
    expect(container.querySelector('[data-wall-stat-colored]')).not.toBeNull();
    rerender(draw(440, 220, 'UNKNOWN', 1, 42));
    expect(readout()).toHaveStyle({ fontSize: 42 });
    expect(readout()).toHaveTextContent('UNKNOWN');
  });
  it('distinguishes an actual string reducer value from No data without inventing a mapping', () => {
    const props = makeProps(1, { color: { mode: 'fixed', fixedColor: 'text' } });
    props.width = 220;
    props.height = 160;
    props.options = {
      ...props.options,
      graphMode: BigValueGraphMode.None,
      textMode: BigValueTextMode.Value,
      reduceOptions: { values: true, fields: '/.*/', calcs: ['lastNotNull'] },
    };
    props.data.series = [
      toDataFrame({
        fields: [{ name: 'state', type: FieldType.string, values: ['UNKNOWN'], config: props.fieldConfig.defaults }],
      }),
    ];
    const { container } = render(
      <StatCardPresentationContext.Provider value={light}>
        <StatPanel {...props} />
      </StatCardPresentationContext.Provider>
    );
    expect(container.querySelector('[data-wall-stat-single]')).not.toBeNull();
    expect(container.querySelector('.wall-stat-readout')).toHaveTextContent('UNKNOWN');
    expect(container.querySelector('.wall-stat-readout')).not.toHaveAttribute('data-wall-stat-kind', 'empty');
    expect(container.querySelector('[data-wall-stat-colored]')).toBeNull();
    expect(props.onFieldConfigChange).not.toHaveBeenCalled();
  });
  it.each(['legacy', 'soft', 'minimal'] as const)(
    'shows one actual status as text, preserving explicit background in %s',
    (wallStatStyle) => {
      const props = makeProps(1, {
        mappings: [{ type: MappingType.ValueToText, options: { '1': { text: 'OK', color: '#37883a' } } }],
      });
      props.width = 220;
      props.height = 160;
      props.options = {
        ...props.options,
        textMode: BigValueTextMode.Value,
        graphMode: BigValueGraphMode.None,
        wallStatStyle,
        colorMode: BigValueColorMode.BackgroundSolid,
      };
      const original = JSON.stringify({ options: props.options, fieldConfig: props.fieldConfig });
      const { container } = render(
        <StatCardPresentationContext.Provider value={light}>
          <StatPanel {...props} />
        </StatCardPresentationContext.Provider>
      );
      expect(container.querySelector('[data-wall-stat-colored]')).toBeNull();
      expect(container.querySelector('[data-wall-stat-accent]')).toBeNull();
      expect(container.querySelector('[data-wall-stat-surface]')).toBeNull();
      expect(container.querySelector('[data-viz-presentation]')).toHaveStyle({ background: '#37883a' });
      expect(container.querySelector('.wall-stat-number')).toHaveTextContent('OK');
      expect(JSON.stringify({ options: props.options, fieldConfig: props.fieldConfig })).toBe(original);
    }
  );
});

it('restores neutral multi-count values with the original adjacent field-color dot, without touching single values', () => {
  const draw = (count: number, suffix?: string) => (
    <BigValue
      width={180}
      height={100}
      count={count}
      theme={createTheme()}
      statPresentation={light}
      value={{ text: '3', numeric: 3, color: '#37883a', title: '실행', suffix }}
      colorMode={BigValueColorMode.Value}
      graphMode={BigValueGraphMode.None}
      textMode={BigValueTextMode.ValueAndName}
    />
  );
  const { container, rerender } = render(draw(3));
  const readout = () => container.querySelector<HTMLElement>('.wall-stat-readout')!;
  expect(readout()).toHaveStyle({ color: light.foreground });
  expect(container.querySelector('.wall-stat-state-dot')).toHaveStyle({
    width: '9px',
    height: '9px',
    background: '#37883a',
  });
  expect(container.querySelector('.wall-stat-number')).toHaveTextContent('3');
  rerender(draw(1));
  expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
  expect(readout()).toHaveStyle({ color: '#37883a' });
  rerender(draw(3, '%'));
  expect(container.querySelector('.wall-stat-state-dot')).toBeNull();
  expect(readout()).toHaveStyle({ color: '#37883a' });
});
