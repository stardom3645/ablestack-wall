import { FieldDisplay, FieldType } from '@grafana/data';

export type HeatAggregation = 'last' | 'mean' | 'max' | 'min';
export const heatAggregationLabels: Record<HeatAggregation, string> = {
  last: '구간 마지막 값 (Null 포함)',
  mean: '구간 평균 (유효값)',
  max: '구간 최댓값 (유효값)',
  min: '구간 최솟값 (유효값)',
};
export interface HeatBucket {
  from: number;
  to: number;
  value: number | null;
  samples: number;
  valid: number;
  state: 'empty' | 'null' | 'invalid' | 'value';
}
export function heatBuckets(item: FieldDisplay, from: number, to: number, count: number, aggregation: HeatAggregation) {
  const frame = item.view?.dataFrame;
  const field = item.colIndex === undefined ? undefined : frame?.fields[item.colIndex];
  const time = frame?.fields.find((f) => f.type === FieldType.time);
  if (!field || field.type !== FieldType.number || !time || item.rowIndex !== undefined) {
    return {
      reason: '시간 필드가 있는 시계열과 계산 값 모드가 필요합니다. 단일 값을 시간 데이터로 복제하지 않습니다.',
    };
  }
  if (!(Number.isFinite(from) && Number.isFinite(to) && to > from)) {
    return { reason: '유효한 대시보드 시간 범위가 필요합니다.' };
  }
  const points: Array<{ time: number; value: unknown }> = [];
  for (let i = 0; i < Math.min(time.values.length, field.values.length); i++) {
    const t = time.values[i];
    if (typeof t === 'number' && Number.isFinite(t) && t >= from && t <= to) {
      points.push({ time: t, value: field.values[i] });
    }
  }
  if (new Set(points.map((p) => p.time)).size < 2) {
    return {
      reason:
        '선택한 시간 범위에 서로 다른 시점의 측정값이 2개 이상 필요합니다. 현재 쿼리의 instant/range 설정을 확인하세요.',
    };
  }
  points.sort((a, b) => a.time - b.time);
  const columns = Math.max(1, Math.floor(count));
  const groups: Array<typeof points> = Array.from({ length: columns }, () => []);
  for (const point of points) {
    groups[Math.min(columns - 1, Math.floor(((point.time - from) / (to - from)) * columns))].push(point);
  }
  const buckets: HeatBucket[] = groups.map((group, i) => {
    const base = {
      from: from + ((to - from) * i) / columns,
      to: from + ((to - from) * (i + 1)) / columns,
      samples: group.length,
      valid: group.filter((p) => typeof p.value === 'number' && Number.isFinite(p.value)).length,
    };
    if (!group.length) {
      return { ...base, value: null, state: 'empty' };
    }
    const selected = aggregation === 'last' ? [group[group.length - 1]] : group;
    if (selected.some((p) => p.value != null && (typeof p.value !== 'number' || !Number.isFinite(p.value)))) {
      return { ...base, value: null, state: 'invalid' };
    }
    const numbers = selected.map((p) => p.value).filter((v): v is number => typeof v === 'number');
    if (!numbers.length) {
      return { ...base, value: null, state: 'null' };
    }
    const value =
      aggregation === 'mean'
        ? numbers.reduce((n, v) => n + v / numbers.length, 0)
        : aggregation === 'max'
          ? numbers.reduce((a, b) => Math.max(a, b))
          : aggregation === 'min'
            ? numbers.reduce((a, b) => Math.min(a, b))
            : numbers[0];
    return {
      ...base,
      value: Number.isFinite(value) ? value : null,
      state: Number.isFinite(value) ? 'value' : 'invalid',
    };
  });
  return { buckets };
}

/** A partially filled boundary cell keeps 13% at 13%, rather than lighting ceil(13% * N) cells. */
export function segmentedFraction(ratio: number, index: number, count: number) {
  return Math.max(0, Math.min(1, ratio * count - index));
}
