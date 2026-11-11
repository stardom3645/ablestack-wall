import { ArrowDownUp, Check } from 'lucide-react';
import { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';

import { formattedValueToString } from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';
import type { LegendProps } from '@grafana/ui/src/components/VizLegend/types';
import { Trans } from 'app/core/internationalization';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Button } from '../ui';

import { SeriesLegendContext } from './SeriesLegendContext';
import { WallSeriesLegendItem } from './WallSeriesLegendItem';
import { wallLegendTokens } from './legendTokens';
import { legendSortKeys, sortLegendItems } from './seriesLegendModel';
import './seriesLegend.css';

const aliases: Record<string, string> = { Mean: 'mean', 'Last *': 'lastNotNull', Last: 'last', Max: 'max', Min: 'min' };
export function WallSeriesLegend(props: LegendProps) {
  const { items, displayMode, sortBy, sortDesc } = props;
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [statMeasure, setStatMeasure] = useState({ pair: 0, values: 0 });
  const [compact, setCompact] = useState(props.placement === 'right');
  const [low, setLow] = useState(false);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const measure = () => {
      const available = element.getBoundingClientRect().width;
      setWidth(available);
      const canvas = document.createElement('canvas').getContext('2d');
      if (canvas) {
        let pair = 0;
        const values: number[] = [];
        element.querySelectorAll('.wall-series-stat').forEach((stat) => {
          const label = stat.querySelector('dt');
          const value = stat.querySelector('dd');
          if (!label || !value) {
            return;
          }
          canvas.font = getComputedStyle(label).font;
          const labelWidth = canvas.measureText(label.textContent ?? '').width;
          canvas.font = getComputedStyle(value).font;
          const valueWidth = canvas.measureText(value.textContent ?? '').width;
          pair = Math.max(pair, labelWidth + valueWidth + wallLegendTokens.rowGap * 2);
          const index = Array.from(stat.parentElement!.children).indexOf(stat);
          values[index] = Math.max(values[index] ?? 0, labelWidth, valueWidth);
        });
        const total =
          values.reduce((sum, value) => sum + value, 0) + Math.max(0, values.length - 1) * wallLegendTokens.gap;
        setStatMeasure((previous) =>
          previous.pair === pair && previous.values === total ? previous : { pair, values: total }
        );
      }
      const height = element.parentElement?.clientHeight ?? 0;
      setLow(
        props.placement === 'bottom' &&
          available >= wallLegendTokens.lowMinimumWidth &&
          height > 0 &&
          height < wallLegendTokens.lowAt
      );
      setCompact(
        props.placement === 'right' ||
          available < wallLegendTokens.compactAt ||
          available <
            wallLegendTokens.minimumName +
              wallLegendTokens.actionSize +
              items.reduce(
                (max, item) =>
                  Math.max(
                    max,
                    (item.getDisplayValues?.() ?? []).reduce(
                      (sum, v) =>
                        sum +
                        Math.max(
                          wallLegendTokens.minimumWideStat,
                          formattedValueToString(v).length * wallLegendTokens.characterWidth + wallLegendTokens.gap
                        ),
                      0
                    )
                  ),
                0
              )
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.parentElement) {
      observer.observe(element.parentElement);
    }
    measure();
    return () => observer.disconnect();
  }, [props.placement, items, displayMode]);
  const [order, setOrder] = useState({ key: aliases[sortBy ?? ''] ?? sortBy ?? '', descending: Boolean(sortDesc) });
  useEffect(
    () => setOrder({ key: aliases[sortBy ?? ''] ?? sortBy ?? '', descending: Boolean(sortDesc) }),
    [sortBy, sortDesc]
  );
  const sorted = useMemo(
    () => (order.key ? sortLegendItems(items, order.key, order.descending) : [...items]),
    [items, order]
  );
  const headers = Array.from(
    new Set(items.flatMap((item) => item.getDisplayValues?.().map((value) => value.title ?? '?') ?? []))
  );
  const sortMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="wall-legend-sort" />}
        aria-label="범례 정렬"
        title="범례 정렬"
      >
        <ArrowDownUp size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="wall-series-menu" aria-label="범례 정렬 기준">
        {legendSortKeys.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setOrder((previous) => ({ ...previous, key: option.value }))}
          >
            {option.label}
            {order.key === option.value && <Check size={14} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setOrder((previous) => ({ ...previous, descending: false }))}>
          <Trans i18nKey="wall.wall-series-legend.text-54fde842">오름차순</Trans>
          {!order.descending && <Check size={14} />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOrder((previous) => ({ ...previous, descending: true }))}>
          <Trans i18nKey="wall.wall-series-legend.text-27a02828">내림차순</Trans>
          {order.descending && <Check size={14} />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setOrder({ key: aliases[sortBy ?? ''] ?? sortBy ?? '', descending: Boolean(sortDesc) })}
        >
          <Trans i18nKey="wall.wall-series-legend.text-70d754c0">설정된 순서로 복원</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const table = displayMode === LegendDisplayMode.Table;
  const minimumStat = items.reduce(
    (size, item) =>
      Math.max(
        size,
        ...(item.getDisplayValues?.() ?? []).map(
          (value) =>
            ((value.title?.length ?? 0) + formattedValueToString(value).length) * wallLegendTokens.characterWidth +
            wallLegendTokens.gap
        )
      ),
    wallLegendTokens.minimumStat
  );
  const valueWidth = items.reduce(
    (size, item) =>
      Math.max(
        size,
        ...(item.getDisplayValues?.() ?? []).map(
          (value) => formattedValueToString(value).length * wallLegendTokens.characterWidth
        )
      ),
    wallLegendTokens.minimumWideStat
  );
  const inlineStat =
    table &&
    compact &&
    headers.length === 1 &&
    width >= wallLegendTokens.minimumName + valueWidth + wallLegendTokens.actionSize + wallLegendTokens.gap * 3;
  const uniformStats = items.every(
    (item) => (item.getDisplayValues?.() ?? []).map((value) => value.title ?? '?').join('\0') === headers.join('\0')
  );
  const matrixStats =
    table && compact && uniformStats && headers.length > 1 && statMeasure.values > 0 && width >= statMeasure.values;
  let columns = Math.max(
    1,
    Math.min(
      headers.length,
      statMeasure.pair > 0
        ? Math.floor((width + wallLegendTokens.gap) / (statMeasure.pair + wallLegendTokens.gap))
        : Math.floor(width / minimumStat)
    )
  );
  if (headers.length === 4 && columns === 3) {
    columns = 2;
  }
  if (displayMode === LegendDisplayMode.Hidden) {
    return null;
  }
  return (
    <SeriesLegendContext.Provider value={items}>
      <div
        ref={container}
        className={`wall-series-legend ${table ? 'wall-series-grid' : 'wall-series-list-mode'}`}
        role="group"
        aria-label="시계열 범례"
        data-wall-legend-density={compact ? 'compact' : 'regular'}
        data-wall-legend-height={low ? 'low' : 'normal'}
        data-wall-legend-stats={inlineStat ? 'inline' : matrixStats ? 'matrix' : undefined}
        style={{
          '--wall-legend-template': `minmax(0,1fr) ${headers.map(() => 'max-content').join(' ')} ${wallLegendTokens.actionSize}px`,
          '--wall-legend-stat-columns': columns,
          '--wall-legend-stat-count': headers.length,
          '--wall-legend-gap': `${wallLegendTokens.gap}px`,
          '--wall-legend-action-size': `${wallLegendTokens.actionSize}px`,
          '--wall-legend-low-toolbar': `${wallLegendTokens.lowToolbarWidth}px`,
        }}
        data-wall-series-count={items.length}
        data-wall-legend-placement={props.placement}
      >
        <div className="wall-legend-header">
          <span className="wall-legend-heading">
            <Trans i18nKey="wall.wall-series-legend.text-06379766">시리즈 </Trans>
            <span className="wall-legend-count">{items.length}</span>
          </span>
          {table &&
            headers.map((title, index) => (
              <span
                className="wall-legend-column"
                key={title}
                style={matrixStats ? { gridRow: 2, gridColumn: index + 1 } : undefined}
                title={
                  title === 'Last *' ? '마지막 유효값 (Last not null)' : title === 'Last' ? '마지막 값 (Last)' : title
                }
              >
                {title}
              </span>
            ))}
          {sortMenu}
        </div>
        <div role="list" aria-label="시리즈 범례" className="wall-series-rows">
          {sorted.map((item) => (
            <WallSeriesLegendItem key={item.getItemKey?.() ?? item.label} {...props} item={item} />
          ))}
        </div>
      </div>
    </SeriesLegendContext.Provider>
  );
}
export function renderWallSeriesLegend(props: LegendProps) {
  return <WallSeriesLegend {...props} />;
}
