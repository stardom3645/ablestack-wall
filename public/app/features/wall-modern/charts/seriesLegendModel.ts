import { isSystemOverrideWithRef, type FieldConfigSource } from '@grafana/data';
import type { VizLegendItem } from '@grafana/ui/src/components/VizLegend/types';

export const legendSortKeys = [
  { value: 'Name', label: '이름' },
  { value: 'last', label: '현재값 (Last)' },
  { value: 'lastNotNull', label: '최근 유효값 (Last not null)' },
  { value: 'mean', label: '평균' },
  { value: 'max', label: '최댓값' },
  { value: 'min', label: '최솟값' },
] as const;
export type SeriesLegendItem = VizLegendItem & { getSortValue?: (key: string) => number | undefined };

/** Sort only a view copy. Missing/nonfinite values stay last in either direction. */
export function sortLegendItems(items: SeriesLegendItem[], key: string, descending: boolean) {
  const direction = descending ? -1 : 1;
  return items
    .map((item, index) => ({
      item,
      index,
      value:
        key === 'Name'
          ? undefined
          : ((legendSortKeys.some((option) => option.value === key) ? item.getSortValue?.(key) : undefined) ??
            item.getDisplayValues?.().find((v) => v.title === key)?.numeric),
    }))
    .sort((a, b) => {
      if (key === 'Name') {
        return direction * a.item.label.localeCompare(b.item.label, undefined, { numeric: true }) || a.index - b.index;
      }
      const av = a.value,
        bv = b.value;
      const validA = av != null && Number.isFinite(av),
        validB = bv != null && Number.isFinite(bv);
      if (!validA || !validB) {
        return validA ? -1 : validB ? 1 : a.index - b.index;
      }
      return direction * (av! - bv!) || a.index - b.index;
    })
    .map(({ item }) => item);
}
export function clearSeriesSelection(config: FieldConfigSource): FieldConfigSource {
  return { ...config, overrides: config.overrides.filter((rule) => !isSystemOverrideWithRef('hideSeriesFrom')(rule)) };
}
export function legendPlacement(
  saved: 'bottom' | 'right' | undefined,
  auto: boolean | undefined,
  width: number,
  height: number,
  minWidth: number
) {
  return !auto && saved ? saved : width >= minWidth && height >= 280 ? 'right' : 'bottom';
}
