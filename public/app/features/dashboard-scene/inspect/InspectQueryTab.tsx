import {
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneObjectRef,
  VizPanel,
} from '@grafana/scenes';
import { QueryInspector } from 'app/features/inspector/QueryInspector';
import { InspectTab } from 'app/features/inspector/types';
import { isInspectorRequest } from 'app/features/wall-modern/editor/inspectorModel';

import { getQueryRunnerFor } from '../utils/utils';

export interface InspectQueryTabState extends SceneObjectState {
  panelRef: SceneObjectRef<VizPanel>;
}

export class InspectQueryTab extends SceneObjectBase<InspectQueryTabState> {
  public getTabLabel() {
    return '요청·응답';
  }

  public getTabValue() {
    return InspectTab.Query;
  }

  public onRefreshQuery = () => {
    const queryRunner = getQueryRunnerFor(this.state.panelRef.resolve());

    if (queryRunner) {
      queryRunner.runQueries();
    }
  };

  static Component = ({ model }: SceneComponentProps<InspectQueryTab>) => {
    const data = sceneGraph.getData(model.state.panelRef.resolve()).useState();

    if (!data.data) {
      return null;
    }

    const runner = getQueryRunnerFor(model.state.panelRef.resolve());
    return (
      <QueryInspector
        wall
        data={data.data}
        onRefreshQuery={model.onRefreshQuery}
        acceptResponse={(requestId) => isInspectorRequest(requestId, runner?.state.data?.request?.requestId)}
      />
    );
  };
}
