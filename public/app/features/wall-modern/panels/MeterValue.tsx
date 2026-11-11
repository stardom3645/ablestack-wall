import type { DisplayValue } from '@grafana/data';

import { wallDisplayText } from '../formatSystem';
import { wallTypography } from '../typography';

import { wallMeterTokens } from './meterTokens';

export function MeterValue({
  value,
  size,
  muted,
  colorIndicator,
}: {
  value: DisplayValue;
  size: number;
  muted: string;
  colorIndicator?: string;
}) {
  const unit = Math.min(wallTypography.roles.unit.size, size * wallMeterTokens.unitScale);
  return (
    <span
      title={wallDisplayText(value)}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 2,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.2,
      }}
    >
      {colorIndicator && (
        <i
          data-wall-meter-status
          aria-hidden="true"
          style={{
            alignSelf: 'center',
            flexShrink: 0,
            width: wallMeterTokens.statusDot,
            height: wallMeterTokens.statusDot,
            borderRadius: '50%',
            background: colorIndicator,
          }}
        />
      )}
      {value.prefix && <span style={{ fontSize: unit, color: muted }}>{value.prefix}</span>}
      <strong style={{ fontSize: size, fontWeight: wallTypography.roles.gauge.weight }}>{value.text}</strong>
      {value.suffix && (
        <span style={{ fontSize: unit, fontWeight: wallTypography.roles.unit.weight, color: muted }}>
          {value.suffix}
        </span>
      )}
    </span>
  );
}
