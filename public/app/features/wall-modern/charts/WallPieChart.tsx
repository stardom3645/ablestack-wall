import { css } from '@emotion/css';
import { localPoint } from '@visx/event';
import Pie from '@visx/shape/lib/shapes/Pie';
import { useTooltip, useTooltipInPortal } from '@visx/tooltip';
import { MoreHorizontal } from 'lucide-react';
import { MouseEvent, useContext, useRef, useState } from 'react';

import {
  DataHoverClearEvent,
  DataHoverEvent,
  FALLBACK_COLOR,
  FieldConfigSource,
  FieldDisplay,
  formattedValueToString,
} from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';
import { usePanelContext, useTheme2, VizLayout } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { Options, PieChartLegendValues, PieChartType } from 'app/plugins/panel/piechart/panelcfg.gen';

import { MeterValue } from '../panels/MeterValue';
import { fitStatValue } from '../panels/statReadout';
import { WallFontStatusContext, wallTypography, wallTypographyVariables } from '../typography';
import { Button } from '../ui';

import { PieActionTarget, WallPieActions } from './WallPieActions';
import { WallTimeSeriesTooltip } from './WallTimeSeriesTooltip';
import {
  formatPiePercent,
  layoutPieLabels,
  PieEntry,
  pieComposition,
  pieEntries,
  piePercent,
  wallPieTheme,
  wallPieTokens,
} from './pieModel';
import './pie.css';

