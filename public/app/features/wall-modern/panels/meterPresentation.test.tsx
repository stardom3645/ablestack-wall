import { fireEvent, render, screen } from '@testing-library/react';

import {
  createTheme,
  ThemeContext,
  FieldColorModeId,
  MappingType,
  FieldDisplay,
  FieldConfigSource,
  ThresholdsMode,
  VizOrientation,
  DataFrameView,
  toDataFrame,
} from '@grafana/data';
import { BarGaugeDisplayMode, BarGaugeNamePlacement, BarGaugeValueMode } from '@grafana/schema';
import { BarGauge } from '@grafana/ui/src/components/BarGauge/BarGauge';
import { DEFAULT_THRESHOLDS } from '@grafana/ui/src/components/Gauge/utils';
import { VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallTypography } from '../typography';
import { wallVisualization } from '../visualization';

import { WallGauge } from './WallGauge';
import { meterAppearance, meterColors, meterInterval, meterSegments } from './meterPresentation';
import { wallMeterTokens } from './meterTokens';

const theme = createTheme({ colors: { mode: 'light' } });
const field = {
  min: 0,
  max: 100,
  unit: 'percent',
  color: { mode: FieldColorModeId.Thresholds },
  thresholds: DEFAULT_THRESHOLDS,
};
const value: FieldDisplay = {
  name: 'lastNotNull',
  field,
  display: { text: '68.00', numeric: 68, suffix: '%', title: '평균', color: 'green' },
  hasLinks: false,
};
const empty: FieldConfigSource = { defaults: {}, overrides: [] };
const appearance = meterAppearance(value, empty, [], {});

it('uses Cobalt only for established implicit defaults; protects ambiguous persisted native presets until an explicit Wall choice', () => {
  expect(appearance.colorSource).toBe('default');
  expect(meterColors(value.display, appearance, theme)[0]).toBe('#3c63e6');
  expect(meterAppearance(value, { defaults: field, overrides: [] }, [], {}).colorSource).toBe('configured');
  expect(meterAppearance(value, { defaults: field, overrides: [] }, [], { wallGaugeTheme: 'teal' }).colorSource).toBe(
    'default'
  );
  const alert = { ...value, display: { ...value.display, numeric: 90, color: 'red' } };
  const policy = meterAppearance(alert, { defaults: field, overrides: [] }, [], { wallGaugeTheme: 'cobalt' });
  expect(policy.colorSource).toBe('configured');
  expect(meterColors(alert.display, policy, theme)[0]).toBe(theme.visualization.getColorByName('red'));
});
it('keeps custom 75/85 thresholds, explicit green, matched overrides and mapped colors with every palette', () => {
  const custom = {
    ...field,
    thresholds: {
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'rgba(50, 172, 45, 0.97)' },
        { value: 75, color: 'orange' },
        { value: 85, color: 'red' },
      ],
    },
  };
  const frame = toDataFrame({ fields: [{ name: 'host', values: [68], config: field }] });
  const linked = { ...value, view: new DataFrameView(frame), colIndex: 0 };
  for (const key of Object.keys(wallMeterTokens.palettes)) {
    const options = { wallGaugeTheme: key as 'cobalt' };
    expect(
      meterAppearance({ ...value, field: custom }, { defaults: custom, overrides: [] }, [], options).colorSource
    ).toBe('configured');
    expect(
      meterAppearance(
        { ...value, field: { ...field, color: { mode: FieldColorModeId.Fixed, fixedColor: 'green' } } },
        empty,
        [],
        options
      ).colorSource
    ).toBe('configured');
    expect(
      meterAppearance(
        linked,
        {
          defaults: {},
          overrides: [
            {
              matcher: { id: 'byName', options: 'host' },
              properties: [{ id: 'color', value: { mode: 'fixed', fixedColor: 'green' } }],
            },
          ],
        },
        [frame],
        options
      ).colorSource
    ).toBe('configured');
  }
});
it('preserves an active mapped color instead of substituting a decorative palette', () => {
  const mapped: FieldDisplay = {
    ...value,
    field: {
      ...field,
      mappings: [{ type: MappingType.ValueToText, options: { '68': { text: 'Mapped', color: 'green' } } }],
    },
  };
  expect(meterAppearance(mapped, empty, [], { wallGaugeTheme: 'teal' }).colorSource).toBe('configured');
});

