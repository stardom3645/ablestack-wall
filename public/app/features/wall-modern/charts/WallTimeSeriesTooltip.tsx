import { css } from '@emotion/css';
import type { ReactNode } from 'react';

import { ClipboardButton } from '@grafana/ui/src/components/ClipboardButton/ClipboardButton';
import { FormattedValueDisplay } from '@grafana/ui/src/components/FormattedValueDisplay/FormattedValueDisplay';
import { PanelScrollArea } from '@grafana/ui/src/components/PanelScrollArea/PanelScrollArea';
import type { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizTooltipColorIndicator } from '@grafana/ui/src/components/VizTooltip/VizTooltipColorIndicator';
import { VizTooltipRow } from '@grafana/ui/src/components/VizTooltip/VizTooltipRow';
import { ColorPlacement, type VizTooltipItem } from '@grafana/ui/src/components/VizTooltip/types';
import { Trans } from 'app/core/internationalization';

import { wallSurfaceTokens } from '../surfaceTokens';

import type { WallTooltipItem } from './tooltipModel';

/** A time-series information list; native formatters, sample indices and pinned actions are retained. */
function WallTimeSeriesInformation({
  header,
  timestamp,
  timeZoneLabel,
  exactTime,
  sampleTimeLabel,
  items,
  isPinned,
  maxHeight,
  footer,
  tokens,
}: {
  header: VizTooltipItem | null;
  timestamp: number | null;
  timeZoneLabel?: string;
  exactTime?: string;
  sampleTimeLabel?: (value: number) => string;
  items: WallTooltipItem[];
  isPinned: boolean;
  maxHeight?: number;
  scrollable: boolean;
  footer?: ReactNode;
  tokens: TimeSeriesPresentation;
}) {
  const t = tokens;
  const styles = css({
    fontFamily: t.fontFamily,
    fontSize: t.tooltipFontSize,
    lineHeight: `${t.tooltipLineHeight}px`,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 0,
    maxHeight: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    '& > header': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      gap: t.tooltipRowGap,
      flexShrink: 0,
      padding: `${t.tooltipPadding}px ${t.tooltipPadding}px ${t.tooltipRowGap}px`,
      paddingRight: isPinned ? t.tooltipPadding + wallSurfaceTokens.controlSize : t.tooltipPadding,
      color: t.muted,
    },
    '& time': { color: t.text, font: 'inherit', fontWeight: t.tooltipValueWeight },
    '& .wall-tooltip-zone': { marginLeft: 'auto', fontSize: 'inherit', color: t.muted },
    '& .wall-tooltip-count': { color: t.muted, whiteSpace: 'nowrap' },
    '& .wall-tooltip-list': {
      minHeight: 0,
      flexShrink: 1,
      padding: `0 ${t.tooltipPadding}px ${t.tooltipPadding}px`,
      maxHeight: `min(${maxHeight ?? t.tooltipMaxHeight ?? 280}px, calc(100dvh - ${t.tooltipPadding * 12}px))`,
    },
    '& .wall-tooltip-row': {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,max-content)',
      alignItems: 'baseline',
      columnGap: t.legendGap,
      padding: `${t.tooltipRowGap}px 0`,
      minWidth: 0,
      borderRadius: t.radius / 2,
    },
    '& .wall-tooltip-row[data-active]': { background: t.tooltipHeaderBackground },
    '& .wall-tooltip-label': { display: 'flex', alignItems: 'center', minWidth: 0, gap: t.tooltipRowGap / 2 },
    '& .wall-tooltip-marker': { display: 'inline-flex', flexShrink: 0 },
    '& .wall-tooltip-name': {
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0,
      color: t.text,
      fontWeight: t.tooltipFontWeight,
    },
    '& .wall-tooltip-value': {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'flex-end',
      minWidth: 0,
      overflowWrap: 'anywhere',
      textAlign: 'right',
      color: t.text,
      fontWeight: t.tooltipValueWeight,
    },
    '& time.wall-tooltip-sample-time': {
      gridColumn: '1 / -1',
      color: t.muted,
      textAlign: 'right',
      fontSize: t.legendFontSize,
      fontWeight: t.tooltipFontWeight,
    },
    '& .wall-tooltip-copy': {
      display: 'block',
      padding: 0,
      minHeight: 0,
      height: 'auto',
      maxWidth: '100%',
      border: 0,
      borderRadius: t.radius / 2,
      background: 'transparent',
      boxShadow: 'none',
      font: 'inherit',
      color: 'inherit',
      textAlign: 'inherit',
      overflow: 'hidden',
      '&:hover': { background: t.tooltipHeaderBackground },
    },
    '& [data-wall-tooltip-actions] > div > div': { borderTopColor: t.border, padding: t.tooltipRowGap },
    '& [data-wall-tooltip-actions]': { flexShrink: 0 },
    '& [data-wall-tooltip-actions] [data-ui-button]': {
      fontFamily: 'inherit',
      fontSize: t.tooltipFontSize,
      borderRadius: t.radius - 2,
      minHeight: wallSurfaceTokens.controlSize,
      boxShadow: 'none',
    },
    '& [data-wall-tooltip-actions] [data-ui-button="secondary"]': {
      background: t.surface,
      color: t.text,
      border: `1px solid ${t.border}`,
      '&:hover': { background: t.tooltipHeaderBackground },
    },
  });
  return (
    <section className={styles} data-wall-chart-tooltip>
      {header && (
        <header>
          {header.label && <span>{header.label}</span>}
          <time
            title={exactTime}
            dateTime={timestamp != null && Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined}
          >
            {header.value}
          </time>
          {items.length > 1 && (
            <span className="wall-tooltip-count">
              <Trans i18nKey="wall.wall-time-series-tooltip.text-06379766">시리즈 </Trans>
              {items.length}
            </span>
          )}
          {timeZoneLabel && <span className="wall-tooltip-zone">{timeZoneLabel}</span>}
        </header>
      )}
      <PanelScrollArea className="wall-tooltip-list" role="list" aria-label="시리즈 값" style={{ overflowY: 'auto' }}>
        {items.map((item, index) => {
          const name = (
            <span className="wall-tooltip-name" title={item.label}>
              {item.label}
            </span>
          );
          const value = item.formattedValue ? (
            <FormattedValueDisplay
              value={item.formattedValue}
              unitStyle={{ fontSize: '0.9em', fontWeight: t.tooltipFontWeight, color: t.muted }}
            />
          ) : (
            item.value
          );
          const marker = item.color && item.colorPlacement !== ColorPlacement.hidden && (
            <span className="wall-tooltip-marker">
              <VizTooltipColorIndicator
                color={item.color}
                colorIndicator={item.colorIndicator}
                lineStyle={item.lineStyle}
              />
            </span>
          );
          return (
            <div
              className="wall-tooltip-row"
              role="listitem"
              data-active={item.isActive || undefined}
              key={`${item.label}-${index}`}
            >
              <div className="wall-tooltip-label">
                {item.colorPlacement !== ColorPlacement.trailing && marker}
                {isPinned ? (
                  <ClipboardButton
                    variant="secondary"
                    className="wall-tooltip-copy"
                    getText={() => item.label}
                    title={item.label}
                    aria-label={`${item.label} 이름 복사`}
                  >
                    {name}
                  </ClipboardButton>
                ) : (
                  name
                )}
              </div>
              <div className="wall-tooltip-value" title={item.value}>
                {isPinned ? (
                  <ClipboardButton
                    variant="secondary"
                    className="wall-tooltip-copy"
                    getText={() => item.value}
                    aria-label={`${item.label} 값 복사`}
                  >
                    {value}
                  </ClipboardButton>
                ) : (
                  value
                )}
                {item.colorPlacement === ColorPlacement.trailing && marker}
              </div>
              {item.sampleTime != null && item.sampleTime !== timestamp && Number.isFinite(item.sampleTime) && (
                <time className="wall-tooltip-sample-time" dateTime={new Date(item.sampleTime).toISOString()}>
                  <Trans i18nKey="wall.wall-time-series-tooltip.text-a0f420d1">측정 </Trans>
                  {sampleTimeLabel?.(item.sampleTime) ?? new Date(item.sampleTime).toISOString()}
                </time>
              )}
            </div>
          );
        })}
      </PanelScrollArea>
      {footer && <div data-wall-tooltip-actions>{footer}</div>}
    </section>
  );
}

