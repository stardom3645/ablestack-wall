import { useLayoutEffect, useRef } from 'react';

import { DataFrame, DataHoverEvent, DataHoverClearEvent, EventBus, getFieldDisplayName } from '@grafana/data';

import { UPlotConfigBuilder } from '../config/UPlotConfigBuilder';

/** Consume this panel's existing legend events. Does not publish hover/cursor events. */
export function LegendFocusPlugin({
  config,
  frames,
  eventBus,
}: {
  config: UPlotConfigBuilder;
  frames: DataFrame[];
  eventBus: EventBus;
}) {
  const currentFrames = useRef(frames);
  currentFrames.current = frames;
  useLayoutEffect(() => {
    let plot: uPlot | undefined;
    let focused = false;
    config.addHook('ready', (u) => {
      plot = u;
    });
    const reset = () => {
      if (focused) {
        plot?.setSeries(null, { focus: true }, false);
      }
      focused = false;
    };
    const hover = eventBus.getStream(DataHoverEvent).subscribe((event) => {
      if (event.origin !== eventBus || event.payload.point?.time != null || !event.payload.dataId || !plot) {
        return;
      }
      const matches: number[] = [];
      config.getSeries().forEach((series, i) => {
        const index = series.props.dataFrameFieldIndex;
        const frame = index && currentFrames.current[index.frameIndex];
        const field = frame && index && frame.fields[index.fieldIndex];
        if (
          frame &&
          field &&
          getFieldDisplayName(field, frame, currentFrames.current) === event.payload.dataId &&
          plot!.series[i + 1]?.show !== false
        ) {
          matches.push(i + 1);
        }
      });
      if (matches.length === 1) {
        plot.setSeries(matches[0], { focus: true }, false);
        focused = true;
      } else {
        reset();
      }
    });
    const clear = eventBus.getStream(DataHoverClearEvent).subscribe((event) => {
      if (event.origin === eventBus && event.payload?.dataId) {
        reset();
      }
    });
    config.addHook('destroy', () => {
      plot = undefined;
      focused = false;
    });
    return () => {
      reset();
      hover.unsubscribe();
      clear.unsubscribe();
    };
  }, [config, eventBus]);
  return null;
}
