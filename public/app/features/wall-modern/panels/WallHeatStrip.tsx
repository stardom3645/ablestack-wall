import { Tooltip } from '@base-ui/react/tooltip';
import { useId, useMemo } from 'react';
import tinycolor from 'tinycolor2';

import {
  dateTimeFormat,
  FieldDisplay,
  getDisplayProcessor,
  TimeRange,
  TimeZone,
  FieldConfigSource,
  DataFrame,
} from '@grafana/data';
import { getValueMappingResult } from '@grafana/data/src/utils/valueMappings';
import type { VizTextDisplayOptions } from '@grafana/schema';
import { useTheme2, DataLinksContextMenu } from '@grafana/ui';
import { PanelScrollArea } from '@grafana/ui/src/components/PanelScrollArea/PanelScrollArea';
import { Trans } from 'app/core/internationalization';

import { wallDisplayText } from '../formatSystem';
import { wallSurfaceTokens, wallSurfaceVariables } from '../surfaceTokens';
import { wallTypography, wallTypographyVariables } from '../typography';
import { Button } from '../ui';

import { MeterValue } from './MeterValue';
import { heatBuckets, heatAggregationLabels, HeatAggregation } from './heatStripModel';
import { meterAppearance, meterColors, WallMeterOptions } from './meterPresentation';
import { wallMeterTokens } from './meterTokens';