// Analytic charts already share this export; retain their existing display unchanged.
export function WallTimeSeriesTooltip(props: Parameters<typeof WallTimeSeriesInformation>[0]) {
  return props.tokens.refinedInteractions ? (
    <WallTimeSeriesInformation {...props} />
  ) : (
    <WallChartTooltipFallback {...props} />
  );
}

function WallChartTooltipFallback({
  header,
  timestamp,
  items,
  isPinned,
  maxHeight,
  scrollable,
  footer,
  tokens,
}: {
  header: VizTooltipItem | null;
  timestamp: number | null;
  items: VizTooltipItem[];
  isPinned: boolean;
  maxHeight?: number;
  scrollable: boolean;
  footer?: ReactNode;
  tokens: TimeSeriesPresentation;
}) {
  return (
    <section
      className={css({
        fontFamily: tokens.fontFamily,
        fontSize: tokens.tooltipFontSize,
        lineHeight: `${tokens.tooltipLineHeight}px`,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 0,
        '& > header': {
          display: 'flex',
          alignItems: 'center',
          gap: tokens.tooltipRowGap,
          padding: tokens.tooltipPadding,
          color: tokens.muted,
          background: tokens.tooltipHeaderBackground,
          borderRadius: `${tokens.radius}px ${tokens.radius}px 0 0`,
          borderBottom: `1px solid ${tokens.border}`,
        },
        '& time': { fontSize: tokens.tooltipFontSize, fontWeight: tokens.tooltipFontWeight },
        '& [role="list"]': {
          padding: tokens.tooltipPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.tooltipRowGap,
          overflowY: 'auto',
          maxHeight: scrollable
            ? `min(${maxHeight ?? tokens.tooltipMaxHeight ?? 280}px, calc(100dvh - ${tokens.tooltipPadding * 10}px))`
            : `min(${tokens.tooltipMaxHeight ?? 280}px, calc(100dvh - ${tokens.tooltipPadding * 10}px))`,
        },
        '& [role="listitem"]': { padding: '1px 2px', borderRadius: tokens.radius / 2 },
        '& [data-active="true"]': { background: tokens.tooltipHeaderBackground },
        '& [role="listitem"] > div': {
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: tokens.legendGap,
        },
        '& [role="listitem"] > div > div': { minWidth: 0 },
        '& [role="listitem"] > div > div:first-child > div': {
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: tokens.text,
        },
        '& [role="listitem"] > div > div:last-child': {
          justifyContent: 'flex-end',
          color: tokens.text,
          fontWeight: tokens.tooltipValueWeight,
        },
        '& [data-wall-tooltip-actions] > div > div': { borderTopColor: tokens.border, padding: tokens.tooltipPadding },
        '& [data-wall-tooltip-actions] [data-ui-button]': {
          fontFamily: 'inherit',
          fontSize: tokens.tooltipFontSize,
          borderRadius: tokens.radius - 2,
          minHeight: wallSurfaceTokens.controlSize,
          boxShadow: 'none',
        },
        '& [data-wall-tooltip-actions] [data-ui-button="secondary"]': {
          background: tokens.surface,
          color: tokens.text,
          border: `1px solid ${tokens.border}`,
        },
        '& [data-wall-tooltip-actions] [data-ui-button="secondary"]:hover': {
          background: tokens.tooltipHeaderBackground,
        },
      })}
      data-wall-chart-tooltip
    >
      {header && (
        <header>
          {header.label && <span>{header.label}</span>}
          <time
            dateTime={timestamp != null && Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined}
          >
            {header.value}
          </time>
        </header>
      )}
      <div role="list" aria-label="시리즈 값">
        {items.map((item, index) => (
          <div role="listitem" data-active={item.isActive || undefined} key={`${item.label}-${index}`}>
            <VizTooltipRow {...item} isPinned={isPinned} justify="space-between" showValueScroll={!scrollable} />
          </div>
        ))}
      </div>
      {footer && <div data-wall-tooltip-actions>{footer}</div>}
    </section>
  );
}
