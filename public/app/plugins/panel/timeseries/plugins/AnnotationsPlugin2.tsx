import { css } from '@emotion/css';
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useReducer } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import tinycolor from 'tinycolor2';
import uPlot from 'uplot';

import { arrayToDataFrame, colorManipulator, DataFrame, DataTopic } from '@grafana/data';
import { TimeZone } from '@grafana/schema';
import { DEFAULT_ANNOTATION_COLOR, getPortalContainer, UPlotConfigBuilder, useStyles2, useTheme2 } from '@grafana/ui';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { WallAnnotationPopover } from 'app/features/wall-modern/charts/WallAnnotationPopover';
import { groupAnnotationMarkers, WallAnnotation } from 'app/features/wall-modern/charts/annotationModel';
import { wallEventTokens } from 'app/features/wall-modern/eventTokens';

import { AnnotationMarker2 } from './annotations2/AnnotationMarker2';

// (copied from TooltipPlugin2)
interface TimeRange2 {
  from: number;
  to: number;
}

interface AnnotationsPluginProps {
  config: UPlotConfigBuilder;
  annotations: DataFrame[];
  timeZone: TimeZone;
  newRange: TimeRange2 | null;
  setNewRange: (newRage: TimeRange2 | null) => void;
  canvasRegionRendering?: boolean;
}

// TODO: batch by color, use Path2D objects
const renderLine = (ctx: CanvasRenderingContext2D, y0: number, y1: number, x: number, color: string) => {
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.strokeStyle = color;
  ctx.stroke();
};

// const renderUpTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
//   ctx.beginPath();
//   ctx.moveTo(x - w/2, y + h/2);
//   ctx.lineTo(x + w/2, y + h/2);
//   ctx.lineTo(x, y);
//   ctx.closePath();
//   ctx.fillStyle = color;
//   ctx.fill();
// }

const DEFAULT_ANNOTATION_COLOR_HEX8 = tinycolor(DEFAULT_ANNOTATION_COLOR).toHex8String();

function getVals(frame: DataFrame) {
  let vals: Record<string, any[]> = {};
  frame.fields.forEach((f) => {
    vals[f.name] = f.values;
  });

  return vals;
}