export function WallHeatStrip({
  values,
  range,
  timeZone,
  width,
  height,
  options,
  config,
  frames,
  hideNames,
  hideValues,
  colorValues,
}: {
  values: FieldDisplay[];
  range: TimeRange;
  timeZone: TimeZone;
  width: number;
  height: number;
  options: WallMeterOptions & { text?: VizTextDisplayOptions };
  config: FieldConfigSource;
  frames: DataFrame[];
  hideNames: boolean;
  hideValues: boolean;
  colorValues?: boolean;
}) {
  const tooltipId = useId();
  const theme = useTheme2();
  const surface = theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  const t = wallMeterTokens;
  const columns = Math.max(
    1,
    Math.min(t.heatMaxColumns, Math.floor(Math.max(1, width - t.inset * 2) / t.heatCellWidth))
  );
  const aggregation: HeatAggregation = options.wallHeatAggregation ?? 'last';
  const from = range.from.valueOf(),
    to = range.to.valueOf();
  const rows = useMemo(
    () => values.map((item) => ({ item, ...heatBuckets(item, from, to, columns, aggregation) })),
    [values, from, to, columns, aggregation]
  );
  const formatTime = (value: number) => dateTimeFormat(value, { timeZone, format: 'YYYY-MM-DD HH:mm:ss' });
  return (
    <Tooltip.Provider delay={100}>
      <PanelScrollArea
        data-wall-heat-strip
        style={{
          width,
          height,
          overflow: 'auto',
          padding: t.inset,
          boxSizing: 'border-box',
          fontFamily: wallTypography.family,
          fontSize: wallTypography.roles.control.size,
          color: surface.panelText,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: t.meterGap,
            color: surface.panelMuted,
            fontSize: wallTypography.roles.caption.size,
            marginBottom: t.meterGap,
          }}
        >
          <span title={heatAggregationLabels[aggregation]}>
            <Trans i18nKey="wall.wall-heat-strip.text-411c2479">Heat Strip · </Trans>
            {heatAggregationLabels[aggregation]}
          </span>
          <span>
            <Trans i18nKey="wall.wall-heat-strip.text-902460cc">과거 → 현재</Trans>
          </span>
        </div>
        {!rows.length && (
          <div role="status">
            <Trans i18nKey="wall.wall-heat-strip.text-5faa741d">표시할 숫자 필드가 없습니다.</Trans>
          </div>
        )}
        {rows.map(({ item, buckets, reason }, ri) => {
          const label = item.display.title ?? item.name;
          const appearance = meterAppearance(item, config, frames, options);
          const palette = meterColors(item.display, { ...appearance, colorSource: 'default' }, theme);
          const field = item.view?.dataFrame.fields[item.colIndex ?? -1];
          const display = getDisplayProcessor({
            field: field ? { ...field, config: item.field } : { config: item.field },
            theme,
            timeZone,
          });
          const finite = buckets?.flatMap((b) => (b.value === null ? [] : [b.value])) ?? [];
          const min = item.field.min ?? (finite.length ? Math.min(...finite) : 0);
          const max = item.field.max ?? (finite.length ? Math.max(...finite) : 1);
          const missing = theme.isDark ? t.darkTrack : t.lightTrack;
          return (
            <div key={ri} style={{ marginBottom: t.heatRowGap }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: t.meterGap,
                  marginBottom: t.meterGap,
                }}
              >
                {!hideNames && (
                  <span
                    title={`${label} · 계산: ${item.name}`}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                  >
                    {label}
                  </span>
                )}
                {!hideValues && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      color:
                        colorValues && item.display.color ? meterColors(item.display, appearance, theme)[0] : undefined,
                    }}
                    title={`기존 계산: ${item.name}`}
                  >
                    <MeterValue
                      value={item.display}
                      size={options.text?.valueSize ?? wallTypography.roles.body.size}
                      muted={surface.panelMuted}
                    />
                  </span>
                )}
              </div>
              {item.hasLinks && item.getLinks && (
                <DataLinksContextMenu links={item.getLinks}>
                  {({ openMenu }) => (
                    <Button variant="ghost" size="sm" onClick={openMenu} aria-label={`${label} 데이터 링크`}>
                      <Trans i18nKey="wall.wall-heat-strip.text-107286a9">데이터 링크 ↗</Trans>
                    </Button>
                  )}
                </DataLinksContextMenu>
              )}
              {reason ? (
                <div role="status" style={{ color: surface.panelMuted, fontSize: wallTypography.roles.caption.size }}>
                  {reason}
                </div>
              ) : (
                <div
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: t.lcdGap }}
                >
                  {buckets?.map((bucket, bi) => {
                    const formatted = bucket.value === null ? undefined : display(bucket.value);
                    const intensity =
                      max > min && bucket.value !== null
                        ? Math.max(0, Math.min(1, (bucket.value - min) / (max - min)))
                        : 0.5;
                    const color =
                      formatted &&
                      (appearance.colorSource === 'configured' ||
                        (bucket.value !== null &&
                          getValueMappingResult(item.field.mappings ?? [], bucket.value)?.color))
                        ? theme.visualization.getColorByName(formatted.color ?? palette[0])
                        : tinycolor.mix(missing, palette[0], 20 + intensity * 80).toHexString();
                    const valueText = formatted
                      ? wallDisplayText(formatted)
                      : bucket.state === 'null'
                        ? 'Null'
                        : bucket.state === 'invalid'
                          ? '유효하지 않은 값'
                          : '데이터 없음';
                    const detail = `${label} · ${formatTime(bucket.from)} – ${formatTime(bucket.to)} · ${valueText}`;
                    return (
                      <Tooltip.Root key={bi}>
                        <Tooltip.Trigger
                          render={<button type="button" />}
                          aria-label={detail}
                          aria-describedby={`${tooltipId}-${ri}-${bi}`}
                          data-wall-heat-cell={bucket.state}
                          style={{
                            height: t.heatCellHeight,
                            border: 0,
                            padding: 0,
                            borderRadius: t.lcdRadius,
                            background: bucket.state === 'value' ? color : missing,
                            cursor: 'default',
                            boxShadow:
                              bucket.state === 'null' || bucket.state === 'invalid'
                                ? `inset 0 0 0 1px ${surface.panelMuted}`
                                : undefined,
                          }}
                        />
                        <Tooltip.Portal>
                          <Tooltip.Positioner sideOffset={6} className="wall-menu-positioner">
                            <Tooltip.Popup
                              role="tooltip"
                              id={`${tooltipId}-${ri}-${bi}`}
                              className="wall-modern wall-primary-tooltip"
                              style={{
                                ...wallSurfaceVariables(theme.isDark, true),
                                ...wallTypographyVariables,
                                maxWidth: 340,
                              }}
                            >
                              <strong>{label}</strong>
                              <div>
                                {formatTime(bucket.from)}
                                <Trans i18nKey="wall.wall-heat-strip.text-0e467cbe"> – </Trans>
                                {formatTime(bucket.to)}
                              </div>
                              <div>{valueText}</div>
                              <div>
                                {heatAggregationLabels[aggregation]}
                                <Trans i18nKey="wall.wall-heat-strip.text-d4fe38e9"> · 유효 </Trans>
                                {bucket.valid}
                                <Trans i18nKey="wall.wall-heat-strip.text-09ddb8a1"> / 전체 </Trans>
                                {bucket.samples}
                                <Trans i18nKey="wall.wall-heat-strip.text-11600c9a">개</Trans>
                              </div>
                              <div>
                                <Trans i18nKey="wall.wall-heat-strip.text-40fe9b26">색상:</Trans>{' '}
                                {appearance.colorSource === 'configured'
                                  ? '기존 필드 색상·임계치'
                                  : `${wallDisplayText(display(min))} – ${wallDisplayText(display(max))} · 테마 강도`}
                              </div>
                            </Tooltip.Popup>
                          </Tooltip.Positioner>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: wallTypography.roles.caption.size,
            color: surface.panelMuted,
          }}
        >
          <span>{dateTimeFormat(from, { timeZone, format: 'HH:mm' })}</span>
          <span title="빈 셀: 데이터 없음 · 윤곽 셀: Null/유효하지 않은 값">
            <Trans i18nKey="wall.wall-heat-strip.text-b65c68ed">빈 셀 ≠ 0</Trans>
          </span>
          <span>{dateTimeFormat(to, { timeZone, format: 'HH:mm' })}</span>
        </div>
      </PanelScrollArea>
    </Tooltip.Provider>
  );
}
