import { sceneGraph, VariableValueSelectors } from '@grafana/scenes';
import { DashboardControls } from 'app/features/dashboard-scene/scene/DashboardControls';

import { WallVariableControl } from './WallVariableControl';

/** Native selectors own variable type, labels, visibility, dependencies and URL synchronization. */
export function WallScopeControl({ controls }: { controls: DashboardControls }) {
  const { variableControls } = controls.useState();

  return (
    <div className="wall-toolbar-variables" role="group" aria-label="대시보드 변수">
      {variableControls.map((control) =>
        control instanceof VariableValueSelectors ? (
          <WallVariableSelectors key={control.state.key} model={control} />
        ) : (
          <control.Component key={control.state.key} model={control} />
        )
      )}
    </div>
  );
}

function WallVariableSelectors({ model }: { model: VariableValueSelectors }) {
  const { variables } = sceneGraph.getVariables(model).useState();
  return (
    <>
      {variables.map((variable) => (
        <WallVariableControl key={variable.state.key} variable={variable} />
      ))}
    </>
  );
}
