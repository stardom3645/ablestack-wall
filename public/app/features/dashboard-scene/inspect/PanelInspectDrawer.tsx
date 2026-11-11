import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { locationService } from '@grafana/runtime';
import {
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  sceneGraph,
  VizPanel,
  SceneObjectRef,
} from '@grafana/scenes';
import { Alert, Drawer } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { getDataSourceWithInspector } from 'app/features/dashboard/components/Inspector/hooks';
import { supportsDataQuery } from 'app/features/dashboard/components/PanelEditor/utils';
import { InspectStatsTab } from 'app/features/inspector/InspectStatsTab';
import { InspectTab } from 'app/features/inspector/types';
import { Tabs, TabsList, TabsTrigger } from 'app/features/wall-modern/components/ui/tabs';
import { WallPanelDiagnostics } from 'app/features/wall-modern/editor/WallPanelDiagnostics';
import { WallModalProvider } from 'app/features/wall-modern/modals/WallModalProvider';
import { wallEditorFormVariables } from 'app/features/wall-modern/surfaceTokens';
import 'app/features/wall-modern/editor/panelInspection.css';

import { getDashboardUrl } from '../utils/urlBuilders';
import { getDashboardSceneFor, getQueryRunnerFor } from '../utils/utils';

import { HelpWizard } from './HelpWizard/HelpWizard';
import { InspectDataTab } from './InspectDataTab';
import { InspectJsonTab } from './InspectJsonTab';
import { InspectMetaDataTab } from './InspectMetaDataTab';
import { InspectQueryTab } from './InspectQueryTab';
import { SceneInspectTab } from './types';

interface PanelInspectDrawerState extends SceneObjectState {
  tabs?: SceneInspectTab[];
  panelRef: SceneObjectRef<VizPanel>;
  pluginNotLoaded?: boolean;
  canEdit?: boolean;
}

export class PanelInspectDrawer extends SceneObjectBase<PanelInspectDrawerState> {
  static Component = PanelInspectRenderer;

  constructor(state: PanelInspectDrawerState) {
    super(state);
    this.addActivationHandler(() => this._activationHandler());
  }

  private _activationHandler() {
    this.buildTabs(0);
  }

  /**
   * We currently have no async await to get the panel plugin from the VizPanel.
   * That is why there is a retry argument here and a setTimeout, to try again a bit later.
   */
  async buildTabs(retry: number) {
    const panelRef = this.state.panelRef;
    const plugin = panelRef.resolve()?.getPlugin();
    const tabs: SceneInspectTab[] = [];

    if (!plugin) {
      if (retry < 2000) {
        setTimeout(() => this.buildTabs(retry + 100), 100);
      } else {
        this.setState({ pluginNotLoaded: true });
      }
    }

    if (panelRef) {
      if (supportsDataQuery(plugin)) {
        const data = sceneGraph.getData(panelRef.resolve());

        tabs.push(new InspectDiagnosticTab({ panelRef }));
        tabs.push(new InspectDataTab({ panelRef }));
        tabs.push(new InspectQueryTab({ panelRef }));

        const dsWithInspector = await getDataSourceWithInspector(data.state.data);
        if (dsWithInspector) {
          tabs.push(new InspectMetaDataTab({ panelRef, dataSource: dsWithInspector }));
        }
      }

      tabs.push(new InspectJsonTab({ panelRef, onClose: this.onClose }));
    }

    this.setState({ tabs });
  }

  getDrawerTitle() {
    const panel = this.state.panelRef?.resolve();
    if (panel) {
      return sceneGraph.interpolate(panel, panel.state.title);
    }
    return '패널 분석';
  }

  onClose = () => {
    const dashboard = getDashboardSceneFor(this);
    // The native URL sync serializes inspectPanelKey on concurrent panel/state updates.
    // Clear its owner state as well as the URL, otherwise it can resurrect this drawer.
    if (dashboard.state.overlay === this) {
      dashboard.setState({ overlay: undefined, inspectPanelKey: undefined });
    }
    locationService.push(
      getDashboardUrl({
        uid: dashboard.state.uid,
        slug: dashboard.state.meta.slug,
        currentQueryParams: locationService.getLocation().search,
        updateQuery: {
          inspect: null,
          inspectTab: null,
        },
      })
    );
  };
}

