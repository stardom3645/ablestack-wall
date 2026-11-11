import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTheme, type StandardEditorProps } from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';

import { wallTimeSeriesTokens } from '../chartTokens';

import { WallMetricTypeEditor } from './WallMetricTypeEditor';
import { WallSeriesLegendItem } from './WallSeriesLegendItem';
import { WallTimeSeriesTooltip } from './WallTimeSeriesTooltip';
import { metricPresentation, metricProfile, metricProfiles, type MetricType } from './metricProfiles';

const tokens = wallTimeSeriesTokens(createTheme());

it('falls back without mutating unknown or missing saved options and shares one palette/renderer', () => {
  expect(metricProfile(undefined).value).toBe('auto');
  expect(metricProfile('future').value).toBe('auto');
  for (const profile of metricProfiles) {
    const projected = metricPresentation(tokens, profile.value);
    expect(projected.palette).toBe(tokens.palette);
    expect(projected.renderLegendItem).toBe(tokens.renderLegendItem);
    expect(projected.fontFamily).toBe(tokens.fontFamily);
  }
});

it('only writes an explicitly selected profile, using a real accessible Base UI select', async () => {
  const onChange = jest.fn();
  render(<WallMetricTypeEditor {...({ value: undefined, onChange } as unknown as StandardEditorProps<MetricType>)} />);
  await userEvent.click(screen.getByRole('combobox', { name: '지표 유형 선택' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(await screen.findAllByRole('option')).toHaveLength(7);
  await userEvent.click(screen.getByRole('option', { name: '네트워크' }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('network');
});

it('shows the supplied real timestamp and native formatted values, retaining footer actions', () => {
  render(
    <WallTimeSeriesTooltip
      tokens={tokens}
      header={{ label: '', value: '2026-11-04 01:02:03' }}
      timestamp={1793754123000}
      items={[
        { label: '읽기', value: '1.25 GiB/s', color: tokens.palette[0], isActive: true },
        { label: '쓰기', value: '0 B/s', color: tokens.palette[1] },
      ]}
      isPinned={false}
      scrollable={false}
      footer={<button>데이터 링크</button>}
    />
  );
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('1.25 GiB/s')).toBeVisible();
  expect(screen.getByText('0 B/s')).toBeVisible();
  expect(screen.getByText('2026-11-04 01:02:03').tagName).toBe('TIME');
  expect(screen.getByRole('button', { name: '데이터 링크' })).toBeVisible();
});

it('retains legend stats and full names, and delegates click/keyboard/hover to native handlers', async () => {
  const clicked = jest.fn(),
    hover = jest.fn();
  const item = {
    label: '아주 긴 원본 시리즈 이름을 생략해도 전체 이름은 유지',
    color: tokens.palette[0],
    yAxis: 1,
    getDisplayValues: () => [{ numeric: 2.5, text: '2.50', suffix: ' ms', title: 'Max' }],
  };
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <table>
        <tbody>
          <WallSeriesLegendItem
            item={item}
            displayMode={LegendDisplayMode.Table}
            onLabelClick={clicked}
            onLabelMouseOver={hover}
          />
        </tbody>
      </table>
    </TimeSeriesPresentationContext.Provider>
  );
  const button = screen.getByRole('button', { name: item.label });
  expect(button).toHaveAttribute('title', item.label);
  expect(screen.getByRole('cell', { name: /2\.50 ms/ })).toBeVisible();
  await userEvent.click(button);
  expect(clicked).toHaveBeenCalledWith(item, expect.anything());
  await button.focus();
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(clicked).toHaveBeenCalledTimes(2));
  expect(hover).toHaveBeenCalled();
});
