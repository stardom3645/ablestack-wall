import { DataSourceInstanceSettings } from '@grafana/data';

/** Presentation only: never substitute the native UID, type or instance. */
export function sourcePresentation(ds: DataSourceInstanceSettings) {
  if (ds.meta?.builtIn) {
    switch (ds.uid) {
      case '-- Mixed --':
        return {
          name: '여러 데이터 소스 사용',
          detail: 'Mixed · 쿼리마다 데이터 소스 선택',
          aliases: 'mixed 혼합',
          icon: 'mixed' as const,
        };
      case '-- Dashboard --':
        return {
          name: '대시보드 결과 재사용',
          detail: 'Dashboard · 같은 대시보드의 패널 결과 사용',
          aliases: 'dashboard 대시보드',
          icon: 'dashboard' as const,
        };
      case 'grafana':
        return {
          name: '내장 데이터',
          detail: 'Grafana · 내장 쿼리와 데이터 사용',
          aliases: 'grafana 내장',
          icon: 'grafana' as const,
        };
    }
  }
  return { name: ds.name, detail: ds.meta?.name || ds.type, aliases: '', icon: undefined };
}
