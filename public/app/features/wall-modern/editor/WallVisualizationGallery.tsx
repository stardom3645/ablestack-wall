import { Check } from 'lucide-react';
import { useMemo } from 'react';

import { config } from '@grafana/runtime';
import { t } from 'app/core/internationalization';
import { VizTypeChangeDetails } from 'app/features/panel/components/VizTypePicker/types';
import { filterPluginList, getAllPanelPluginMeta, getVizPluginMeta } from 'app/features/panel/state/util';

import { Button } from '../ui';

/** Same native plugin inventory/filter/modifier contract, presented as a compact Wall gallery. */
export function WallVisualizationGallery({
  pluginId,
  searchQuery,
  onChange,
}: {
  pluginId: string;
  searchQuery: string;
  onChange: (change: VizTypeChangeDetails) => void;
}) {
  const plugins = useMemo(
    () => (config.featureToggles.vizAndWidgetSplit ? getVizPluginMeta() : getAllPanelPluginMeta()),
    []
  );
  const filtered = filterPluginList(plugins, searchQuery, pluginId);
  return (
    <div className="wall-viz-gallery" role="group" aria-label={t('wall.studio.visualizations', '시각화 유형')}>
      {filtered.map((plugin) => (
        <Button
          key={plugin.id}
          className="wall-viz-gallery-item"
          aria-pressed={plugin.id === pluginId}
          onClick={(event) =>
            onChange({ pluginId: plugin.id, withModKey: event.metaKey || event.ctrlKey || event.altKey })
          }
        >
          <img src={plugin.info.logos.small} alt="" />
          <span>{plugin.name}</span>
          {plugin.id === pluginId && <Check className="wall-viz-gallery-check" size={12} aria-hidden="true" />}
        </Button>
      ))}
      {!filtered.length && <p>{t('wall.studio.no-visualizations', '검색 조건에 맞는 시각화가 없습니다.')}</p>}
    </div>
  );
}
