import { Activity, Cpu, Database, HardDrive, Network, Server } from 'lucide-react';
import { ReactNode, useId, useRef } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { displayKinds } from '../visualizations/model';

import { FreeOverviewLayout } from './FreeOverviewLayout';
import { KpiLayoutPilot } from './KpiLayoutPilot';
import { OverviewFlowLayout } from './OverviewFlowLayout';
import { PanelActionsProvider } from './PanelActionDock';
import { WallTextPanel } from './WallTextPanel';
import { WorkspacePanelLayout } from './WorkspacePanelLayout';
import { compactResourceTokens, compactResourceVariables } from './compactResourceTokens';
import { KpiPosition } from './kpiLayout';
import { overviewSections, panelsForTab, WorkspaceGroup, WorkspacePanel, WorkspaceTab, workspaceTabs } from './model';
import { overviewPanelRole, OverviewPanelPresentation } from './overviewPresentation';

import './overview.css';

const tabIcons = { overview: Activity, network: Network, storage: HardDrive, devices: Database, processes: Cpu };

export function WorkspaceSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="wall-workspace-section" aria-labelledby={id}>
      <div className="wall-workspace-section-heading">
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

interface Props<T> {
  groups: Array<WorkspaceGroup<T>>;
  panelHeights?: Record<number, number>;
  kpiLayoutStorageKey?: string;
  kpiLayoutRequested?: boolean;
  onKpiLayoutModeChange?: (editing: boolean) => void;
  activeTab: WorkspaceTab;
  onTabChange: (value: WorkspaceTab) => void;
  renderPanel: (panel: WorkspacePanel<T>) => ReactNode;
  renderPanelActions?: (panel: WorkspacePanel<T>) => ReactNode;
}

