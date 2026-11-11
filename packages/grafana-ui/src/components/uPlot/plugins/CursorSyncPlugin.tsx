import { useLayoutEffect } from 'react';
import uPlot from 'uplot';

import { DashboardCursorSync } from '@grafana/data';

import { UPlotConfigBuilder } from '../config/UPlotConfigBuilder';

/** Presentation adapter for the existing uPlot timestamp sync, independent of tooltips. */
export function CursorSyncPlugin({
  config,
  mode,
  scope,
}: {
  config: UPlotConfigBuilder;
  mode: DashboardCursorSync;
  scope?: string;
}) {
  useLayoutEffect(() => {
    if (mode === DashboardCursorSync.Off || !scope || !config.scales[0].props.isTime) {
      return;
    }
    config.setCursor({
      sync: { key: scope, scales: ['x', null] },
      move: (u, left, top) => (u.cursor.event == null && (left < 0 || left > u.rect.width) ? [-10, -10] : [left, top]),
    });
    const clear = (u: uPlot) => uPlot.sync(scope).pub('mousemove', u, -10, -10, u.rect.width, u.rect.height, 0);
    config.addHook('setCursor', (u) => {
      if (
        u.cursor.left! < 0 &&
        u.cursor.event != null &&
        u.root.dataset.wallCursorFollower === 'false' &&
        u.cursor.event?.type !== 'mouseleave'
      ) {
        // Native programmatic dismiss does not publish a sync event.
        clear(u);
      }
      // Passive followers share only X; their own nearest Y is not a source hover.
      u.root.dataset.wallCursorFollower = String(u.cursor.event == null);
    });
    let removeLeave: (() => void) | undefined;
    config.addHook('ready', (u) => {
      const leave = () => {
        // Pinned source cursors skip uPlot's normal mouseleave publication.
        if (u.cursor.left! >= 0) {
          clear(u);
        }
      };
      u.over.addEventListener('mouseleave', leave);
      removeLeave = () => u.over.removeEventListener('mouseleave', leave);
    });
    config.addHook('destroy', (u) => {
      removeLeave?.();
      if (u.root.dataset.wallCursorFollower === 'false') {
        clear(u);
      }
      delete u.root.dataset.wallCursorFollower;
    });
    // uPlot owns sync membership and unsubscribes in destroy. No second event bus.
  }, [config, mode, scope]);
  return null;
}
