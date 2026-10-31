import { Database, Paintbrush, Settings2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { t, Trans } from 'app/core/internationalization';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { wallStudioVariables } from '../surfaceTokens';

import { editorInspectorContext } from './EditorPresentationContext';

interface Props {
  preview: ReactNode;
  controls?: ReactNode;
  options: ReactNode;
  data?: ReactNode;
  initialData?: boolean;
}

/** One canvas and one contextual inspector, with no permanent query/preview split. */
export function WallPanelStudio({ preview, controls, options, data, initialData = false }: Props) {
  const [surface, setSurface] = useState(initialData && data ? 'data' : 'visual');
  const [properties, setProperties] = useState<'visual' | 'panel'>('visual');
  // Text and other query-free plugins can remove their data pane after plugin loading.
  // Never leave a disabled Data tab selected with an empty inspector.
  const selectedSurface = surface === 'data' && !data ? properties : surface;
  return (
    <div className="wall-panel-studio" data-surface={selectedSurface} style={wallStudioVariables}>
      <section className="wall-studio-canvas" aria-label={t('wall.studio.canvas', '패널 미리보기 캔버스')}>
        {controls && <div className="wall-studio-controls">{controls}</div>}
        <div className="wall-studio-stage">{preview}</div>
        <footer className="wall-studio-caption">
          <span className="wall-studio-live-dot" aria-hidden="true" />
          <Trans i18nKey="wall.studio.live">현재 데이터와 설정을 반영한 미리보기</Trans>
        </footer>
      </section>
      <Tabs
        className="wall-studio-inspector"
        value={selectedSurface}
        onValueChange={(value) => {
          if (value === 'visual' || value === 'panel' || value === 'data') {
            setSurface(value);
            if (value !== 'data') {
              setProperties(value);
            }
          }
        }}
      >
        <header className="wall-studio-inspector-heading">
          <h2>
            <Trans i18nKey="wall.studio.inspector">패널 구성</Trans>
          </h2>
          <p>
            <Trans i18nKey="wall.studio.inspector-description">표현과 데이터를 한 곳에서 다듬으세요.</Trans>
          </p>
        </header>
        <TabsList aria-label={t('wall.studio.surfaces', '패널 편집 작업')} className="wall-studio-navigation">
          <TabsTrigger value="visual">
            <Paintbrush size={15} aria-hidden="true" />
            <Trans i18nKey="wall.studio.visual">표현</Trans>
          </TabsTrigger>
          <TabsTrigger value="data" disabled={!data}>
            <Database size={15} aria-hidden="true" />
            <Trans i18nKey="wall.studio.data">데이터</Trans>
          </TabsTrigger>
          <TabsTrigger value="panel">
            <Settings2 size={15} aria-hidden="true" />
            <Trans i18nKey="wall.studio.panel">패널 정보</Trans>
          </TabsTrigger>
        </TabsList>
        {/* Keep both native panes mounted: switching surfaces must not discard a query buffer. */}
        <TabsContent value={properties} keepMounted className="wall-studio-properties">
          <editorInspectorContext.Provider value={properties}>{options}</editorInspectorContext.Provider>
        </TabsContent>
        <TabsContent value="data" keepMounted className="wall-studio-data">
          {data}
        </TabsContent>
      </Tabs>
    </div>
  );
}