export function DashboardWorkspace<T>({
  groups,
  activeTab,
  onTabChange,
  renderPanel,
  renderPanelActions,
  panelHeights = {},
  kpiLayoutStorageKey,
  kpiLayoutRequested,
  onKpiLayoutModeChange,
}: Props<T>) {
  const draftCache = useRef(new Map<string, KpiPosition[]>());
  const overview = panelsForTab(groups, 'overview');
  const select = (ids: number[]) => ids.flatMap((id) => overview.filter((panel) => panel.id === id));
  const assigned = new Set(Object.values(overviewSections).flat());
  const remaining = overview.filter((panel) => !assigned.has(panel.id));
  const panelCard = (panel: WorkspacePanel<T>, className: string, height?: number, fill = false) => {
    const kind = displayKinds[panel.presentationId ?? panel.id];
    const Shell = className === 'wall-free-panel' || (kind !== 'usage' && kind !== 'service') ? Card : 'div';
    const card = (
      <Shell
        key={panel.id}
        className="wall-workspace-panel"
        data-wall-panel-id={panel.id}
        data-wall-panel-type={panel.type}
        data-wall-display-kind={kind}
        data-wall-overview-role={
          activeTab === 'overview' ? overviewPanelRole(panel.presentationId ?? panel.id) : undefined
        }
        style={{
          overflow: fill ? undefined : 'visible',
          height: fill
            ? '100%'
            : (panelHeights[panel.id] ??
              (kind === 'kpi'
                ? compactResourceTokens.kpi.height
                : kind === 'counts'
                  ? 112
                  : kind === 'usage'
                    ? compactResourceTokens.usage.height
                    : kind === 'service'
                      ? 54
                      : (height ?? Math.max(180, Math.min(panel.height * 32, 320))))),
          gridColumn:
            className === 'wall-workspace-detail-grid'
              ? `span ${Math.max(3, Math.min(12, Math.round(panel.width / 2)))}`
              : undefined,
        }}
      >
        <CardContent className="wall-workspace-panel-content" style={{ overflow: 'hidden', borderRadius: 'inherit' }}>
          <OverviewPanelPresentation
            id={panel.presentationId ?? panel.id}
            preserveTimeSeries={activeTab !== 'overview'}
          >
            {renderPanel(panel)}
          </OverviewPanelPresentation>
        </CardContent>
      </Shell>
    );
    return fill ? (
      card
    ) : (
      <PanelActionsProvider key={panel.id} actions={renderPanelActions?.(panel)}>
        {card}
      </PanelActionsProvider>
    );
  };
  const grid = (panels: Array<WorkspacePanel<T>>, className: string, height?: number, region = className) => (
    <WorkspacePanelLayout
      key={region}
      panels={panels}
      className={className}
      label={region}
      storageKey={kpiLayoutStorageKey ? `${kpiLayoutStorageKey}:region:${activeTab}:${className}` : undefined}
      heights={panelHeights}
      draftCache={draftCache.current}
      renderPanel={(panel, fill) => panelCard(panel, className, height, fill)}
      renderActions={renderPanelActions}
    />
  );

  const usageCard = (
    <Card className="wall-workspace-usage-card" data-wall-flow-group="usage">
      <CardHeader>
        <CardTitle>자원 사용률</CardTitle>
        <CardDescription>현재 자원 사용 상태</CardDescription>
      </CardHeader>
      <CardContent>{grid(select(overviewSections.usage), 'wall-workspace-usage-grid', 155, '자원 사용률')}</CardContent>
    </Card>
  );

  return (
    <div className="wall-dashboard-workspace" data-testid="wall-dashboard-workspace" style={compactResourceVariables}>
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as WorkspaceTab)}>
        <div className="wall-workspace-navigation">
          <TabsList aria-label="스토리지센터 상세 영역" variant="line">
            {workspaceTabs.map((tab) => {
              const Icon = tabIcons[tab.id];
              const count = panelsForTab(groups, tab.id).length;
              return (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span className="wall-workspace-tab-count">{count}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <span className="wall-workspace-context">
            <Server size={14} />
            스토리지센터
          </span>
        </div>
        <TabsContent value="overview">
          <FreeOverviewLayout
            panels={overview}
            storageKey={kpiLayoutStorageKey}
            draftCache={draftCache.current}
            requested={kpiLayoutRequested}
            onModeChange={onKpiLayoutModeChange}
            renderPanel={(panel, fill) => panelCard(panel, 'wall-free-panel', undefined, fill)}
            renderActions={renderPanelActions}
            original={
              <>
                <div className="wall-workspace-section">
                  <WallTextPanel name="resources" storageKey={kpiLayoutStorageKey} draftCache={draftCache.current} />
                  <KpiLayoutPilot
                    panels={select(overviewSections.resources)}
                    renderActions={renderPanelActions}
                    storageKey={kpiLayoutStorageKey}
                    draftCache={draftCache.current}
                    requested={kpiLayoutRequested}
                    onModeChange={onKpiLayoutModeChange}
                    original={
                      <div className="wall-workspace-resource-grid">
                        {select(overviewSections.resources).map((panel) =>
                          panelCard(panel, 'wall-workspace-resource-grid', 146)
                        )}
                      </div>
                    }
                    renderPanel={(panel) => panelCard(panel, 'wall-workspace-resource-grid', undefined, true)}
                  />
                </div>
                <OverviewFlowLayout
                  storageKey={kpiLayoutStorageKey}
                  draftCache={draftCache.current}
                  trends={select(overviewSections.trends)}
                  storage={select(overviewSections.storage)}
                  usage={usageCard}
                  renderPanel={(panel, fill) => panelCard(panel, 'wall-workspace-trend-grid', 280, fill)}
                  renderActions={renderPanelActions}
                  original={
                    <div className="wall-workspace-overview-grid">
                      <div className="wall-workspace-section">
                        <WallTextPanel name="trends" storageKey={kpiLayoutStorageKey} draftCache={draftCache.current} />
                        {grid(select(overviewSections.trends), 'wall-workspace-trend-grid', 280, '성능 추이')}
                      </div>
                      <div className="wall-workspace-summary">
                        {usageCard}
                        <div className="wall-workspace-section">
                          <WallTextPanel
                            name="storage"
                            storageKey={kpiLayoutStorageKey}
                            draftCache={draftCache.current}
                          />
                          {grid(select(overviewSections.storage), 'wall-workspace-storage-grid', 160, '스토리지 요약')}
                        </div>
                      </div>
                    </div>
                  }
                />
                <div className="wall-workspace-section">
                  <WallTextPanel name="services" storageKey={kpiLayoutStorageKey} draftCache={draftCache.current} />
                  {grid(select(overviewSections.services), 'wall-workspace-service-grid', 104, '서비스 상태')}
                </div>
                {remaining.length > 0 && (
                  <WorkspaceSection title="추가 지표">
                    {grid(remaining, 'wall-workspace-detail-grid', undefined, '추가 지표')}
                  </WorkspaceSection>
                )}
              </>
            }
          />
        </TabsContent>
        {workspaceTabs
          .filter((tab) => tab.id !== 'overview')
          .map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <WorkspaceSection title={tab.label} description={tab.description}>
                {grid(panelsForTab(groups, tab.id), 'wall-workspace-detail-grid', undefined, tab.label)}
              </WorkspaceSection>
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
