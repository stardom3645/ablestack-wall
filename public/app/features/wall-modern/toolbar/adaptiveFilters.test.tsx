import { fireEvent, render } from '@testing-library/react';

import { rangeUtil } from '@grafana/data';

import { WallAdaptiveFilters, fitFilters } from './WallAdaptiveFilters';
import { wallTimeLabel } from './WallTimeRangeControl';

it('fits measured controls as a prefix, reserves overflow and restores all at wider widths', () => {
  expect(fitFilters(600, [120, 180, 160], 86)).toBe(3);
  expect(fitFilters(400, [120, 180, 160], 86)).toBe(2);
  expect(fitFilters(250, [120, 180, 160], 86)).toBe(1);
  expect(fitFilters(100, [120, 180], 86)).toBe(0);
  expect(fitFilters(600, [], 86)).toBe(0);
});

it('localizes relative display only and preserves absolute/native range formatting', () => {
  expect(wallTimeLabel(rangeUtil.convertRawToRange({ from: 'now-1h', to: 'now' }))).toBe('최근 1시간');
  expect(wallTimeLabel(rangeUtil.convertRawToRange({ from: 'now/d', to: 'now/d' }))).toBeUndefined();
});

it('coalesces blur measurements and cancels the pending frame on unmount', () => {
  const frame = jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(125);
  const cancel = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  const view = render(<WallAdaptiveFilters items={[{ key: 'a', node: <input aria-label="filter" /> }]} />);
  fireEvent.blur(view.getByLabelText('filter'));
  fireEvent.blur(view.getByLabelText('filter'));
  expect(frame).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(cancel).toHaveBeenCalledWith(125);
  frame.mockRestore();
  cancel.mockRestore();
});
