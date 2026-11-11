import { useLayoutEffect } from 'react';

import { VariableHide } from '@grafana/data';
import { sceneGraph, VariableValueSelectors } from '@grafana/scenes';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';
import { activateInActiveParents } from 'app/features/dashboard-scene/utils/utils';

import { WallAdaptiveFilters } from './WallAdaptiveFilters';
import { WallVariableControl } from './WallVariableControl';

/** Definitions, order, type and URL synchronization remain native. */
export function WallScopeControl({ controls }: { controls: DashboardControls }) {
  const { variableControls } = controls.useState();
  const { variables } = sceneGraph.getVariables(controls).useState();
  useLayoutEffect(() => {
    const stops = variables.map((variable) => activateInActiveParents(variable));
    return () => stops.forEach((stop) => stop?.());
  }, [variables]);
  const items = variableControls.flatMap((control) =>
    control instanceof VariableValueSelectors
      ? variables
          .filter((variable) => variable.state.hide !== VariableHide.hideVariable)
          .map((variable) => ({ key: variable.state.key!, node: <WallVariableControl variable={variable} /> }))
      : []
  );
  return (
    <div className="wall-toolbar-variables" role="group" aria-label="대시보드 변수">
      <WallAdaptiveFilters items={items} />
      <div className="wall-toolbar-layer-controls">
        {variableControls
          .filter((control) => !(control instanceof VariableValueSelectors))
          .map((control, index) => (
            <control.Component key={control.state.key ?? index} model={control} />
          ))}
      </div>
    </div>
  );
}
