import { Field, formattedValueToString, getValueFormat } from '@grafana/data';

/** Native DisplayValue is the contract: keep mappings, units, prefixes and explicit precision intact. */
export const wallDisplayText = formattedValueToString;

export function wallFieldText(field: Field, value: unknown) {
  if (field.display) {
    return wallDisplayText(field.display(value));
  }
  if (value == null) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** Ratios already calculated by the native pie renderer; never rescale the source field. */
export function wallPercentText(percent: number | undefined, decimals?: number | null) {
  if (percent === undefined || !Number.isFinite(percent)) {
    return '—';
  }
  const precision = Math.min(20, Math.max(0, decimals ?? 1));
  const format = (value: number) => wallDisplayText(getValueFormat('percent')(value, precision));
  return percent > 0 && Number(percent.toFixed(precision)) === 0 ? `<${format(10 ** -precision)}` : format(percent);
}
