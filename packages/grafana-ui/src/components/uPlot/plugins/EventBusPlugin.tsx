import { throttle } from 'lodash';
import { useLayoutEffect, useRef } from 'react';
import { Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

import {
  DataFrame,
  DataHoverClearEvent,
  DataHoverEvent,
  DataHoverPayload,
  EventBus,
  LegacyGraphHoverEvent,
} from '@grafana/data';

import { UPlotConfigBuilder } from '../config/UPlotConfigBuilder';

interface EventBusPluginProps {
  config: UPlotConfigBuilder;
  eventBus: EventBus;
  frame?: DataFrame;
}

/**
 * @alpha
 */
export const EventBusPlugin = ({ config, eventBus, frame }: EventBusPluginProps) => {
  const frameRef = useRef<DataFrame | undefined>(frame);
  frameRef.current = frame;

  useLayoutEffect(() => {
    let u: uPlot | null = null;

    const payload: DataHoverPayload = {
      point: {
        time: null,
      },
      data: frameRef.current,
    };

    config.addHook('init', (_u) => {
      u = _u;
    });

    let closestSeriesIdx: number | null = null;

    config.addHook('setSeries', (u, seriesIdx) => {
      closestSeriesIdx = seriesIdx;
    });

    config.addHook('setLegend', () => {
      // uPlot can deliver a final sync callback between React cleanup and destroy.
      if (!u) {
        return;
      }
      let viaSync = u!.cursor.event == null;

      if (!viaSync) {
        let dataIdx = u!.cursor.idxs!.find((v) => v != null);

        if (dataIdx == null) {
          throttledClear();
        } else {
          let rowIdx = dataIdx;
          let colIdx = closestSeriesIdx;

          let xData = u!.data[0] ?? u!.data[1][0];

          payload.point.time = xData[rowIdx];
          payload.rowIndex = rowIdx ?? undefined;
          payload.columnIndex = colIdx ?? undefined;
          payload.data = frameRef.current;

          // used by old graph panel to position tooltip
          let top = u!.cursor.top!;
          payload.point.panelRelY = top === 0 ? 0.001 : top > 0 ? top / u!.rect.height : 1;

          throttledHover();
        }
      }
    });

    function setPassiveCursor(left: number, top: number) {
      if (!u) {
        return;
      }
      // uPlot retains the last DOM event. Received updates are never local
      // input and must not open Crosshair-mode tooltips or echo back to the bus.
      const previousEvent = u.cursor.event;
      u.cursor.event = undefined;
      try {
        u.setCursor({ left, top });
      } finally {
        u.cursor.event = previousEvent;
      }
    }

    function handleCursorUpdate(evt: DataHoverEvent | LegacyGraphHoverEvent) {
      const time = evt.payload?.point?.time;
      if (u && time != null && Number.isFinite(time)) {
        if (time < u.scales.x.min! || time > u.scales.x.max!) {
          setPassiveCursor(-10, -10);
          return;
        }
        setPassiveCursor(u.valToPos(time, 'x'), u.rect.height / 2);
      }
    }

    const subscription = new Subscription();

    const hoverEvent = new DataHoverEvent(payload).setTags(['uplot']);
    const clearEvent = new DataHoverClearEvent().setTags(['uplot']);

    let throttledHover = throttle(() => {
      eventBus.publish(hoverEvent);
    }, 100);

    let throttledClear = throttle(() => {
      eventBus.publish(clearEvent);
    }, 100);

    subscription.add(
      eventBus.getStream(DataHoverEvent).subscribe({
        next: (evt) => {
          // ignore uplot-emitted events, since we already use uPlot's sync
          if (eventBus === evt.origin || evt.tags?.has('uplot')) {
            return;
          }

          handleCursorUpdate(evt);
        },
      })
    );

    // Legacy events (from flot graph)
    subscription.add(
      eventBus.getStream(LegacyGraphHoverEvent).subscribe({
        next: (evt) => handleCursorUpdate(evt),
      })
    );

    subscription.add(
      eventBus
        .getStream(DataHoverClearEvent)
        .pipe(throttleTime(50)) // dont throttle here, throttle on emission
        .subscribe({
          next: (evt) => {
            // ignore uplot-emitted events, since we already use uPlot's sync
            if (eventBus === evt.origin || evt.tags?.has('uplot')) {
              return;
            }

            // @ts-ignore
            if (u && !u.cursor._lock) {
              setPassiveCursor(-10, -10);
            }
          },
        })
    );

    return () => {
      throttledHover.cancel();
      throttledClear.cancel();
      subscription.unsubscribe();
      u = null;
    };
  }, [config, eventBus]);

  return null;
};
