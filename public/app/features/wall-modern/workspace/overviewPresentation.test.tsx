import { fireEvent, render, screen } from '@testing-library/react';
import $ from 'jquery';

import { createTheme, LoadingState } from '@grafana/data';
import { Gauge } from '@grafana/ui/src/components/Gauge/Gauge';
import { PanelChrome } from '@grafana/ui/src/components/PanelChrome/PanelChrome';

import { overviewChartTokens, OverviewPanelPresentation, overviewPanelRole } from './overviewPresentation';

jest.mock('jquery', () => ({ plot: jest.fn() }));

it('replaces the actual panel header with shadcn slots and keeps native title items and errors while removing duplicate native menu DOM', () => {
  const onOpen = jest.fn();
  const inspect = jest.fn();
  const { container } = render(
    <OverviewPanelPresentation id={140}>
      <PanelChrome
        title="CPU"
        width={400}
        height={280}
        titleItems={<span>Native annotation</span>}
        loadingState={LoadingState.Loading}
        statusMessage="Query error"
        statusMessageOnClick={inspect}
        onOpenMenu={onOpen}
        menu={<div>Native menu</div>}
      >
        {(width, height) => (
          <div data-testid="dimensions">
            {width}×{height}
          </div>
        )}
      </PanelChrome>
    </OverviewPanelPresentation>
  );
  expect(screen.getAllByText('CPU')).toHaveLength(1);
  expect(container.querySelector('[data-slot="card-title"]')).toHaveTextContent('CPU');
  expect(screen.getByText('Native annotation')).toBeInTheDocument();
  expect(screen.getByTestId('dimensions')).toHaveTextContent('382×218');
  fireEvent.click(screen.getByLabelText('Panel status'));
  expect(inspect).toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'CPU 메뉴' })).not.toBeInTheDocument();
  expect(screen.queryByText('Native menu')).not.toBeInTheDocument();
  expect(onOpen).not.toHaveBeenCalled();
});

it('keeps gauge numeric geometry, formatted units, thresholds and data links while replacing only the readout', () => {
  const value = { numeric: 68, text: '68.00', suffix: '%', color: 'green' };
  const field = { min: 0, max: 100 };
  const click = jest.fn();
  const { container } = render(
    <OverviewPanelPresentation id={38}>
      <Gauge
        width={200}
        height={155}
        value={value}
        field={field}
        theme={createTheme()}
        onClick={click}
        showThresholdLabels={false}
        showThresholdMarkers={true}
      />
    </OverviewPanelPresentation>
  );
  expect(container.querySelector('.wall-overview-gauge-value')).toHaveTextContent('68.00%');
  const [, series, options] = jest.mocked($.plot).mock.calls.at(-1) as unknown as [
    unknown,
    Array<{ data: number[][] }>,
    {
      series: {
        gauges: {
          gauge: { min: number; max: number };
          threshold: { show: boolean };
          value: { formatter: () => string };
        };
      };
    },
  ];
  expect(series[0].data).toEqual([[0, 68]]);
  expect(options.series.gauges.gauge.min).toBe(0);
  expect(options.series.gauges.gauge.max).toBe(100);
  expect(options.series.gauges.threshold.show).toBe(true);
  expect(options.series.gauges.value.formatter()).toBe('');
  fireEvent.click(screen.getByRole('button'));
  expect(click).toHaveBeenCalled();
  expect(field).toEqual({ min: 0, max: 100 });
});

it('assigns information roles independently of panel type, and only provides an overview chart token set', () => {
  expect(overviewPanelRole(28)).toBe('resources');
  expect(overviewPanelRole(242)).toBe('services');
  expect(overviewPanelRole(32)).toBe('usage');
  expect(overviewPanelRole(901)).toBe('additional');
  expect(overviewChartTokens(createTheme()).gridDash).toEqual([]);
});
