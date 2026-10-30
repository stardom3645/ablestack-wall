import {
  DataFrame,
  Field,
  FieldConfig,
  FieldType,
  formattedValueToString,
  getDisplayProcessor,
  GrafanaTheme2,
} from '@grafana/data';

export type WallDisplayKind =
  | 'kpi'
  | 'usage'
  | 'service'
  | 'capacity'
  | 'counts'
  | 'records'
  | 'filesystem'
  | 'devices';
export const displayKinds: Record<number, WallDisplayKind> = {
  28: 'kpi',
  30: 'kpi',
  34: 'kpi',
  36: 'kpi',
  32: 'usage',
  38: 'usage',
  40: 'usage',
  8: 'capacity',
  138: 'counts',
  224: 'counts',
  242: 'service',
  241: 'service',
  237: 'service',
  239: 'service',
  251: 'service',
  240: 'service',
  236: 'service',
  250: 'service',
  226: 'records',
  228: 'records',
  230: 'records',
  244: 'filesystem',
  246: 'devices',
  249: 'records',
};

/** A bounded chart is drawn only for a valid source ratio; never repair/clamp its value. */
export function usageFraction(raw: unknown, unit: string | undefined) {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return undefined;
  }
  const ratio = unit === 'percentunit' ? raw : unit === 'percent' ? raw / 100 : undefined;
  return ratio !== undefined && ratio >= 0 && ratio <= 1 ? ratio : undefined;
}

/** Capacity segments must reconcile. 'available' and 'free' must not be silently interchanged. */
export function capacityRelation(total: unknown, used: unknown, available?: unknown) {
  if (
    typeof total !== 'number' ||
    typeof used !== 'number' ||
    !Number.isFinite(total) ||
    !Number.isFinite(used) ||
    total <= 0 ||
    used < 0 ||
    used > total
  ) {
    return undefined;
  }
  if (
    available !== undefined &&
    (typeof available !== 'number' ||
      !Number.isFinite(available) ||
      available < 0 ||
      Math.abs(total - used - available) > Math.max(1, total * 1e-9))
  ) {
    return undefined;
  }
  return { ratio: used / total, remaining: available ?? total - used };
}

export function fieldText(field: Field, row: number, theme: GrafanaTheme2) {
  const value = field.values[row];
  // Strings remain identifiers even if a panel-level numeric unit was inherited.
  return field.type === FieldType.string && !field.config.mappings?.length
    ? String(value)
    : formattedValueToString((field.display ?? getDisplayProcessor({ field, theme }))(value));
}

export function metricField(frame: DataFrame, ref: string) {
  return (
    frame.fields.find((field) => field.name === `Value #${ref}`) ??
    (frame.refId === ref ? frame.fields.find((field) => field.type === FieldType.number) : undefined)
  );
}

export function rowIdentity(frame: DataFrame, row: number) {
  return (
    frame.fields
      .filter((field) => field.type === FieldType.string)
      .map((field) => String(field.values[row] ?? ''))
      .filter(Boolean)
      .join(' · ') || `${frame.name ?? '항목'} ${row + 1}`
  );
}

/** Retain the configured threshold positions rather than replacing them with generic 75/90 defaults. */
export function thresholdMarks(field: FieldConfig) {
  return (field.thresholds?.steps ?? []).flatMap((step) => {
    if (!Number.isFinite(step.value) || typeof step.value !== 'number') {
      return [];
    }
    const ratio = field.thresholds?.mode === 'percentage' ? step.value / 100 : usageFraction(step.value, field.unit);
    return ratio !== undefined && ratio >= 0 && ratio <= 1 ? [{ ratio, color: step.color }] : [];
  });
}
