import { render } from '@testing-library/react';
import { Subject } from 'rxjs';

import { DataHoverEvent, DataHoverClearEvent, toDataFrame } from '@grafana/data';

import { EventBusPlugin } from './EventBusPlugin';

it('ignores legend callbacks before init and after cleanup during shared-tooltip plot replacement', () => {
  jest.useFakeTimers();
  const hover = new Subject<unknown>(),
    clear = new Subject<unknown>(),
    legacy = new Subject<unknown>();
  const bus = {
    publish: jest.fn(),
    getStream: (type: unknown) => (type === DataHoverEvent ? hover : type === DataHoverClearEvent ? clear : legacy),
  };
  const hooks: Record<string, Function> = {};
  const config = {
    addHook: (name: string, callback: Function) => {
      hooks[name] = callback;
    },
  };
  const frame = toDataFrame({
    fields: [
      { name: 'Time', values: [1000] },
      { name: 'A', values: [2] },
    ],
  });
  const view = render(
    <EventBusPlugin
      config={config as unknown as Parameters<typeof EventBusPlugin>[0]['config']}
      eventBus={bus as unknown as Parameters<typeof EventBusPlugin>[0]['eventBus']}
      frame={frame}
    />
  );
  expect(() => hooks.setLegend()).not.toThrow();
  expect(bus.publish).not.toHaveBeenCalled();
  const plot = {
    cursor: { event: {}, idxs: [0, 0], top: 20 },
    data: [[1000], [2]],
    rect: { height: 100 },
    setCursor: jest.fn(),
  };
  hooks.init(plot);
  hooks.setSeries(plot, 1);
  hooks.setLegend();
  expect(bus.publish).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(() => hooks.setLegend()).not.toThrow();
  jest.runOnlyPendingTimers();
  expect(bus.publish).toHaveBeenCalledTimes(1);
  expect(hover.observed).toBe(false);
  expect(clear.observed).toBe(false);
  expect(legacy.observed).toBe(false);
  expect(frame.fields[1].values).toEqual([2]);
  jest.useRealTimers();
});

it('marks external timestamp updates passive even when uPlot retains a previous local event', () => {
  const hover = new Subject<unknown>(),
    clear = new Subject<unknown>(),
    legacy = new Subject<unknown>();
  const bus = {
    publish: jest.fn(),
    getStream: (type: unknown) => (type === DataHoverEvent ? hover : type === DataHoverClearEvent ? clear : legacy),
  };
  const hooks: Record<string, Function> = {};
  const config = {
    addHook: (name: string, callback: Function) => {
      hooks[name] = callback;
    },
  };
  const view = render(
    <EventBusPlugin
      config={config as unknown as Parameters<typeof EventBusPlugin>[0]['config']}
      eventBus={bus as unknown as Parameters<typeof EventBusPlugin>[0]['eventBus']}
    />
  );
  const previous = new MouseEvent('mousemove');
  const plot = {
    cursor: { event: previous, idxs: [0, 0], top: 20 },
    data: [[1000], [2]],
    scales: { x: { min: 0, max: 2000 } },
    rect: { height: 100 },
    valToPos: jest.fn(() => 80),
    setCursor: jest.fn(),
  };
  const receivedEvents: Array<MouseEvent | undefined> = [];
  plot.setCursor.mockImplementation(() => {
    receivedEvents.push(plot.cursor.event);
    hooks.setLegend();
  });
  hooks.init(plot);
  hover.next(new DataHoverEvent({ point: { time: 1000 } }));
  expect(plot.setCursor).toHaveBeenCalledWith({ left: 80, top: 50 });
  expect(receivedEvents).toEqual([undefined]);
  expect(plot.cursor.event).toBe(previous);
  expect(bus.publish).not.toHaveBeenCalled();
  clear.next(new DataHoverClearEvent());
  expect(receivedEvents).toEqual([undefined, undefined]);
  view.unmount();
  expect(hover.observed).toBe(false);
});
