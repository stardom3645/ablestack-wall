import { render } from '@testing-library/react';
import { Subject } from 'rxjs';

import { DataHoverEvent, DataHoverClearEvent, toDataFrame } from '@grafana/data';

import { LegendFocusPlugin } from './LegendFocusPlugin';

it('focuses only this panel’s uniquely named series through the native plot API and restores it on leave', () => {
  const hover = new Subject<unknown>(),
    clear = new Subject<unknown>();
  const bus = { getStream: (event: unknown) => (event === DataHoverEvent ? hover : clear) };
  const hooks: Record<string, Function> = {};
  const config = {
    addHook: (name: string, hook: Function) => {
      hooks[name] = hook;
    },
    getSeries: () => [1, 2].map((fieldIndex) => ({ props: { dataFrameFieldIndex: { frameIndex: 0, fieldIndex } } })),
  };
  const frame = toDataFrame({
    fields: [
      { name: 'Time', values: [0, 1] },
      { name: 'A', values: [1, 2] },
      { name: 'B', values: [3, 4] },
    ],
  });
  const plot = { setSeries: jest.fn(), series: [{}, { show: true }, { show: true }] };
  const { unmount } = render(
    <LegendFocusPlugin
      config={config as unknown as Parameters<typeof LegendFocusPlugin>[0]['config']}
      frames={[frame]}
      eventBus={bus as unknown as Parameters<typeof LegendFocusPlugin>[0]['eventBus']}
    />
  );
  hooks.ready(plot);
  hover.next({ origin: {}, payload: { dataId: 'A' } });
  hover.next({ origin: bus, payload: { dataId: 'A', point: { time: 10 } } });
  expect(plot.setSeries).not.toHaveBeenCalled();
  hover.next({ origin: bus, payload: { dataId: 'A' } });
  expect(plot.setSeries).toHaveBeenLastCalledWith(1, { focus: true }, false);
  clear.next({ origin: bus, payload: { dataId: 'A' } });
  expect(plot.setSeries).toHaveBeenLastCalledWith(null, { focus: true }, false);
  hover.next({ origin: bus, payload: { dataId: 'B' } });
  expect(plot.setSeries).toHaveBeenLastCalledWith(2, { focus: true }, false);
  unmount();
  expect(hover.observed).toBe(false);
  expect(clear.observed).toBe(false);
  expect(frame.fields[1].values).toEqual([1, 2]);
});
