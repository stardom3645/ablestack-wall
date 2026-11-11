import { css, cx } from '@emotion/css';
import { useContext } from 'react';

import { formattedValueToString } from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';
import { usePanelContext } from '@grafana/ui';
import { VizLegendSeriesIcon } from '@grafana/ui/src/components/VizLegend/VizLegendSeriesIcon';
import { VizLegendStatsList } from '@grafana/ui/src/components/VizLegend/VizLegendStatsList';
import {
  TimeSeriesPresentationContext,
  type TimeSeriesLegendItemProps,
} from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { Trans } from 'app/core/internationalization';

import { Button } from '../ui';

import { SeriesLegendContext } from './SeriesLegendContext';
import { WallSeriesMenu } from './WallSeriesMenu';

export function WallSeriesLegendItem({
  item,
  displayMode,
  readonly,
  onLabelClick,
  onLabelMouseOver,
  onLabelMouseOut,
}: TimeSeriesLegendItemProps) {
  const { canEditSeriesColor } = usePanelContext();
  const allItems = useContext(SeriesLegendContext);
  const tokens = useContext(TimeSeriesPresentationContext)!;
  const styles = css({
    color: item.disabled ? tokens.muted : tokens.text,
    fontFamily: tokens.fontFamily,
    fontSize: tokens.legendFontSize,
    fontWeight: tokens.legendFontWeight,
    fontVariantNumeric: 'tabular-nums',
    '& .wall-series-label': {
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: tokens.legendGap / 2,
      opacity: item.disabled ? 0.55 : 1,
    },
    '& .wall-series-label > span': { flexShrink: 0 },
    '& .wall-series-name': {
      font: 'inherit',
      color: 'inherit',
      minWidth: 0,
      minHeight: 0,
      height: 'auto',
      justifyContent: 'flex-start',
      maxWidth: '100%',
      padding: 0,
      border: 0,
      borderRadius: tokens.radius / 2,
      background: 'transparent',
      gap: tokens.legendGap / 2,
    },
    '& .wall-series-name > span': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    '& .wall-series-name:focus-visible': { outline: `2px solid ${tokens.palette[0]}`, outlineOffset: 2 },
    '& small': { color: tokens.muted, whiteSpace: 'nowrap' },
    '& .wall-series-stat': {
      whiteSpace: 'nowrap',
      textAlign: 'right',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: tokens.legendFontWeight,
    },
    '&.wall-series-list': { display: 'flex', alignItems: 'center', gap: tokens.legendGap, maxWidth: '100%' },
    '&.wall-series-list .wall-series-label': { flex: '0 1 auto' },
    '&.wall-series-list > ul': { marginInlineStart: 'auto', flexShrink: 0 },
  });
  const label = (
    <div className="wall-series-label">
      <VizLegendSeriesIcon
        seriesName={item.fieldName ?? item.label}
        color={item.color}
        gradient={item.gradient}
        readonly={readonly || (canEditSeriesColor ? !canEditSeriesColor() : false)}
        lineStyle={item.lineStyle}
      />
      <Button
        className="wall-series-name"
        variant="ghost"
        disabled={readonly}
        title={item.label}
        aria-pressed={!item.disabled}
        onMouseDown={(e) => {
          // Native scrollbar wrappers can scroll their hidden outer viewport on focus.
          // Keep keyboard focus without shifting the compact legend's column headings.
          e.preventDefault();
          e.currentTarget.focus({ preventScroll: true });
        }}
        onClick={(e) => onLabelClick?.(item, e)}
        onMouseOver={allItems.length ? undefined : (e) => onLabelMouseOver?.(item, e)}
        onMouseOut={allItems.length ? undefined : (e) => onLabelMouseOut?.(item, e)}
        onFocus={allItems.length ? undefined : (e) => onLabelMouseOver?.(item, e)}
        onBlur={allItems.length ? undefined : (e) => onLabelMouseOut?.(item, e)}
      >
        <span>{item.label}</span>
        {item.yAxis === 2 && (
          <small>
            <Trans i18nKey="wall.wall-series-legend-item.text-19355250">(오른쪽 축)</Trans>
          </small>
        )}
      </Button>
    </div>
  );
  const values = item.getDisplayValues?.() ?? [];
  // Other chart types still use native VizLegendTable's item contract.
  if (!allItems.length && displayMode === LegendDisplayMode.Table) {
    return (
      <tr className={styles}>
        <td>{label}</td>
        {values.map((stat, index) => (
          <td key={index} className="wall-series-stat">
            {formattedValueToString(stat)}
          </td>
        ))}
      </tr>
    );
  }
  if (!allItems.length) {
    return (
      <div className={cx(styles, 'wall-series-list')} data-wall-series-legend>
        {label}
        <VizLegendStatsList stats={values} />
      </div>
    );
  }
  return (
    <div
      className={cx(styles, displayMode === LegendDisplayMode.List && 'wall-series-list')}
      data-wall-series-legend
      role={allItems.length ? 'listitem' : undefined}
      data-series-disabled={item.disabled || undefined}
      onMouseEnter={(event) => onLabelMouseOver?.(item, event)}
      onMouseLeave={(event) => onLabelMouseOut?.(item, event)}
      onFocus={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onLabelMouseOver?.(item, event);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onLabelMouseOut?.(item, event);
        }
      }}
    >
      {label}
      <dl className="wall-series-stats">
        {values.map((stat, index) => (
          <div
            title={`${stat.title}: ${formattedValueToString(stat)}`}
            className="wall-series-stat"
            key={`${stat.title}-${index}`}
          >
            <dt>{stat.title}</dt>
            <dd>{formattedValueToString(stat)}</dd>
          </div>
        ))}
      </dl>
      {allItems.length > 0 ? <WallSeriesMenu item={item} items={allItems} readonly={readonly} /> : <span />}
    </div>
  );
}

export function renderWallSeriesLegendItem(props: TimeSeriesLegendItemProps) {
  return <WallSeriesLegendItem key={props.item.getItemKey?.() ?? props.item.label} {...props} />;
}
