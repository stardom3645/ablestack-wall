import { css } from '@emotion/css';
import { useState } from 'react';

import { dateTimeFormat, systemDateFormats } from '@grafana/data';
import type { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { AnnotationEditor2 } from 'app/plugins/panel/timeseries/plugins/annotations2/AnnotationEditor2';
import { AnnotationTooltip2 } from 'app/plugins/panel/timeseries/plugins/annotations2/AnnotationTooltip2';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { wallEventTokens as t } from '../eventTokens';
import { Button } from '../ui';

import { annotationLabel, WallAnnotation } from './annotationModel';

/** Marker-only grouping; selecting a row opens the original event's tooltip/editor and permissions. */
export function WallAnnotationPopover({
  events,
  timeZone,
  portalRoot,
  exitWipEdit,
  tokens,
}: {
  events: WallAnnotation[];
  timeZone: string;
  portalRoot: HTMLElement;
  exitWipEdit: () => void;
  tokens: TimeSeriesPresentation;
}) {
  const first = events[0];
  const [open, setOpen] = useState(first.wip);
  const [editing, setEditing] = useState(first.wip);
  const [key, select] = useState(first.key);
  const event = events.find((e) => e.key === key) ?? first;
  const cluster = events.length > 1;
  const colors = [...new Set(events.map((e) => e.color))];
  const label = cluster
    ? `겹친 주석 ${events.length}개`
    : `${first.region ? '기간' : '시점'} 주석: ${annotationLabel(first)}`;
  const close = () => {
    setOpen(false);
    setEditing(false);
    if (first.wip) {
      exitWipEdit();
    }
  };
  const style = css({
    position: 'absolute',
    top: -3,
    height: t.markerHeight,
    minHeight: 0,
    padding: 0,
    width: cluster
      ? t.clusterWidth
      : first.region
        ? Math.max(t.markerHitWidth, first.right - first.left)
        : t.markerHitWidth,
    left: first.left,
    transform: first.region && !cluster ? undefined : 'translateX(-50%)',
    border: cluster ? `1px solid ${tokens.border}` : 0,
    borderRadius: tokens.radius / 2,
    background: cluster ? tokens.surface : 'transparent',
    color: tokens.text,
    zIndex: first.wip ? 3 : 2,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.legendHeaderSize,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    '& .wall-annotation-point': {
      display: 'block',
      width: t.pointSize,
      height: t.pointSize,
      borderRadius: '50%',
      background: first.color,
    },
    '& .wall-annotation-region': {
      position: 'absolute',
      left: 0,
      top: (t.markerHeight - t.regionHeight) / 2,
      height: t.regionHeight,
      borderRadius: t.regionHeight / 2,
      width: first.right - first.left,
      background: first.color,
    },
    '& .wall-annotation-colors': { position: 'absolute', bottom: -2, left: 1, right: 1, height: 2, display: 'flex' },
    '& .wall-annotation-colors i': { flex: 1 },
    '&:focus-visible': { outline: `2px solid ${tokens.palette[0]}`, outlineOffset: 2 },
  });
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close();
        } else {
          setOpen(true);
        }
      }}
    >
      <PopoverTrigger
        render={<Button className={style} variant="ghost" />}
        aria-label={label}
        data-wall-annotation-marker
        data-testid="data-testid annotation marker"
        openOnHover={!editing}
        delay={t.hoverOpenDelay}
        closeDelay={t.hoverCloseDelay}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {cluster ? (
          <>
            {events.length}
            <span className="wall-annotation-colors" aria-hidden="true">
              {colors.slice(0, 4).map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
          </>
        ) : (
          <span aria-hidden="true" className={first.region ? 'wall-annotation-region' : 'wall-annotation-point'} />
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        portalContainer={portalRoot}
        aria-label="주석 상세"
        onPointerDown={(e) => e.stopPropagation()}
        className={css({
          width: t.popupWidth,
          maxWidth: 'calc(100vw - 24px)',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          padding: 0,
          '& .wall-annotation-list': {
            padding: tokens.tooltipPadding,
            maxHeight: t.listHeight,
            overflowY: 'auto',
            borderBottom: `1px solid ${tokens.border}`,
            display: 'grid',
            gap: t.gap / 2,
          },
          '& .wall-annotation-list button': {
            width: '100%',
            padding: '6px 8px',
            justifyContent: 'flex-start',
            minHeight: 0,
            height: 'auto',
            textAlign: 'left',
            gap: t.gap,
          },
          '& .wall-annotation-list [aria-pressed=true]': { background: tokens.tooltipHeaderBackground },
          '& .wall-annotation-list i': { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
          '& .wall-annotation-list span': {
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
          '& .wall-annotation-list small': {
            display: 'block',
            color: tokens.muted,
            fontVariantNumeric: 'tabular-nums',
          },
        })}
      >
        {cluster && !editing && (
          <div className="wall-annotation-list" role="group" aria-label={`표시된 주석 ${events.length}개`}>
            {events.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                aria-pressed={item.key === event.key}
                onClick={() => select(item.key)}
                title={annotationLabel(item)}
              >
                <i style={{ background: item.color }} />
                <span>
                  {annotationLabel(item)}
                  <small>
                    {item.region ? '기간 · ' : '시점 · '}
                    {dateTimeFormat(annotationTimestamp(item.values.time[item.index]), {
                      format: systemDateFormats.fullDate,
                      timeZone,
                    })}
                  </small>
                </span>
              </Button>
            ))}
          </div>
        )}
        {editing ? (
          <AnnotationEditor2 annoVals={event.values} annoIdx={event.index} timeZone={timeZone} dismiss={close} />
        ) : (
          <AnnotationTooltip2
            annoVals={event.values}
            annoIdx={event.index}
            timeZone={timeZone}
            onEdit={() => setEditing(true)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function annotationTimestamp(value: unknown) {
  return typeof value === 'number' || typeof value === 'string' || value instanceof Date ? value : String(value);
}
