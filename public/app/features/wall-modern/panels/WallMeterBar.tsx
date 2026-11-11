import { Meter } from '@base-ui/react/meter';

import { formattedValueToString, FieldColorModeId, ThresholdsMode, VizOrientation } from '@grafana/data';
import { BarGaugeNamePlacement, BarGaugeValueMode, BarGaugeDisplayMode } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import { getCellColor, getValuePercent, type Props } from '@grafana/ui/src/components/BarGauge/BarGauge';
import { calculateFontSize } from '@grafana/ui/src/utils/measureText';

import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypography } from '../typography';

import { MeterValue } from './MeterValue';
import { segmentedFraction } from './heatStripModel';
import { formatMeterBound, meterColors, meterInterval, meterSegments } from './meterPresentation';
import { wallMeterTokens } from './meterTokens';

export function WallMeterBar(props: Props) {
  const {
    value,
    field,
    orientation,
    width,
    height,
    text,
    showUnfilled,
    valueDisplayMode,
    namePlacement,
    wallAppearance,
  } = props;
  const theme = useTheme2(),
    t = wallMeterTokens;
  const colors = meterColors(value, wallAppearance, theme);
  const surface = theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  const min = field.min ?? 0,
    max = field.max ?? 100;
  const nativeRatio = getValuePercent(value.numeric, min, max);
  const ratio = Number.isFinite(nativeRatio) ? Math.max(0, Math.min(1, nativeRatio)) : 0;
  const vertical = orientation === VizOrientation.Vertical;
  const lcd = props.displayMode === BarGaugeDisplayMode.Lcd;
  const thickness = lcd ? t.segmentThickness : t.meterThickness;
  const interval = meterInterval(
    field,
    value,
    theme,
    wallAppearance?.useThresholds !== false && wallAppearance?.colorSource !== 'default',
    ((value.numeric - min) / (max - min)) * 100
  );
  const bounds = `${formatMeterBound(min, field, theme)} – ${formatMeterBound(max, field, theme)}`;
  const size =
    text?.valueSize ??
    Math.min(
      lcd ? wallTypography.roles.status.size : wallTypography.roles.gauge.size,
      Math.max(12, height * 0.28),
      calculateFontSize(formattedValueToString(value), width - t.inset * 2, height / 2, 1)
    );
  const title = namePlacement !== BarGaugeNamePlacement.Hidden ? value.title : undefined;
  const left = !vertical && namePlacement === BarGaugeNamePlacement.Left && Boolean(title);
  const hidden = valueDisplayMode === BarGaugeValueMode.Hidden;
  const padding = Math.min(t.inset, Math.max(0, height / 12));
  const trackLength = vertical
    ? height -
      padding * 2 -
      (title ? wallTypography.roles.legend.line + t.meterGap : 0) -
      (hidden ? 0 : size * 1.2 + t.meterGap) -
      (height >= 92 ? wallTypography.roles.caption.line + t.meterGap : 0)
    : (width - padding * 2 - (left ? t.meterGap : 0)) * (left ? 0.75 : 1);
  const cellCount = Math.max(1, Math.min(t.segmentMaxCells, Math.floor(Math.max(0, trackLength) / t.segmentCellWidth)));
  const duo = wallAppearance?.finish === 'duo' && wallAppearance.colorSource === 'default';
  const marks =
    wallAppearance?.useThresholds !== false && field.color?.mode === FieldColorModeId.Thresholds
      ? field.thresholds?.steps
          .filter((s) => Number.isFinite(s.value))
          .map((s) => ({
            ...s,
            ratio:
              field.thresholds?.mode === ThresholdsMode.Percentage ? s.value / 100 : getValuePercent(s.value, min, max),
          }))
          .filter((s) => s.ratio > 0 && s.ratio < 1)
      : [];
  const segments =
    props.displayMode === BarGaugeDisplayMode.Gradient && wallAppearance?.colorSource !== 'default'
      ? meterSegments(field, value, min, max, theme)
      : [];
  const track = (
    <Meter.Root
      value={value.numeric}
      min={min}
      max={max}
      aria-label={title ?? '사용량'}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={
        Number.isFinite(value.numeric) && value.numeric >= min && value.numeric <= max ? value.numeric : undefined
      }
      aria-valuetext={formattedValueToString(value)}
      title={`${formattedValueToString(value)} / ${bounds}`}
      style={{
        position: 'relative',
        gridColumn: left ? 2 : undefined,
        flex: vertical ? '1 1 auto' : undefined,
        width: vertical ? thickness : '100%',
        height: vertical ? undefined : thickness,
        minHeight: vertical ? 12 : undefined,
        borderRadius: lcd ? t.lcdRadius : 999,
        background: !lcd && showUnfilled ? (theme.isDark ? t.darkTrack : t.lightTrack) : 'transparent',
      }}
    >
      {lcd ? (
        <span
          data-wall-meter-lcd
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            gap: t.lcdGap,
            flexDirection: vertical ? 'column-reverse' : 'row',
          }}
        >
          {Array.from({ length: cellCount }, (_, index) => {
            const position = min + ((max - min) / cellCount) * index;
            const cell = getCellColor(position, value, props.display);
            const fraction = Number.isFinite(value.numeric) ? segmentedFraction(ratio, index, cellCount) : 0;
            return (
              <span
                key={index}
                data-wall-meter-cell={fraction > 0 ? 'filled' : 'empty'}
                data-wall-segment-fraction={fraction}
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  borderRadius: t.lcdRadius,
                  position: 'relative',
                  overflow: 'hidden',
                  background: showUnfilled ? (theme.isDark ? t.darkTrack : t.lightTrack) : 'transparent',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: vertical ? 'auto 0 0' : '0 auto 0 0',
                    width: vertical ? '100%' : `${fraction * 100}%`,
                    height: vertical ? `${fraction * 100}%` : '100%',
                    background:
                      wallAppearance?.colorSource === 'default' || !props.display ? colors[0] : cell.background,
                  }}
                />
              </span>
            );
          })}
        </span>
      ) : (
        <Meter.Indicator
          data-wall-meter-fill
          style={{
            position: 'absolute',
            inset: vertical ? 'auto 0 0' : '0 auto 0 0',
            width: vertical ? '100%' : `${ratio * 100}%`,
            height: vertical ? `${ratio * 100}%` : '100%',
            borderRadius: 'inherit',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: vertical ? 'column-reverse' : 'row',
            background: colors[0],
          }}
        >
          {segments.length > 0
            ? segments.map((segment, index) => (
                <span key={index} data-wall-meter-range style={{ flex: segment.size, background: segment.color }} />
              ))
            : duo && (
                <>
                  <span style={{ flex: 1, background: colors[0] }} />
                  <span style={{ flex: 1, background: colors[1] }} />
                </>
              )}
        </Meter.Indicator>
      )}
      {marks?.map((mark, index) => (
        <span
          key={index}
          title={`임계치 ${field.thresholds?.mode === ThresholdsMode.Percentage ? `${mark.value}%` : formatMeterBound(mark.value, field, theme)}`}
          style={{
            position: 'absolute',
            ...(vertical
              ? { bottom: `${mark.ratio * 100}%`, left: -2, width: thickness + 4, height: 1.5 }
              : { left: `${mark.ratio * 100}%`, top: -2, width: 1.5, height: thickness + 4 }),
            background: theme.visualization.getColorByName(mark.color),
          }}
        />
      ))}
    </Meter.Root>
  );
  return (
    <div
      data-wall-meter-bar={vertical ? 'vertical' : 'horizontal'}
      data-wall-meter-mode={props.displayMode}
      data-wall-color-source={wallAppearance?.colorSource ?? 'configured'}
      style={{
        width: '100%',
        height: '100%',
        padding,
        boxSizing: 'border-box',
        display: left ? 'grid' : 'flex',
        gridTemplateColumns: left ? 'minmax(0, 1fr) minmax(0, 3fr)' : undefined,
        alignContent: left ? 'center' : undefined,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: vertical ? 'center' : undefined,
        gap: t.meterGap,
        fontFamily: wallTypography.family,
        fontVariantNumeric: 'tabular-nums',
        color: surface.panelText,
      }}
    >
      <div
        style={{
          display: left ? 'contents' : 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: t.meterGap,
          width: '100%',
          minWidth: 0,
        }}
      >
        {title && (
          <span
            title={title}
            style={{
              gridColumn: left ? 1 : undefined,
              gridRow: left ? '1 / span 3' : undefined,
              alignSelf: 'center',
              fontSize: text?.titleSize ?? (lcd ? wallTypography.roles.control.size : wallTypography.roles.legend.size),
              color: surface.panelMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {title}
          </span>
        )}
        {!hidden && (
          <span
            style={{
              gridColumn: left ? 2 : undefined,
              justifySelf: 'end',
              flexShrink: 0,
              color: valueDisplayMode === BarGaugeValueMode.Color ? colors[0] : undefined,
            }}
          >
            <MeterValue value={value} size={size} muted={surface.panelMuted} />
          </span>
        )}
      </div>
      {track}
      {height >= 92 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: t.meterGap,
            width: '100%',
            gridColumn: left ? 2 : undefined,
            fontSize: wallTypography.roles.caption.size,
            color: surface.panelMuted,
            whiteSpace: 'nowrap',
          }}
        >
          <span title="원래 필드 범위">{bounds}</span>
          {interval && <span title="현재 임계치 구간">{interval}</span>}
        </div>
      )}
    </div>
  );
}
export const renderWallMeterBar = (props: Props) => <WallMeterBar {...props} />;
