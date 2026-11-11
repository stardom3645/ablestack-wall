import {
  formattedValueToString,
  GAUGE_DEFAULT_MAXIMUM,
  GAUGE_DEFAULT_MINIMUM,
  ThresholdsMode,
  FieldColorModeId,
} from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import type { Props } from '@grafana/ui/src/components/Gauge/Gauge';
import { DEFAULT_THRESHOLDS } from '@grafana/ui/src/components/Gauge/utils';
import { calculateFontSize } from '@grafana/ui/src/utils/measureText';

import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypography } from '../typography';

import { MeterValue } from './MeterValue';
import { meterColors, meterInterval } from './meterPresentation';
import { wallMeterTokens } from './meterTokens';

export const wallGaugeTokens = wallMeterTokens;

/** Identical to native percentage-threshold normalization; never rewrite the readout. */
export function gaugeScale({ field, value }: Pick<Props, 'field' | 'value'>) {
  let min = field.min ?? GAUGE_DEFAULT_MINIMUM;
  let max = field.max ?? GAUGE_DEFAULT_MAXIMUM;
  let numeric = value.numeric;
  if (field.thresholds?.mode === ThresholdsMode.Percentage) {
    min = 0;
    max = 100;
    numeric = value.percent === undefined ? numeric : value.percent * 100;
  }
  const ratio = max > min && Number.isFinite(numeric) ? Math.max(0, Math.min(1, (numeric - min) / (max - min))) : 0;
  return { min, max, numeric, ratio };
}

/** Only the display tree changes: native reduction, field labels, units and links stay upstream. */
export function WallGauge(props: Props) {
  const { field, value, width, height, text, showThresholdMarkers, wallAppearance } = props;
  const theme = useTheme2();
  const t = wallMeterTokens;
  const shape = t.shapes[wallAppearance?.shape ?? 'ring'] ?? t.shapes.ring;
  const scale = gaugeScale(props);
  const labelHeight = value.title ? t.labelHeight : 0;
  const diameter = Math.max(1, Math.min(width, ((height - labelHeight) * 100) / shape.viewHeight));
  const visualHeight = (diameter * shape.viewHeight) / 100;
  const circumference = 2 * Math.PI * t.radius;
  const arc = circumference * shape.sweep;
  const colors = meterColors(value, wallAppearance, theme);
  const surface = theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light;
  const track = theme.isDark ? t.darkTrack : t.lightTrack;
  const valueSize =
    text?.valueSize ??
    Math.min(
      wallTypography.roles.gauge.size,
      diameter * 0.22,
      calculateFontSize(formattedValueToString(value), diameter * 0.68, visualHeight * 0.35, 1)
    );
  const steps = field.color?.mode === FieldColorModeId.Thresholds ? (field.thresholds ?? DEFAULT_THRESHOLDS).steps : [];
  const interval = meterInterval(field, value, theme, wallAppearance?.colorSource !== 'default', scale.numeric);
  const length = scale.ratio * arc;
  const duo = wallAppearance?.finish === 'duo' && wallAppearance.colorSource === 'default';
  return (
    <div
      data-wall-gauge={wallAppearance?.shape ?? 'ring'}
      data-wall-color-source={wallAppearance?.colorSource ?? 'configured'}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: wallTypography.family,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div
        style={{ width: diameter, height: visualHeight, position: 'relative', flexShrink: 0 }}
        role="img"
        aria-label={`${value.title ?? ''} ${formattedValueToString(value)}${interval ? ` · ${interval}` : ''}`}
      >
        <svg viewBox={`0 0 100 ${shape.viewHeight}`} width="100%" height="100%" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={t.radius}
            fill="none"
            stroke={track}
            strokeWidth={t.stroke}
            strokeDasharray={`${arc} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${shape.rotation} 50 50)`}
          />
          {length > 0 && (
            <circle
              data-wall-meter-fill
              cx="50"
              cy="50"
              r={t.radius}
              fill="none"
              stroke={colors[0]}
              strokeWidth={t.stroke}
              strokeDasharray={`${duo ? length / 2 : length} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(${shape.rotation} 50 50)`}
            />
          )}
          {length > 0 && duo && (
            <circle
              cx="50"
              cy="50"
              r={t.radius}
              fill="none"
              stroke={colors[1]}
              strokeWidth={t.stroke}
              strokeDasharray={`${length / 2} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(${shape.rotation + (length / circumference) * 180} 50 50)`}
            />
          )}
          {showThresholdMarkers &&
            steps
              .filter((step) => Number.isFinite(step.value) && step.value > scale.min && step.value < scale.max)
              .map((step, index) => {
                const angle =
                  ((shape.rotation + ((step.value - scale.min) / (scale.max - scale.min)) * 360 * shape.sweep) *
                    Math.PI) /
                  180;
                const point = (r: number) => ({ x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) });
                const start = point(t.radius - 1.6),
                  end = point(t.radius + 1.6);
                return (
                  <line
                    key={index}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={theme.visualization.getColorByName(step.color)}
                    strokeWidth="1.5"
                  >
                    <title>{`임계치 ${step.value}`}</title>
                  </line>
                );
              })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: wallAppearance?.shape === 'semi' ? '34% 9% 0' : '16% 9%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: surface.panelText,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <MeterValue
            value={value}
            size={valueSize}
            muted={surface.panelMuted}
            colorIndicator={
              scale.ratio === 0 && wallAppearance?.colorSource !== 'default' && value.color ? colors[0] : undefined
            }
          />
          {interval && visualHeight >= 68 && (
            <span
              title={`현재 임계치 구간: ${interval}`}
              style={{
                fontSize: wallTypography.roles.caption.size,
                lineHeight: 1.3,
                color: surface.panelMuted,
                whiteSpace: 'nowrap',
              }}
            >
              {interval}
            </span>
          )}
        </div>
      </div>
      {value.title && (
        <div
          title={value.title}
          style={{
            maxWidth: '100%',
            height: labelHeight,
            fontSize: text?.titleSize ?? wallTypography.roles.legend.size,
            fontWeight: wallTypography.roles.legend.weight,
            color: surface.panelMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: `${labelHeight}px`,
          }}
        >
          {value.title}
        </div>
      )}
    </div>
  );
}
export const renderWallGauge = (props: Props) => <WallGauge {...props} />;
