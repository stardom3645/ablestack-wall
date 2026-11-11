import { Input } from '@base-ui/react/input';
import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { config } from '@grafana/runtime';
import { t } from 'app/core/internationalization';
import { VizTypeChangeDetails } from 'app/features/panel/components/VizTypePicker/types';
import { filterPluginList, getAllPanelPluginMeta, getVizPluginMeta } from 'app/features/panel/state/util';

import { Dialog } from '../components/ui/dialog';
import { Button } from '../ui';

import { WallVisualizationIcon } from './WallVisualizationIcon';
import { wallOptionText } from './optionText';

const categories = [
  { id: 'all', label: '전체', plugins: [] },
  { id: 'time', label: '시간 및 추세', plugins: ['timeseries', 'graph', 'state-timeline', 'status-history', 'trend'] },
  {
    id: 'status',
    label: '상태 및 통계',
    plugins: ['stat', 'gauge', 'bargauge', 'alertlist', 'annolist', 'grafana-clock-panel'],
  },
  {
    id: 'compare',
    label: '비교 및 분포',
    plugins: ['barchart', 'piechart', 'histogram', 'heatmap', 'table', 'xychart'],
  },
  { id: 'relations', label: '관계 및 지도', plugins: ['nodeGraph', 'geomap', 'canvas'] },
  { id: 'logs', label: '로그 및 추적', plugins: ['logs', 'traces', 'flamegraph'] },
  { id: 'other', label: '기타', plugins: [] },
];
const purpose: Record<string, string> = {
  timeseries: '시간에 따른 값과 여러 시리즈의 변화를 비교합니다.',
  stat: '주요 지표의 값과 상태를 명확하게 표시합니다.',
  gauge: '설정한 범위와 임계치를 기준으로 사용률을 확인합니다.',
  bargauge: '여러 항목의 수치를 막대 게이지로 비교합니다.',
  table: '여러 필드와 행의 상세 데이터를 확인합니다.',
  barchart: '항목별 값을 막대 길이로 비교합니다.',
  piechart: '항목별 구성 비율을 확인합니다.',
  histogram: '값이 어느 구간에 분포하는지 확인합니다.',
  heatmap: '시간과 값 구간에 따른 데이터 밀도를 확인합니다.',
  logs: '로그 메시지를 시간 순서로 탐색합니다.',
  text: '설명과 안내를 텍스트 또는 Markdown으로 작성합니다.',
  'state-timeline': '상태 변화와 각 상태의 지속 시간을 확인합니다.',
  'status-history': '일정 간격으로 기록된 상태의 변화를 확인합니다.',
  alertlist: '경보의 현재 상태와 관련 규칙을 확인합니다.',
  dashlist: '관련 대시보드 목록과 이동 링크를 표시합니다.',
  news: 'RSS 피드의 소식을 표시합니다.',
  annolist: '주석과 이벤트 기록을 목록으로 확인합니다.',
  candlestick: '시작·최고·최저·종료 값을 함께 비교합니다.',
  canvas: '요소와 데이터 표시를 자유롭게 배치합니다.',
  flamegraph: '프로파일의 호출 구조와 자원 비중을 분석합니다.',
  geomap: '위치 정보가 있는 데이터를 지도 위에 표시합니다.',
  nodeGraph: '노드와 연결의 관계를 그래프로 탐색합니다.',
  traces: '추적 데이터와 개별 구간의 실행 흐름을 확인합니다.',
  trend: '시간이 아닌 X축 값에 따른 추세를 표시합니다.',
  xychart: '두 수치 필드 사이의 관계와 분포를 확인합니다.',
};
export function visualizationCategory(id: string) {
  return categories.find((category) => category.plugins.includes(id))?.id ?? 'other';
}

/** Inventory and conversion callbacks remain native; unknown installed plugins stay discoverable. */
export function WallVisualizationGallery({
  pluginId,
  searchQuery,
  onChange,
  category = 'all',
}: {
  pluginId: string;
  searchQuery: string;
  category?: string;
  onChange: (change: VizTypeChangeDetails) => void;
}) {
  const plugins = useMemo(
    () => (config.featureToggles.vizAndWidgetSplit ? getVizPluginMeta() : getAllPanelPluginMeta()),
    []
  );
  const filtered = filterPluginList(
    plugins.map((plugin) => ({ ...plugin, name: `${wallOptionText(plugin.name)} ${plugin.name}` })),
    searchQuery,
    pluginId
  ).filter((plugin) => category === 'all' || visualizationCategory(plugin.id) === category);
  return (
    <div className="wall-viz-catalog" role="group" aria-label={t('wall.studio.visualizations', '시각화 유형')}>
      {filtered.map((plugin) => {
        const source = plugins.find((item) => item.id === plugin.id)!;
        const description = t(
          `wall.studio.viz-purpose-${plugin.id}`,
          purpose[plugin.id] || source.info.description || '설치된 패널 플러그인의 데이터 표시와 설정을 사용합니다.'
        );
        return (
          <Button
            key={plugin.id}
            className="wall-viz-catalog-item"
            aria-pressed={plugin.id === pluginId}
            onClick={(event) =>
              onChange({ pluginId: plugin.id, withModKey: event.metaKey || event.ctrlKey || event.altKey })
            }
          >
            <span className="wall-viz-catalog-icon" aria-hidden="true">
              <WallVisualizationIcon
                pluginId={plugin.id}
                logo={plugin.info.logos.small}
                selected={plugin.id === pluginId}
              />
            </span>
            <span className="wall-viz-catalog-copy">
              <strong title={wallOptionText(source.name)}>{wallOptionText(source.name)}</strong>
              <small title={description}>{description}</small>
            </span>
            {plugin.id === pluginId && (
              <span className="wall-viz-current">
                <Check size={14} />
                {t('wall.studio.current', '사용 중')}
              </span>
            )}
          </Button>
        );
      })}
      {!filtered.length && (
        <p className="wall-viz-empty" role="status">
          {t('wall.studio.no-visualizations', '검색 조건에 맞는 시각화가 없습니다.')}
        </p>
      )}
    </div>
  );
}

export function WallVisualizationPicker({
  pluginId,
  onChange,
  onClose,
}: {
  pluginId: string;
  onChange: (change: VizTypeChangeDetails) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t('wall.studio.choose-visualization', '시각화 선택')}
    >
      <div className="wall-viz-search wall-option-search">
        <Search size={16} />
        <Input
          autoFocus
          aria-label={t('wall.studio.search-visualization', '시각화 검색')}
          placeholder={t('wall.studio.search-visualization', '시각화 검색')}
          value={search}
          onValueChange={setSearch}
        />
      </div>
      <div className="wall-viz-browser">
        <nav aria-label={t('wall.studio.visualization-categories', '시각화 분류')}>
          {categories.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {t(`wall.studio.viz-category-${item.id}`, item.label)}
            </Button>
          ))}
        </nav>
        <WallVisualizationGallery pluginId={pluginId} searchQuery={search} category={category} onChange={onChange} />
      </div>
    </Dialog>
  );
}
