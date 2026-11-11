import { fireEvent, render, screen } from '@testing-library/react';

import { createTheme } from '@grafana/data';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { AnnotationTooltip2 } from 'app/plugins/panel/timeseries/plugins/annotations2/AnnotationTooltip2';

import { wallTimeSeriesTokens } from '../chartTokens';

import { WallAnnotationDetails } from './WallAnnotationDetails';
import { annotationLabel, groupAnnotationMarkers, WallAnnotation } from './annotationModel';

const tokens = wallTimeSeriesTokens(createTheme());
const event = (key: string, left: number, right = left, wip = false): WallAnnotation => ({
  key,
  left,
  right,
  wip,
  region: right > left,
  color: key === 'a' ? '#2563eb' : '#d97706',
  index: 0,
  values: { time: [1000], timeEnd: [2000], text: [`<b>${key}</b>`], tags: [['qa']] },
});

it('groups overlapping marker hit areas without changing events, row references, colors or source order', () => {
  const a = event('a', 30);
  const b = event('b', 40, 90);
  const c = event('c', 160);
  const input = [c, b, a];
  const groups = groupAnnotationMarkers(input);
  expect(groups).toEqual([[a, b], [c]]);
  expect(input).toEqual([c, b, a]);
  expect(groups[0][0]).toBe(a);
  expect(groups[0][1].values).toBe(b.values);
  expect(groups[0].map((e) => e.color)).toEqual(['#2563eb', '#d97706']);
  expect(b.values.timeEnd).toEqual([2000]);
});

it('keeps new annotation editing separate and preserves plain full labels', () => {
  const a = event('a', 30);
  const wip = event('new', 31, 31, true);
  expect(groupAnnotationMarkers([a, wip])).toEqual([[a], [wip]]);
  expect(annotationLabel(a)).toBe('a');
});

it('distinguishes point and period times, sanitizes text and delegates native actions', () => {
  const edit = jest.fn();
  const remove = jest.fn();
  const { container, rerender } = render(
    <WallAnnotationDetails
      start="2026-11-05 10:00:00"
      end="2026-11-05 10:05:00"
      html={'<b>배포</b><script>alert(1)</script>'}
      alertText=""
      tags={['운영']}
      tokens={tokens}
      onEdit={edit}
      onDelete={remove}
    />
  );
  expect(screen.getByText('기간 이벤트')).toBeInTheDocument();
  expect(screen.getByText('→ 2026-11-05 10:05:00')).toBeInTheDocument();
  expect(container.querySelector('script')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '주석 편집' }));
  fireEvent.click(screen.getByRole('button', { name: '주석 삭제' }));
  expect(edit).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
  rerender(<WallAnnotationDetails start="10:00" html="상태" alertText="" tags={[]} tokens={tokens} />);
  expect(screen.getByText('시점 이벤트')).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('uses native annotation timestamp, tags and permission defaults in Wall presentation', () => {
  render(
    <TimeSeriesPresentationContext.Provider value={tokens}>
      <AnnotationTooltip2
        annoVals={{
          time: [1700000000000],
          timeEnd: [1700000060000],
          isRegion: [true],
          title: ['실제 이벤트'],
          text: ['설명'],
          tags: [['release']],
        }}
        annoIdx={0}
        timeZone="utc"
        onEdit={jest.fn()}
      />
    </TimeSeriesPresentationContext.Provider>
  );
  expect(screen.getByText('기간 이벤트')).toBeInTheDocument();
  expect(screen.getByText('release')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '주석 편집' })).not.toBeInTheDocument();
  expect(document.querySelectorAll('time')).toHaveLength(2);
});
