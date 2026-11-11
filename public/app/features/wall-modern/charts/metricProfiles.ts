import type { TimeSeriesPresentation } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import type { Options } from 'app/plugins/panel/timeseries/panelcfg.gen';

/** A presentation profile, never an inferred unit, aggregation, threshold or query rewrite. */
export const metricProfiles = [
  {
    value: 'auto',
    label: '자동 / 일반',
    hint: '원래 단위와 축 범위를 유지합니다. 기본 연결은 선형이며, 저장된 곡선·계단 설정을 우선합니다.',
    lineWidth: 2,
    fillOpacity: 6,
    hoverPointSize: 6,
  },
  {
    value: 'cpu',
    label: 'CPU',
    hint: '사용률은 기존 백분율 단위를 확인하세요. 코어 수·시간 등 다른 CPU 지표의 단위와 축은 그대로 유지됩니다.',
    lineWidth: 2,
    fillOpacity: 6,
    hoverPointSize: 6,
  },
  {
    value: 'memory',
    label: '메모리',
    hint: '사용률(%)과 용량(B·MiB·GiB)을 구분해 단위를 선택하세요. 단위나 0–100 범위를 자동 지정하지 않습니다.',
    lineWidth: 2,
    fillOpacity: 6,
    hoverPointSize: 6,
  },
  {
    value: 'network',
    label: '네트워크',
    hint: '송수신 시리즈의 기존 bit/s·B/s 단위를 유지합니다. 방향 비교를 위해 값을 음수로 바꾸지 않습니다.',
    lineWidth: 1.5,
    fillOpacity: 4,
    hoverPointSize: 6,
  },
  {
    value: 'disk',
    label: '디스크 I/O',
    hint: 'IOPS와 처리량의 단위를 구분하세요. 짧은 변화와 피크는 수집 지점을 그대로 연결해 표시합니다.',
    lineWidth: 1.5,
    fillOpacity: 4,
    hoverPointSize: 6,
  },
  {
    value: 'latency',
    label: '지연시간',
    hint: 'ms·µs·s 등 원래 단위와 실제 피크를 유지합니다. 이상치를 숨기는 평활화나 축 제한을 적용하지 않습니다.',
    lineWidth: 1.5,
    fillOpacity: 3,
    hoverPointSize: 7,
  },
  {
    value: 'storage',
    label: '스토리지',
    hint: '용량·사용률·처리량의 기존 단위를 유지합니다. 용량을 백분율로 변환하거나 사용량을 계산하지 않습니다.',
    lineWidth: 2,
    fillOpacity: 6,
    hoverPointSize: 6,
  },
] as const;

export type MetricType = (typeof metricProfiles)[number]['value'];
export type WallTimeSeriesOptions = Options & { wallMetricType?: MetricType; wallLegendAuto?: boolean };

export function metricProfile(value: unknown) {
  return metricProfiles.find((profile) => profile.value === value) ?? metricProfiles[0];
}

export function metricPresentation(tokens: TimeSeriesPresentation, value: unknown): TimeSeriesPresentation {
  const profile = metricProfile(value);
  return {
    ...tokens,
    lineWidth: profile.lineWidth,
    fillOpacity: profile.fillOpacity,
    hoverPointSize: profile.hoverPointSize,
  };
}
