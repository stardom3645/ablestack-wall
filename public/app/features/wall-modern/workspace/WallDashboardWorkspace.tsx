import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { locationService } from '@grafana/runtime';
import { SceneGridRow, VizPanel } from '@grafana/scenes';
import { GRID_CELL_HEIGHT, GRID_CELL_VMARGIN } from 'app/core/constants';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardGridItem } from 'app/features/dashboard-scene/scene/DashboardGridItem';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';
import { getDashboardSceneFor, getPanelIdForVizPanel } from 'app/features/dashboard-scene/utils/utils';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { WallDashboardPanel } from '../panels/WallDashboardPanel';

import { PanelLayoutGrid } from './PanelLayoutGrid';
import { activateWorkspaceParents, getWorkspaceGroups } from './StorageDashboardWorkspace';
import { WallPanelActions } from './WallPanelActions';
import { KpiPosition } from './kpiLayout';
import { validatePanelLayout } from './panelLayout';

function NativePanel({ panel }: { panel: VizPanel }) {
  useLayoutEffect(() => activateWorkspaceParents(panel), [panel]);
  const item = panel.parent;
  if (item instanceof DashboardGridItem && item.state.variableName) {
    return <item.Component model={item} />;
  }
  return (
    <WallDashboardPanel panel={panel}>
      <panel.Component model={panel} />
    </WallDashboardPanel>
  );
}
/** Row membership comes from the dashboard, never the 05 panel-ID vocabulary. */
export function WallDashboardWorkspace({ layout }: { layout: DefaultGridLayoutManager }) {
  const dashboard = getDashboardSceneFor(layout);
  dashboard.useState();
  layout.useState();
  layout.state.grid.useState();
  const location = useLocation();
  const cache = useRef(new Map<string, KpiPosition[]>());
  const groups = getWorkspaceGroups(layout);
  const rowIds = [...new Set(groups.map((g) => g.rowId))];
  const requested = Number(new URLSearchParams(location.search).get('wallRow') ?? 0);
  const active = rowIds.includes(requested) ? requested : rowIds[0];
  const panels = groups.filter((g) => g.rowId === active).flatMap((g) => g.panels);
  const idsKey = panels.map((p) => String(p.id)).join(',');
  const validate = useCallback((value: unknown) => validatePanelLayout(value, idsKey.split(',')), [idsKey]);
  const native = panels.map((p) => {
    const parent = p.model.parent;
    if (!(parent instanceof DashboardGridItem)) {
      throw new Error('Wall workspace panel must belong to a dashboard grid item');
    }
    return parent;
  });
  const top = native.length ? Math.min(...native.map((p) => p.state.y ?? 0)) : 0;
  const initial = panels.map((p, i) => ({
    i: String(p.id),
    x: (native[i].state.x ?? 0) * 2,
    y: Math.max(0, ((native[i].state.y ?? 0) - top) * ((GRID_CELL_HEIGHT + GRID_CELL_VMARGIN) / 2)),
    w: p.width * 2,
    h: Math.max(12, p.height * ((GRID_CELL_HEIGHT + GRID_CELL_VMARGIN) / 2)),
  }));
  const title = (id: number) => {
    const row = layout.state.grid.state.children.find(
      (c) => c instanceof SceneGridRow && getPanelIdForVizPanel(c) === id
    );
    return row instanceof SceneGridRow ? row.state.title : '개요';
  };
  return (
    <div className="wall-dashboard-workspace" data-testid="wall-generic-workspace">
      <Tabs value={String(active)} onValueChange={(v) => locationService.partial({ wallRow: v }, true)}>
        {rowIds.length > 1 && (
          <TabsList>
            {rowIds.map((id) => (
              <TabsTrigger key={id} value={String(id)}>
                {title(id)}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        <TabsContent value={String(active)}>
          <PanelLayoutGrid
            key={active}
            panels={panels}
            initialLayout={initial}
            validate={validate}
            label={title(active)}
            storageKey={`wall-modern:kpi-layout:v1:${dashboard.state.uid}:${contextSrv.user.orgId}:${contextSrv.user.id}:row:${active}:tab:overview`}
            draftCache={cache.current}
            rowPitch={2}
            gapX={GRID_CELL_VMARGIN}
            gapY={GRID_CELL_VMARGIN}
            maxWidth={Infinity}
            minimumWidth={200}
            original={null}
            bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
            renderPanel={(p) => <NativePanel panel={p.model} />}
            renderActions={(p) => (
              <WallPanelActions
                panel={p.model}
                synchronize={(href) =>
                  dashboard.urlSync?.updateFromUrl({
                    viewPanel: new URLSearchParams(href.split('?')[1]).get('viewPanel'),
                    editPanel: new URLSearchParams(href.split('?')[1]).get('editPanel'),
                  })
                }
              />
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