it('formats actual absolute and percentage intervals without inventing normal/warning labels', () => {
  expect(meterInterval(field, value.display, theme, true)).toContain('80');
  expect(meterInterval(field, { ...value.display, numeric: 90 }, theme, true)).toContain('≥');
  expect(
    meterInterval(
      { ...field, max: 1, unit: 'percentunit', thresholds: { ...DEFAULT_THRESHOLDS, mode: ThresholdsMode.Percentage } },
      { ...value.display, numeric: 0.9, percent: 0.9 },
      theme,
      true
    )
  ).toBe('≥ 80%');
  expect(meterInterval(field, { text: 'N/A', numeric: NaN }, theme, true)).toBeUndefined();
});
it.each(['ring', 'arc', 'semi'] as const)(
  'retains formatted value/label and scale with the %s display shape',
  (shape) => {
    const original = JSON.stringify(value);
    const { container } = render(
      <WallGauge
        width={180}
        height={160}
        value={value.display}
        field={field}
        theme={theme}
        showThresholdMarkers
        showThresholdLabels={false}
        wallAppearance={{ ...appearance, shape }}
      />
    );
    expect(screen.getByText('68.00')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
    expect(screen.getByText('평균')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', shape === 'semi' ? '0 0 100 64' : '0 0 100 100');
    expect(JSON.stringify(value)).toBe(original);
  }
);
it('reuses native BarGauge click/hidden-value/showUnfilled/left-name and exact ratio, without a gradient or data mutation', () => {
  const click = jest.fn();
  const { container, rerender } = render(
    <VizPresentationContext.Provider value={wallVisualization(theme, wallTypography.family)}>
      <BarGauge
        width={280}
        height={120}
        field={field}
        value={value.display}
        theme={theme}
        displayMode={BarGaugeDisplayMode.Basic}
        orientation={VizOrientation.Horizontal}
        namePlacement={BarGaugeNamePlacement.Left}
        showUnfilled
        onClick={click}
        wallAppearance={appearance}
      />
    </VizPresentationContext.Provider>
  );
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '68');
  expect(container.querySelector('[data-wall-meter-fill]')).toHaveStyle({ width: '68%' });
  fireEvent.click(screen.getByRole('button'));
  expect(click).toHaveBeenCalledTimes(1);
  rerender(
    <VizPresentationContext.Provider value={wallVisualization(theme, wallTypography.family)}>
      <BarGauge
        width={80}
        height={180}
        field={field}
        value={value.display}
        theme={theme}
        displayMode={BarGaugeDisplayMode.Basic}
        orientation={VizOrientation.Vertical}
        valueDisplayMode={BarGaugeValueMode.Hidden}
        showUnfilled={false}
        wallAppearance={appearance}
      />
    </VizPresentationContext.Provider>
  );
  expect(screen.queryByText('68.00')).not.toBeInTheDocument();
  expect(container.querySelector('[data-wall-meter-fill]')).toHaveStyle({ height: '68%' });
  expect(screen.getByRole('meter')).toHaveStyle({ background: 'transparent' });
});

it('preserves threshold-range mode as contiguous exact ranges and lets mapped colors win', () => {
  const fieldWithSteps = {
    ...field,
    thresholds: {
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'green' },
        { value: 35, color: 'orange' },
        { value: 40, color: 'red' },
      ],
    },
  };
  const original = JSON.stringify(fieldWithSteps);
  const parts = meterSegments(fieldWithSteps, { text: '50', numeric: 50 }, 0, 100, theme);
  parts.forEach((part, index) => expect(part.size).toBeCloseTo([0.7, 0.1, 0.2][index]));
  expect(parts.map((part) => part.color)).toEqual(
    ['green', 'orange', 'red'].map((color) => theme.visualization.getColorByName(color))
  );
  expect(JSON.stringify(fieldWithSteps)).toBe(original);
  expect(
    meterSegments(
      {
        ...fieldWithSteps,
        mappings: [{ type: MappingType.ValueToText, options: { '50': { color: 'blue', text: 'Mapped' } } }],
      },
      { text: '50', numeric: 50 },
      0,
      100,
      theme
    )
  ).toEqual([]);
});

it('presents saved LCD mode as thin flat cells, preserving native threshold colors, values and links', () => {
  const click = jest.fn();
  const original = JSON.stringify(field);
  const source = { ...value.display, numeric: 13, text: '13.0', title: 'ablecube22-1' };
  const display = (n: number) => ({
    text: String(n),
    numeric: n,
    color: n >= 85 ? 'red' : n >= 75 ? 'orange' : 'green',
  });
  const node = (vertical = false) => (
    <ThemeContext.Provider value={theme}>
      <VizPresentationContext.Provider value={wallVisualization(theme, wallTypography.family)}>
        <BarGauge
          width={300}
          height={vertical ? 200 : 64}
          field={field}
          value={source}
          theme={theme}
          display={display}
          displayMode={BarGaugeDisplayMode.Lcd}
          orientation={vertical ? VizOrientation.Vertical : VizOrientation.Horizontal}
          onClick={click}
          showUnfilled
          wallAppearance={{ colorSource: 'configured' }}
        />
      </VizPresentationContext.Provider>
    </ThemeContext.Provider>
  );
  const { container, rerender } = render(node());
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '13.0%');
  expect(screen.getByText('ablecube22-1')).toHaveAttribute('title', 'ablecube22-1');
  expect(screen.getByText('13.0')).toBeInTheDocument();
  expect(screen.getByRole('meter')).toHaveStyle({ height: `${wallMeterTokens.segmentThickness}px` });
  const cells = Array.from(container.querySelectorAll<HTMLElement>('[data-wall-meter-cell]'));
  expect(cells.length).toBeGreaterThan(1);
  cells.forEach((cell, i) => {
    expect(cell.dataset.wallMeterCell).toBe((100 / cells.length) * i < 13 ? 'filled' : 'empty');
    expect(cell.style.backgroundImage).toBe('');
    if (cell.dataset.wallMeterCell === 'empty') {
      expect(cell).toHaveStyle({ background: wallMeterTokens.lightTrack });
    }
  });
  fireEvent.click(screen.getByRole('button'));
  expect(click).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(field)).toBe(original);
  rerender(node(true));
  expect(screen.getByRole('meter')).toHaveStyle({ width: `${wallMeterTokens.segmentThickness}px` });
  expect(container.querySelector('[data-wall-meter-lcd]')).toHaveStyle({ flexDirection: 'column-reverse' });
});
