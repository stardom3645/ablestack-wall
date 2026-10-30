import { useContext } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { InlineSwitch } from '@grafana/ui';
import { WallPanelEditorContext } from 'app/features/wall-modern/editor/WallPanelEditor';

import { PanelEditor } from './PanelEditor';

export interface Props {
  panelEditor: PanelEditor;
}

export function PanelEditControls({ panelEditor }: Props) {
  const { tableView, dataPane } = panelEditor.useState();
  const wallEditor = useContext(WallPanelEditorContext);
  if (wallEditor) {
    return null;
  }

  return (
    <>
      {dataPane && (
        <InlineSwitch
          label="Table view"
          showLabel={true}
          id="table-view"
          value={tableView ? true : false}
          onClick={panelEditor.onToggleTableView}
          aria-label="toggle-table-view"
          data-testid={selectors.components.PanelEditor.toggleTableView}
        />
      )}
    </>
  );
}
