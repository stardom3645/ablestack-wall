import { AnnotationChangeEvent, AnnotationEventUIModel, CoreApp, DataFrame } from '@grafana/data';
import { config, getDataSourceSrv, locationService } from '@grafana/runtime';
import { AdHocFiltersVariable, dataLayers, sceneGraph, sceneUtils, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { AdHocFilterItem, PanelContext } from '@grafana/ui';
import { deleteAnnotation, saveAnnotation, updateAnnotation } from 'app/features/annotations/api';
import { clearSeriesSelection } from 'app/features/wall-modern/charts/seriesLegendModel';

import { dashboardSceneGraph } from '../utils/dashboardSceneGraph';
import { getDashboardSceneFor, getPanelIdForVizPanel, getQueryRunnerFor } from '../utils/utils';

import { DashboardScene } from './DashboardScene';

export function setDashboardPanelContext(vizPanel: VizPanel, context: PanelContext) {
  context.app = CoreApp.Dashboard;
  // Color is a persistent Field Override; start native dirty/baseline tracking
  // before invoking the existing renderer callback (also used by the swatch).
  const changeColor = context.onSeriesColorChange;
  if (changeColor) {
    context.onSeriesColorChange = (label, color) => {
      const dashboard = getDashboardSceneFor(vizPanel);
      if (!dashboard.canEditDashboard() || dashboard.state.kioskMode) {
        return;
      }
      dashboard.onEnterEditMode();
      changeColor(label, color);
    };
  }

  context.onSeriesVisibilityReset = () => {
    vizPanel.onFieldConfigChange(clearSeriesSelection(vizPanel.state.fieldConfig), true);
  };
  context.canEditSeriesColor = () => {
    const dashboard = getDashboardSceneFor(vizPanel);
    return dashboard.canEditDashboard() && !dashboard.state.kioskMode;
  };
  context.onInspectSeriesData = () => {
    if (!getDashboardSceneFor(vizPanel).state.kioskMode) {
      locationService.partial({ inspect: vizPanel.state.key, inspectTab: 'data' });
    }
  };

  context.canAddAnnotations = () => {
    const dashboard = getDashboardSceneFor(vizPanel);
    const builtInLayer = getBuiltInAnnotationsLayer(dashboard);

    // When there is no builtin annotations query we disable the ability to add annotations
    if (!builtInLayer || !dashboard.canEditDashboard()) {
      return false;
    }

    // If RBAC is enabled there are additional conditions to check.
    return Boolean(dashboard.state.meta.annotationsPermissions?.dashboard.canAdd);
  };

  context.canEditAnnotations = (dashboardUID?: string) => {
    const dashboard = getDashboardSceneFor(vizPanel);

    if (!dashboard.canEditDashboard()) {
      return false;
    }

    if (dashboardUID) {
      return Boolean(dashboard.state.meta.annotationsPermissions?.dashboard.canEdit);
    }

    return Boolean(dashboard.state.meta.annotationsPermissions?.organization.canEdit);
  };

  context.canDeleteAnnotations = (dashboardUID?: string) => {
    const dashboard = getDashboardSceneFor(vizPanel);

    if (!dashboard.canEditDashboard()) {
      return false;
    }

    if (dashboardUID) {
      return Boolean(dashboard.state.meta.annotationsPermissions?.dashboard.canDelete);
    }

    return Boolean(dashboard.state.meta.annotationsPermissions?.organization.canDelete);
  };

  context.onAnnotationCreate = async (event: AnnotationEventUIModel) => {
    const dashboard = getDashboardSceneFor(vizPanel);

    const isRegion = event.from !== event.to;
    const anno = {
      dashboardUID: dashboard.state.uid,
      panelId: getPanelIdForVizPanel(vizPanel),
      isRegion,
      time: event.from,
      timeEnd: isRegion ? event.to : 0,
      tags: event.tags,
      text: event.description,
    };

    await saveAnnotation(anno);

    reRunBuiltInAnnotationsLayer(dashboard);

    context.eventBus.publish(new AnnotationChangeEvent(anno));
  };

  context.onAnnotationUpdate = async (event: AnnotationEventUIModel) => {
    const dashboard = getDashboardSceneFor(vizPanel);

    const isRegion = event.from !== event.to;
    const anno = {
      id: event.id,
      dashboardUID: dashboard.state.uid,
      panelId: getPanelIdForVizPanel(vizPanel),
      isRegion,
      time: event.from,
      timeEnd: isRegion ? event.to : 0,
      tags: event.tags,
      text: event.description,
    };

    await updateAnnotation(anno);

    reRunBuiltInAnnotationsLayer(dashboard);

    context.eventBus.publish(new AnnotationChangeEvent(anno));
  };

  context.onAnnotationDelete = async (id: string) => {
    await deleteAnnotation({ id });

    reRunBuiltInAnnotationsLayer(getDashboardSceneFor(vizPanel));

    context.eventBus.publish(new AnnotationChangeEvent({ id }));
  };

  context.onAddAdHocFilter = (newFilter: AdHocFilterItem) => {
    const dashboard = getDashboardSceneFor(vizPanel);

    const queryRunner = getQueryRunnerFor(vizPanel);
    if (!queryRunner) {
      return;
    }

    const filterVar = getAdHocFilterVariableFor(dashboard, queryRunner.state.datasource);
    updateAdHocFilterVariable(filterVar, newFilter);
  };

  context.onUpdateData = (frames: DataFrame[]): Promise<boolean> => {
    // TODO
    //return onUpdatePanelSnapshotData(this.props.panel, frames);
    return Promise.resolve(true);
  };
}

function getBuiltInAnnotationsLayer(scene: DashboardScene): dataLayers.AnnotationsDataLayer | undefined {
  const set = dashboardSceneGraph.getDataLayers(scene);
  // When there is no builtin annotations query we disable the ability to add annotations

  for (const layer of set.state.annotationLayers) {
    if (layer instanceof dataLayers.AnnotationsDataLayer) {
      if (layer.state.isEnabled && layer.state.query.builtIn) {
        return layer;
      }
    }
  }

  return undefined;
}

function reRunBuiltInAnnotationsLayer(scene: DashboardScene) {
  const layer = getBuiltInAnnotationsLayer(scene);
  if (layer) {
    layer.runLayer();
  }
}

export function getAdHocFilterVariableFor(scene: DashboardScene, ds: DataSourceRef | null | undefined) {
  const variables = sceneGraph.getVariables(scene);

  for (const variable of variables.state.variables) {
    if (sceneUtils.isAdHocVariable(variable)) {
      const filtersDs = variable.state.datasource;
      if (filtersDs === ds || filtersDs?.uid === ds?.uid) {
        return variable;
      }
    }
  }

  const newVariable = new AdHocFiltersVariable({
    name: 'Filters',
    datasource: ds,
    supportsMultiValueOperators: Boolean(getDataSourceSrv().getInstanceSettings(ds)?.meta.multiValueFilterOperators),
    useQueriesAsFilterForOptions: true,
    layout: config.featureToggles.newFiltersUI ? 'combobox' : undefined,
  });

  // Add it to the scene
  variables.setState({
    variables: [...variables.state.variables, newVariable],
  });

  return newVariable;
}

function updateAdHocFilterVariable(filterVar: AdHocFiltersVariable, newFilter: AdHocFilterItem) {
  // Check if we need to update an existing filter
  for (const filter of filterVar.state.filters) {
    if (filter.key === newFilter.key) {
      filterVar.setState({
        filters: filterVar.state.filters.map((f) => {
          if (f.key === newFilter.key) {
            return newFilter;
          }
          return f;
        }),
      });
      return;
    }
  }

  // Add new filter
  filterVar.setState({
    filters: [...filterVar.state.filters, newFilter],
  });
}