function PanelInspectRenderer({ model }: SceneComponentProps<PanelInspectDrawer>) {
  const { tabs, pluginNotLoaded, panelRef } = model.useState();
  const location = useLocation();
  const vizPanel = panelRef.resolve();
  const panelState = vizPanel.useState();
  const dashboard = getDashboardSceneFor(vizPanel);
  const dashboardState = dashboard.useState();
  const panelTitle = sceneGraph.interpolate(vizPanel, panelState.title);
  const dashboardTitle = sceneGraph.interpolate(dashboard, dashboardState.title);
  const visualization = vizPanel.getPlugin()?.meta.name;
  const [visited, setVisited] = useState<SceneInspectTab[]>([]);
  const queryParams = new URLSearchParams(location.search);

  useEffect(() => {
    setVisited([]);
  }, [panelRef]);

  if (!tabs) {
    return null;
  }

  const urlTab = queryParams.get('inspectTab');
  const currentTab =
    tabs.find(
      (tab) =>
        tab.getTabValue() ===
        (urlTab === InspectTab.Stats || urlTab === InspectTab.Error ? InspectTab.Diagnostic : urlTab)
    ) ?? tabs[0];

  if (urlTab === InspectTab.Help) {
    return <HelpWizard panel={vizPanel} onClose={model.onClose} />;
  }

  return (
    <WallModalProvider>
      <Drawer
        title={panelTitle}
        subtitle={
          <>
            <span className="wall-inspect-eyebrow">
              <Trans i18nKey="wall.panel-inspect-drawer.text-e3332009">패널 분석</Trans>
            </span>
            <span className="wall-inspect-context">
              {visualization && <span className="wall-inspect-kind">{visualization}</span>}
              {visualization && dashboardTitle && (
                <span aria-hidden="true">
                  <Trans i18nKey="wall.panel-inspect-drawer.text-1fdf0d90">·</Trans>
                </span>
              )}
              {dashboardTitle && (
                <span className="wall-inspect-dashboard" title={dashboardTitle}>
                  <Trans i18nKey="wall.panel-inspect-drawer.text-df145f9a">대시보드: </Trans>
                  {dashboardTitle}
                </span>
              )}
            </span>
          </>
        }
        onClose={model.onClose}
        size="sm"
        width="40vw"
        tabs={
          <Tabs
            className="wall-panel-inspect-tabs"
            value={currentTab?.getTabValue()}
            onValueChange={(value) => {
              setVisited((previous) => [...new Set([...previous, currentTab])]);
              locationService.partial({ inspectTab: value });
            }}
          >
            <TabsList variant="line" aria-label="패널 검사">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.state.key!} value={tab.getTabValue()}>
                  {tab.getTabLabel()}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      >
        <div className="wall-panel-inspector" style={wallEditorFormVariables}>
          {pluginNotLoaded && (
            <Alert title="Panel plugin not loaded">
              <Trans i18nKey="wall.panel-inspect-drawer.text-677087cd">
                Make sure the panel you want to inspect is visible and has been displayed before opening inspect.
              </Trans>
            </Alert>
          )}
          {[...new Set([...visited, currentTab])].filter(Boolean).map((tab) => (
            <div
              className="wall-inspect-tab-body"
              data-inspect-tab={tab.getTabValue()}
              key={tab.state.key}
              hidden={tab !== currentTab}
              role="tabpanel"
              aria-label={tab.getTabLabel()}
            >
              {tab.Component && <tab.Component model={tab} />}
            </div>
          ))}
        </div>
      </Drawer>
    </WallModalProvider>
  );
}

class InspectDiagnosticTab extends SceneObjectBase<{ panelRef: SceneObjectRef<VizPanel> } & SceneObjectState> {
  getTabValue() {
    return InspectTab.Diagnostic;
  }
  getTabLabel() {
    return '진단';
  }
  static Component = ({ model }: SceneComponentProps<InspectDiagnosticTab>) => {
    const panel = model.state.panelRef.resolve();
    const { data } = sceneGraph.getData(panel).useState();
    const timeRange = sceneGraph.getTimeRange(panel);
    const location = useLocation();
    return (
      <WallPanelDiagnostics
        data={data}
        datasource={getQueryRunnerFor(panel)?.state.datasource}
        queries={getQueryRunnerFor(panel)?.state.queries}
        statsOpen={new URLSearchParams(location.search).get('inspectTab') === InspectTab.Stats}
        stats={data?.request ? <InspectStatsTab data={data} timeZone={timeRange.getTimeZone()} /> : undefined}
      />
    );
  };
}
