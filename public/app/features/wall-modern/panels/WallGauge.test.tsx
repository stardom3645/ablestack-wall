import { fireEvent, render, screen } from '@testing-library/react';
import $ from 'jquery';

import { createTheme, FieldColorModeId, ThemeContext, ThresholdsMode } from '@grafana/data';
import { Gauge, Props } from '@grafana/ui/src/components/Gauge/Gauge';
import { VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallTypography } from '../typography';
import { wallVisualization } from '../visualization';

import { gaugeScale, WallGauge } from './WallGauge';

jest.mock('jquery', () => ({ plot: jest.fn() }));
const theme = createTheme();
const props: Props = {
  width: 140,
  height: 112,
  theme,
  showThresholdLabels: false,
  showThresholdMarkers: true,
  field: {
    min: 0,
    max: 100,
    color: { mode: FieldColorModeId.Thresholds },
    thresholds: {
      mode: ThresholdsMode.Absolute,
      steps: [
        { value: -Infinity, color: 'green' },
        { value: 75, color: 'orange' },
        { value: 85, color: 'red' },
      ],
    },
  },
  value: { text: '24.00', suffix: '%', numeric: 24, title: '평균', color: 'green' },
};
const presentation = wallVisualization(theme, wallTypography.family);
it('renders formatted units, threshold ticks and native click without editing source data', () => {
  const original = JSON.stringify(props);
  const click = jest.fn();
  const { container } = render(
    <VizPresentationContext.Provider value={presentation}>
      <Gauge {...props} onClick={click} />
    </VizPresentationContext.Provider>
  );
  expect(screen.getByText('24.00')).toBeInTheDocument();
  expect(screen.getByText('%')).toBeInTheDocument();
  expect(screen.getByText('평균')).toBeInTheDocument();
  expect(container.querySelectorAll('svg line')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button'));
  expect(click).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(props)).toBe(original);
});
it('matches native percentage normalization and keeps out-of-range readouts untouched', () => {
  expect(
    gaugeScale({
      ...props,
      field: { ...props.field, thresholds: { mode: ThresholdsMode.Percentage, steps: [] } },
      value: { text: '68', numeric: 12345, percent: 0.68 },
    })
  ).toMatchObject({ numeric: 68, ratio: 0.68 });
  expect(gaugeScale({ ...props, value: { text: '120', numeric: 120 } })).toMatchObject({ numeric: 120, ratio: 1 });
  expect(gaugeScale({ ...props, value: { text: 'N/A', numeric: NaN } }).ratio).toBe(0);
});
it('retains the native renderer for explicit threshold labels and neutral/bipolar gauges', () => {
  jest.mocked($.plot).mockClear();
  const { rerender } = render(
    <VizPresentationContext.Provider value={presentation}>
      <Gauge {...props} showThresholdLabels />
    </VizPresentationContext.Provider>
  );
  expect($.plot).toHaveBeenCalled();
  jest.mocked($.plot).mockClear();
  rerender(
    <VizPresentationContext.Provider value={presentation}>
      <Gauge {...props} field={{ ...props.field, custom: { neutral: 0 } }} />
    </VizPresentationContext.Provider>
  );
  expect($.plot).toHaveBeenCalled();
});

it('responds to live theme changes even when the native Gauge theme prop is a stale snapshot', () => {
  const dark = createTheme({ colors: { mode: 'dark' } });
  const light = createTheme({ colors: { mode: 'light' } });
  const { container, rerender } = render(
    <ThemeContext.Provider value={dark}>
      <WallGauge {...props} theme={light} />
    </ThemeContext.Provider>
  );
  expect(container.querySelector('circle')).toHaveAttribute('stroke', '#343e4f');
  expect(screen.getByText('24.00').parentElement!.parentElement).toHaveStyle({ color: '#f1f5fa' });
  rerender(
    <ThemeContext.Provider value={light}>
      <WallGauge {...props} theme={dark} />
    </ThemeContext.Provider>
  );
  expect(container.querySelector('circle')).toHaveAttribute('stroke', '#e9edf3');
  expect(screen.getByText('24.00').parentElement!.parentElement).toHaveStyle({ color: '#142239' });
});
