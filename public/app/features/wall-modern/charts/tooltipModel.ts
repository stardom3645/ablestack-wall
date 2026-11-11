import { dateTimeFormat, dateTimeFormatISO, Field, formattedValueToString, TimeZone } from '@grafana/data';
import type { VizTooltipItem } from '@grafana/ui/src/components/VizTooltip/types';

export type WallTooltipItem = VizTooltipItem & { sampleTime?: number };

/** Precision describes an actual sample, never an inferred aggregation window. */
export function tooltipTime(timestamp: number, field: Field, timeZone: TimeZone) {
  const first = field.values[0],
    second = field.values[1];
  const interval =
    field.config.interval ??
    (typeof first === 'number' && typeof second === 'number' ? Math.abs(second - first) : undefined);
  const format =
    timestamp % 1000 !== 0 || (interval != null && interval < 1000)
      ? 'YYYY-MM-DD HH:mm:ss.SSS'
      : timestamp % 60000 !== 0 || (interval != null && interval < 60000)
        ? 'YYYY-MM-DD HH:mm:ss'
        : 'YYYY-MM-DD HH:mm';
  // Numeric defaults (e.g. percent) can also be present on the aligned Time field.
  // They are not an explicitly chosen date/time display format.
  const explicitTime = field.config.unit?.startsWith('time:') || field.config.unit?.startsWith('dateTime');
  return {
    // An explicit time unit/format remains the user's choice.
    text:
      explicitTime && field.display
        ? formattedValueToString(field.display(timestamp))
        : dateTimeFormat(timestamp, { timeZone, format }),
    short:
      explicitTime && field.display
        ? formattedValueToString(field.display(timestamp))
        : dateTimeFormat(timestamp, { timeZone, format: format.split(' ')[1] }),
    zone: dateTimeFormat(timestamp, { timeZone, format: 'z' }),
    exact: dateTimeFormatISO(timestamp, { timeZone, format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  };
}