/** Reuses Grafana's FieldDisplay reducers and the same Visx/D3 pie geometry engine. */
export function WallPieChart({
  values,
  fieldConfig,
  options,
  width,
  height,
  highlightedTitle,
}: {
  values: FieldDisplay[];
  fieldConfig: FieldConfigSource;
  options: Options;
  width: number;
  height: number;
  highlightedTitle?: string;
}) {
  const theme = useTheme2();
  useContext(WallFontStatusContext);
  const tokens = wallPieTheme(theme);
  const entries = pieEntries(values, fieldConfig, theme);
  const composition = pieComposition(entries, theme);
  const { eventBus } = usePanelContext();
  const [hover, setHover] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [target, setTarget] = useState<PieActionTarget | null>(null);
  const [menu, setMenu] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const tooltip = useTooltip<PieEntry>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({ detectBounds: true, scroll: true });
  const active =
    (menu && target ? target.id : undefined) ??
    hover ??
    (entries.some((entry) => entry.id === selected) ? selected : undefined) ??
    entries.find((entry) => entry.value.display.title === highlightedTitle)?.id;
  const selectedEntry = composition.visible.find((entry) => entry.id === active);
  const legend = options.legend;
  const showLegend = legend?.showLegend !== false && legend?.displayMode !== LegendDisplayMode.Hidden;
  const legendValues = legend?.values ?? [PieChartLegendValues.Percent];
  const sorted = [...entries]
    .filter((entry) => !entry.value.field.custom?.hideFrom?.legend)
    .sort((a, b) => {
      const av = a.value.display.numeric,
        bv = b.value.display.numeric;
      return (Number.isFinite(bv) ? bv : -Infinity) - (Number.isFinite(av) ? av : -Infinity);
    });
  function emphasize(entry?: PieEntry) {
    setHover(entry?.id);
    eventBus.publish({
      type: entry ? DataHoverEvent.type : DataHoverClearEvent.type,
      payload: { x: 0, y: 0, dataId: entry?.value.display.title },
    });
  }
  function openActions(entry: PieEntry, event: MouseEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    tooltip.hideTooltip();
    returnFocus.current = event.currentTarget instanceof HTMLElement ? event.currentTarget : host.current;
    const rect = event.currentTarget.getBoundingClientRect();
    setTarget({
      id: entry.id,
      x: event.detail ? event.clientX : rect.right,
      y: event.detail ? event.clientY : rect.bottom,
    });
    setMenu(true);
  }
  function valueText(entry: PieEntry) {
    return formattedValueToString(entry.value.display);
  }
  const legendContent = showLegend ? (
    <VizLayout.Legend placement={legend?.placement ?? 'right'} width={legend?.width}>
      <div className="wall-pie-legend" aria-label="구성비 범례" data-layout={legend?.displayMode}>
        {legend?.displayMode === LegendDisplayMode.Table && legendValues.length > 0 && (
          <div className="wall-pie-legend-heading">
            <span>
              <Trans i18nKey="wall.wall-pie-chart.text-1e591967">항목</Trans>
            </span>
            {legendValues.includes(PieChartLegendValues.Value) && (
              <span>
                <Trans i18nKey="wall.wall-pie-chart.text-50d055d3">값</Trans>
              </span>
            )}
            {legendValues.includes(PieChartLegendValues.Percent) && (
              <span>
                <Trans i18nKey="wall.wall-pie-chart.text-4021ec7d">비율</Trans>
              </span>
            )}
            <span />
          </div>
        )}
        {sorted.map((entry) => (
          <div
            key={entry.id}
            className="wall-pie-legend-row"
            data-active={active === entry.id || undefined}
            data-hidden={entry.value.field.custom?.hideFrom?.viz || undefined}
            onMouseEnter={() => emphasize(entry)}
            onMouseLeave={() => emphasize()}
            onContextMenu={(event) => openActions(entry, event)}
          >
            <button
              type="button"
              className="wall-pie-legend-name"
              title={entry.value.display.title}
              aria-pressed={selected === entry.id}
              onClick={() => setSelected(selected === entry.id ? undefined : entry.id)}
              onFocus={() => emphasize(entry)}
              onBlur={() => emphasize()}
            >
              <i style={{ background: entry.value.display.color ?? FALLBACK_COLOR }} />
              <span>{entry.value.display.title}</span>
            </button>
            {legendValues.includes(PieChartLegendValues.Value) && (
              <span className="wall-pie-legend-value" title={valueText(entry)}>
                {valueText(entry)}
              </span>
            )}
            {legendValues.includes(PieChartLegendValues.Percent) && (
              <span className="wall-pie-legend-value">
                {formatPiePercent(piePercent(entry, composition), entry.value.field.decimals)}
              </span>
            )}
            <Button
              variant="ghost"
              className="wall-pie-more"
              aria-label={`${entry.value.display.title} 작업`}
              onClick={(event) => openActions(entry, event)}
            >
              <MoreHorizontal size={14} />
            </Button>
          </div>
        ))}
      </div>
    </VizLayout.Legend>
  ) : undefined;
  const tooltipEntries =
    options.tooltip.mode === 'multi'
      ? [...composition.visible].sort((a, b) =>
          options.tooltip.sort === 'asc'
            ? a.value.display.numeric - b.value.display.numeric
            : options.tooltip.sort === 'desc'
              ? b.value.display.numeric - a.value.display.numeric
              : 0
        )
      : tooltip.tooltipData
        ? [tooltip.tooltipData]
        : [];
  return (
    <div
      className="wall-pie"
      ref={host}
      tabIndex={-1}
      data-wall-pie
      style={{
        ...wallTypographyVariables,
        width,
        height,
        '--wall-pie-text': tokens.text,
        '--wall-pie-muted': tokens.muted,
        '--wall-pie-soft': tokens.tooltipHeaderBackground,
        '--wall-pie-border': tokens.border,
        '--wall-pie-surface': tokens.surface,
        '--wall-pie-row': `${wallPieTokens.legendRow}px`,
        '--wall-pie-gap': `${wallPieTokens.legendGap}px`,
      }}
    >
      <VizLayout width={width} height={height} legend={legendContent}>
        {(vizWidth, vizHeight) => {
          const size = Math.max(0, Math.min(vizWidth, vizHeight));
          const outer = Math.max(0, size / 2 - wallPieTokens.margin);
          const inner = options.pieType === PieChartType.Donut ? outer * wallPieTokens.holeRatio : 0;
          const centerWidth = inner * 1.55;
          const centerValue = selectedEntry?.value.display ?? composition.totalDisplay;
          const centerCaption = selectedEntry?.value.display.title ?? (centerValue ? '표시 합계' : '표시 항목');
          const centerSize = centerValue
            ? fitStatValue({
                ...centerValue,
                width: centerWidth,
                height: wallPieTokens.centerValueSize * 1.3,
                maximum: wallPieTokens.centerValueSize,
                unitMaximum: wallTypography.roles.unit.size,
                weight: wallTypography.roles.gauge.weight,
              })
            : wallPieTokens.centerValueSize;
          return (
            <div className="wall-pie-canvas" style={{ width: vizWidth, height: vizHeight }}>
              {composition.invalid ? (
                <div className="wall-pie-notice" role="status">
                  <strong>
                    <Trans i18nKey="wall.wall-pie-chart.text-e1bf196d">구성비를 계산할 수 없습니다</Trans>
                  </strong>
                  <span>
                    <Trans i18nKey="wall.wall-pie-chart.text-63fb0a36">
                      음수 또는 유효하지 않은 값이 있습니다. 원본 값은 범례와 패널 데이터에서 확인하세요.
                    </Trans>
                  </span>
                </div>
              ) : (
                <>
                  <svg
                    width={size}
                    height={size}
                    ref={containerRef}
                    aria-label="구성비 차트"
                    style={{ overflow: 'visible' }}
                  >
                    <g transform={`translate(${size / 2},${size / 2})`}>
                      {composition.total === 0 && (
                        <circle
                          r={(outer + inner) / 2}
                          fill={inner ? 'none' : tokens.tooltipHeaderBackground}
                          stroke={inner ? tokens.tooltipHeaderBackground : 'none'}
                          strokeWidth={outer - inner}
                        />
                      )}
                      <Pie
                        data={composition.visible}
                        pieValue={(entry) => entry.value.display.numeric}
                        outerRadius={outer}
                        innerRadius={inner}
                        cornerRadius={wallPieTokens.corner}
                        padAngle={0}
                      >
                        {(pie) => (
                          <>
                            {pie.arcs.map((arc) => {
                              if (arc.endAngle <= arc.startAngle) {
                                return null;
                              }
                              const entry = arc.data;
                              const name = entry.value.display.title ?? '';
                              const links = entry.value.hasLinks ? (entry.value.getLinks?.() ?? []) : [];
                              const path = (
                                <path
                                  d={pie.path(arc) ?? ''}
                                  fill={entry.value.display.color ?? FALLBACK_COLOR}
                                  stroke={tokens.surface}
                                  strokeWidth={Math.min(
                                    wallPieTokens.separator,
                                    (arc.endAngle - arc.startAngle) * outer * 0.2
                                  )}
                                />
                              );
                              return (
                                <g
                                  key={entry.id}
                                  className="wall-pie-slice"
                                  data-entry-id={entry.id}
                                  data-dimmed={Boolean(active && active !== entry.id) || undefined}
                                  data-active={active === entry.id || undefined}
                                  role={links.length === 1 ? undefined : 'button'}
                                  tabIndex={links.length === 1 ? undefined : 0}
                                  aria-label={`${name}: ${valueText(entry)}, ${formatPiePercent(piePercent(entry, composition), entry.value.field.decimals)}`}
                                  onMouseEnter={() => emphasize(entry)}
                                  onMouseLeave={() => {
                                    emphasize();
                                    tooltip.hideTooltip();
                                  }}
                                  onFocus={() => emphasize(entry)}
                                  onBlur={() => emphasize()}
                                  onMouseMove={(event) => {
                                    if (options.tooltip.mode === 'none' || menu) {
                                      return;
                                    }
                                    const point = localPoint(event.currentTarget.ownerSVGElement!, event);
                                    if (point) {
                                      tooltip.showTooltip({
                                        tooltipData: entry,
                                        tooltipLeft: point.x,
                                        tooltipTop: point.y,
                                      });
                                    }
                                  }}
                                  onContextMenu={(event) => openActions(entry, event)}
                                  onClick={
                                    links.length === 1
                                      ? undefined
                                      : (event) => {
                                          if (links.length > 1) {
                                            openActions(entry, event);
                                          } else {
                                            setSelected(selected === entry.id ? undefined : entry.id);
                                          }
                                        }
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Escape') {
                                      setSelected(undefined);
                                    }
                                    if ((event.key === 'Enter' || event.key === ' ') && links.length !== 1) {
                                      event.preventDefault();
                                      setSelected(selected === entry.id ? undefined : entry.id);
                                    }
                                    if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
                                      event.preventDefault();
                                      const rect = event.currentTarget.getBoundingClientRect();
                                      returnFocus.current = host.current;
                                      setTarget({
                                        id: entry.id,
                                        x: rect.x + rect.width / 2,
                                        y: rect.y + rect.height / 2,
                                      });
                                      setMenu(true);
                                    }
                                  }}
                                >
                                  {links.length === 1 ? (
                                    <a
                                      href={links[0].href}
                                      target={links[0].target}
                                      rel={links[0].target === '_blank' ? 'noopener noreferrer' : undefined}
                                      aria-label={`${name} · ${links[0].title}`}
                                      onClick={(event) => links[0].onClick?.(event, links[0].origin)}
                                    >
                                      {path}
                                    </a>
                                  ) : (
                                    path
                                  )}
                                </g>
                              );
                            })}
                            {layoutPieLabels(pie.arcs, outer, inner, options.displayLabels ?? [], composition).map(
                              (label) => (
                                <text
                                  key={label.id}
                                  x={label.x}
                                  y={label.y - ((label.lines.length - 1) * wallPieTokens.labelLine) / 2}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill={label.color}
                                  fontSize={wallPieTokens.labelSize}
                                  fontWeight={wallPieTokens.labelWeight}
                                  pointerEvents="none"
                                >
                                  {label.lines.map((line, i) => (
                                    <tspan key={i} x={label.x} dy={i ? wallPieTokens.labelLine : 0}>
                                      {line}
                                    </tspan>
                                  ))}
                                </text>
                              )
                            )}
                          </>
                        )}
                      </Pie>
                    </g>
                  </svg>
                  {inner >= wallPieTokens.centerMinimumRadius && (
                    <div className="wall-pie-center" style={{ width: centerWidth }} aria-live="off">
                      <span className="wall-pie-center-caption" title={centerCaption}>
                        {centerCaption}
                      </span>
                      {centerValue ? (
                        <MeterValue value={centerValue} size={centerSize} muted={tokens.muted} />
                      ) : (
                        <strong style={{ fontSize: centerSize }}>
                          {composition.visible.length}
                          <small>
                            <Trans i18nKey="wall.wall-pie-chart.text-11600c9a">개</Trans>
                          </small>
                        </strong>
                      )}
                      <span className="wall-pie-center-caption">
                        {selectedEntry
                          ? formatPiePercent(piePercent(selectedEntry, composition), selectedEntry.value.field.decimals)
                          : composition.total === 0
                            ? '비율 없음'
                            : '표시 데이터 기준'}
                      </span>
                    </div>
                  )}
                  {!composition.sameUnit && (
                    <span className="wall-pie-unit-warning">
                      <Trans i18nKey="wall.wall-pie-chart.text-f42cad41">서로 다른 단위 · 수치 비율</Trans>
                    </span>
                  )}
                </>
              )}
            </div>
          );
        }}
      </VizLayout>
      {options.tooltip.mode !== 'none' && tooltip.tooltipOpen && !menu && (
        <TooltipInPortal
          top={tooltip.tooltipTop}
          left={tooltip.tooltipLeft}
          unstyled
          applyPositionStyle
          className={`wall-pie-tooltip ${css({
            background: tokens.surface,
            color: tokens.text,
            border: `1px solid ${tokens.border}`,
            borderRadius: tokens.radius,
            boxShadow: tokens.shadow,
            maxWidth: `min(${tokens.tooltipMaxWidth}px, calc(100vw - ${wallPieTokens.margin * 2}px))`,
            pointerEvents: 'none',
          })}`}
        >
          <WallTimeSeriesTooltip
            header={null}
            timestamp={null}
            isPinned={false}
            scrollable
            maxHeight={300}
            tokens={tokens}
            items={tooltipEntries
              .filter((entry) => !entry.value.field.custom?.hideFrom?.tooltip)
              .map((entry) => ({
                label: entry.value.display.title ?? '',
                value: `${valueText(entry)}  ·  ${formatPiePercent(piePercent(entry, composition), entry.value.field.decimals)}`,
                color: entry.value.display.color ?? FALLBACK_COLOR,
                isActive: entry.id === tooltip.tooltipData?.id,
              }))}
          />
        </TooltipInPortal>
      )}
      <WallPieActions
        entries={entries}
        composition={composition}
        target={target}
        open={menu}
        onOpenChange={setMenu}
        onClosed={() => {
          setMenu(false);
          setTarget(null);
        }}
        select={setSelected}
        returnFocus={returnFocus}
      />
    </div>
  );
}