export const AnnotationsPlugin2 = ({
  annotations,
  timeZone,
  config,
  newRange,
  setNewRange,
  canvasRegionRendering = true,
}: AnnotationsPluginProps) => {
  const presentation = useContext(TimeSeriesPresentationContext);
  const [plot, setPlot] = useState<uPlot>();

  const [portalRoot] = useState(() => getPortalContainer());

  const styles = useStyles2(getStyles);
  const getColorByName = useTheme2().visualization.getColorByName;

  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  const annos = useMemo(() => {
    let annos = annotations.filter(
      (frame) => frame.name !== 'exemplar' && frame.length > 0 && frame.fields.some((f) => f.name === 'time')
    );

    if (newRange) {
      let isRegion = newRange.to > newRange.from;

      const wipAnnoFrame = arrayToDataFrame([
        {
          time: newRange.from,
          timeEnd: isRegion ? newRange.to : null,
          isRegion: isRegion,
          color: DEFAULT_ANNOTATION_COLOR_HEX8,
        },
      ]);

      wipAnnoFrame.meta = {
        dataTopic: DataTopic.Annotations,
        custom: {
          isWip: true,
        },
      };

      annos.push(wipAnnoFrame);
    }

    return annos;
  }, [annotations, newRange]);

  const exitWipEdit = useCallback(() => {
    setNewRange(null);
  }, [setNewRange]);

  const annoRef = useRef(annos);
  annoRef.current = annos;
  const newRangeRef = useRef(newRange);
  newRangeRef.current = newRange;

  const xAxisRef = useRef<HTMLDivElement>();

  useLayoutEffect(() => {
    let live = true;
    let frame = 0;
    const updateMarkers = () => {
      if (!presentation || !live || frame) {
        return;
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (live) {
          forceUpdate();
        }
      });
    };
    if (presentation) {
      config.addHook('setScale', updateMarkers);
      config.addHook('setSize', updateMarkers);
    }
    config.addHook('ready', (u) => {
      if (!live) {
        return;
      }
      let xAxisEl = u.root.querySelector<HTMLDivElement>('.u-axis')!;
      xAxisRef.current = xAxisEl;
      setPlot(u);
    });

    config.addHook('draw', (u) => {
      if (!live) {
        return;
      }
      let annos = annoRef.current;

      const ctx = u.ctx;

      ctx.save();

      ctx.beginPath();
      ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
      ctx.clip();

      annos.forEach((frame) => {
        let vals = getVals(frame);

        if (frame.name === 'xymark') {
          // xMin, xMax, yMin, yMax, color, lineWidth, lineStyle, fillOpacity, text

          let xKey = config.scales[0].props.scaleKey;
          let yKey = config.scales[1].props.scaleKey;

          for (let i = 0; i < frame.length; i++) {
            let color = getColorByName(vals.color?.[i] || DEFAULT_ANNOTATION_COLOR_HEX8);

            let x0 = u.valToPos(vals.xMin[i], xKey, true);
            let x1 = u.valToPos(vals.xMax[i], xKey, true);
            let y0 = u.valToPos(vals.yMax[i], yKey, true);
            let y1 = u.valToPos(vals.yMin[i], yKey, true);

            ctx.fillStyle = colorManipulator.alpha(color, vals.fillOpacity[i]);
            ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

            ctx.lineWidth = Math.round(vals.lineWidth[i] * uPlot.pxRatio);

            if (vals.lineStyle[i] === 'dash') {
              // maybe extract this to vals.lineDash[i] in future?
              ctx.setLineDash([5, 5]);
            } else {
              // solid
              ctx.setLineDash([]);
            }

            ctx.strokeStyle = color;
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
          }
        } else {
          let y0 = u.bbox.top;
          let y1 = y0 + u.bbox.height;

          ctx.lineWidth = presentation ? wallEventTokens.lineWidth * uPlot.pxRatio : 2;
          ctx.setLineDash([5, 5]);

          for (let i = 0; i < vals.time.length; i++) {
            let color = getColorByName(vals.color?.[i] || DEFAULT_ANNOTATION_COLOR_HEX8);

            let x0 = u.valToPos(vals.time[i], 'x', true);

            if (!vals.isRegion?.[i]) {
              if (presentation) {
                ctx.setLineDash(wallEventTokens.pointDash.map((n) => n * uPlot.pxRatio));
              }
              renderLine(ctx, y0, y1, x0, color);
              // renderUpTriangle(ctx, x0, y1, 8 * uPlot.pxRatio, 5 * uPlot.pxRatio, color);
            } else if (canvasRegionRendering) {
              if (presentation) {
                ctx.setLineDash([]);
              }
              renderLine(ctx, y0, y1, x0, color);

              let x1 = u.valToPos(vals.timeEnd[i], 'x', true);

              renderLine(ctx, y0, y1, x1, color);

              ctx.fillStyle = colorManipulator.alpha(color, presentation ? wallEventTokens.regionOpacity : 0.1);
              ctx.fillRect(x0, y0, x1 - x0, u.bbox.height);
            }
          }
        }
      });

      ctx.restore();
    });
    return () => {
      live = false;
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [config, canvasRegionRendering, getColorByName, presentation]);

  // ensure annos are re-drawn whenever they change
  useEffect(() => {
    if (plot) {
      plot.redraw();

      // this forces a second redraw after uPlot is updated (in the Plot.tsx didUpdate) with new data/scales
      // and ensures the anno marker positions in the dom are re-rendered in correct places
      // (this is temp fix until uPlot integrtion is refactored)
      const timeout = setTimeout(() => {
        forceUpdate();
      }, 0);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [annos, plot]);

  if (plot) {
    if (presentation) {
      const events: WallAnnotation[] = annos.flatMap((data, frameIndex) => {
        if (data.name === 'xymark') {
          return [];
        }
        const values = getVals(data);
        return values.time.flatMap((time, index) => {
          const left = plot.valToPos(time, 'x');
          const region = Boolean(values.isRegion?.[index]);
          const right = region ? plot.valToPos(values.timeEnd?.[index], 'x') : left;
          if (
            !Number.isFinite(left) ||
            !Number.isFinite(right) ||
            (region ? left >= plot.rect.width || right <= 0 : left < 0 || left > plot.rect.width)
          ) {
            return [];
          }
          return [
            {
              key: `${frameIndex}:${values.id?.[index] ?? `${time}:${index}`}`,
              values,
              index,
              left: Math.max(0, left),
              right: Math.min(plot.rect.width, right),
              region,
              color: getColorByName(values.color?.[index] || DEFAULT_ANNOTATION_COLOR),
              wip: Boolean(data.meta?.custom?.isWip),
            },
          ];
        });
      });
      return createPortal(
        groupAnnotationMarkers(events).map((group) => (
          <WallAnnotationPopover
            key={group[0].key}
            events={group}
            timeZone={timeZone}
            portalRoot={portalRoot}
            exitWipEdit={exitWipEdit}
            tokens={presentation}
          />
        )),
        xAxisRef.current!
      );
    }
    let markers = annos.flatMap((frame, frameIdx) => {
      let vals = getVals(frame);

      let markers: React.ReactNode[] = [];

      for (let i = 0; i < vals.time.length; i++) {
        let color = getColorByName(vals.color?.[i] || DEFAULT_ANNOTATION_COLOR);
        let left = Math.round(plot.valToPos(vals.time[i], 'x')) || 0; // handles -0
        let style: React.CSSProperties | null = null;
        let className = '';
        let isVisible = true;

        if (vals.isRegion?.[i]) {
          let right = Math.round(plot.valToPos(vals.timeEnd?.[i], 'x')) || 0; // handles -0

          isVisible = left < plot.rect.width && right > 0;

          if (isVisible) {
            let clampedLeft = Math.max(0, left);
            let clampedRight = Math.min(plot.rect.width, right);

            style = { left: clampedLeft, background: color, width: clampedRight - clampedLeft };
            className = styles.annoRegion;
          }
        } else {
          isVisible = left >= 0 && left <= plot.rect.width;

          if (isVisible) {
            style = { left, borderBottomColor: color };
            className = styles.annoMarker;
          }
        }

        // @TODO: Reset newRange after annotation is saved
        if (isVisible) {
          let isWip = frame.meta?.custom?.isWip;

          markers.push(
            <AnnotationMarker2
              annoIdx={i}
              annoVals={vals}
              className={className}
              style={style}
              timeZone={timeZone}
              key={`${frameIdx}:${i}`}
              exitWipEdit={isWip ? exitWipEdit : null}
              portalRoot={portalRoot}
            />
          );
        }
      }

      return markers;
    });

    return createPortal(markers, xAxisRef.current!);
  }

  return null;
};

const getStyles = () => ({
  annoMarker: css({
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottomWidth: '5px',
    borderBottomStyle: 'solid',
    transform: 'translateX(-50%)',
    cursor: 'pointer',
    zIndex: 1,
  }),
  annoRegion: css({
    position: 'absolute',
    height: '5px',
    cursor: 'pointer',
    zIndex: 1,
  }),
});
