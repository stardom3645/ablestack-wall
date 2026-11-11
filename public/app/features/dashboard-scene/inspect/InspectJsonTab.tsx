import { isEqual } from 'lodash';
import { ChevronDown, Download } from 'lucide-react';
import { useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import {
  SceneComponentProps,
  SceneDataTransformer,
  sceneGraph,
  SceneGridItemStateLike,
  SceneObjectBase,
  SceneObjectRef,
  SceneObjectState,
  SceneQueryRunner,
  sceneUtils,
  VizPanel,
} from '@grafana/scenes';
import { LibraryPanel } from '@grafana/schema/';
import { ClipboardButton, Select } from '@grafana/ui';
import { Trans, t } from 'app/core/internationalization';
import { getPanelDataFrames } from 'app/features/dashboard/components/HelpWizard/utils';
import { PanelModel } from 'app/features/dashboard/state';
import { InspectTab } from 'app/features/inspector/types';
import { downloadAsJson } from 'app/features/inspector/utils/download';
import { getPrettyJSON } from 'app/features/inspector/utils/utils';
import { reportPanelInspectInteraction } from 'app/features/search/page/reporting';
import { Popover, PopoverTrigger, PopoverContent } from 'app/features/wall-modern/components/ui/popover';
import { WallJsonWorkspace } from 'app/features/wall-modern/editor/WallJsonWorkspace';
import { inspectJsonSyntax } from 'app/features/wall-modern/editor/jsonWorkspace';
import { safeQueryError } from 'app/features/wall-modern/panels/safeQueryError';
import { Button } from 'app/features/wall-modern/ui';

import { DashboardGridItem } from '../scene/DashboardGridItem';
import { buildGridItemForPanel } from '../serialization/transformSaveModelToScene';
import { gridItemToPanel, vizPanelToPanel } from '../serialization/transformSceneToSaveModel';
import {
  getDashboardSceneFor,
  getLibraryPanelBehavior,
  getPanelIdForVizPanel,
  getQueryRunnerFor,
  isLibraryPanel,
} from '../utils/utils';

export type ShowContent = 'panel-json' | 'panel-data' | 'data-frames';

export interface InspectJsonTabState extends SceneObjectState {
  panelRef: SceneObjectRef<VizPanel>;
  source: ShowContent;
  jsonText: string;
  jsonError?: string;
  originalText: string;
  sessions: Partial<Record<ShowContent, { text: string; original: string }>>;
  onClose: () => void;
}

export class InspectJsonTab extends SceneObjectBase<InspectJsonTabState> {
  public constructor(state: Omit<InspectJsonTabState, 'source' | 'jsonText' | 'originalText' | 'sessions'>) {
    const original = getJsonText('panel-json', state.panelRef.resolve());
    super({
      ...state,
      source: 'panel-json',
      jsonText: original,
      originalText: original,
      sessions: {},
    });
  }

  public getTabLabel() {
    return t('dashboard.inspect.json-tab', 'JSON');
  }

  public getTabValue() {
    return InspectTab.JSON;
  }

  public getOptions(): Array<SelectableValue<ShowContent>> {
    const panel = this.state.panelRef.resolve();
    const dataProvider = panel.state.$data ?? panel.parent?.state.$data;

    const options: Array<SelectableValue<ShowContent>> = [
      {
        label: t('dashboard.inspect-json.panel-json-label', 'Panel JSON'),
        description: t(
          'dashboard.inspect-json.panel-json-description',
          'The model saved in the dashboard JSON that configures how everything works.'
        ),
        value: 'panel-json',
      },
    ];

    if (dataProvider) {
      options.push({
        label: t('dashboard.inspect-json.panel-data-label', 'Panel data'),
        description: t(
          'dashboard.inspect-json.panel-data-description',
          'The raw model passed to the panel visualization'
        ),
        value: 'panel-data',
      });
      options.push({
        label: t('dashboard.inspect-json.dataframe-label', 'DataFrame JSON (from Query)'),
        description: t(
          'dashboard.inspect-json.dataframe-description',
          'Raw data without transformations and field config applied. '
        ),
        value: 'data-frames',
      });
    }

    return options;
  }

  public onChangeSource = (value: SelectableValue<ShowContent>) => {
    if (!value.value || value.value === this.state.source) {
      return;
    }
    const sessions = {
      ...this.state.sessions,
      [this.state.source]: { text: this.state.jsonText, original: this.state.originalText },
    };
    const snapshot =
      sessions[value.value] ??
      (() => {
        const text = getJsonText(value.value!, this.state.panelRef.resolve());
        return { text, original: text };
      })();
    this.setState({
      jsonError: undefined,
      source: value.value,
      jsonText: snapshot.text,
      originalText: snapshot.original,
      sessions,
    });
  };

  public onApplyChange = () => {
    const panel = this.state.panelRef.resolve();
    const dashboard = getDashboardSceneFor(panel);
    if (!this.isEditable()) {
      return;
    }
    let jsonObj;
    try {
      jsonObj = JSON.parse(this.state.jsonText);
      if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
        throw new Error('패널 JSON은 객체여야 합니다.');
      }
    } catch {
      this.setState({ jsonError: 'JSON 형식이 올바르지 않습니다. 내용을 확인한 후 다시 적용하세요.' });
      return;
    }

    const prepared = (() => {
      try {
        const panelModel = new PanelModel(jsonObj);
        const gridItem = buildGridItemForPanel(panelModel);
        return { panelModel, newState: sceneUtils.cloneSceneObjectState(gridItem.state) };
      } catch (error) {
        this.setState({
          jsonError: `패널 설정을 적용할 수 없습니다. ${safeQueryError(error instanceof Error ? error.message : '')}`,
        });
        return undefined;
      }
    })();
    if (!prepared) {
      return;
    }
    const { panelModel, newState } = prepared;

    if (!(panel.parent instanceof DashboardGridItem)) {
      console.error('Cannot update state of panel', panel, panel.parent);
      return;
    }

    if (!dashboard.state.isEditing) {
      dashboard.onEnterEditMode();
    }

    panel.parent.setState(newState);
    // Close after native edit-mode URL synchronization, so it cannot restore inspect=...
    this.state.onClose();

    //Report relevant updates
    reportPanelInspectInteraction(InspectTab.JSON, 'apply', {
      panel_type_changed: panel.state.pluginId !== panelModel.type,
      panel_id_changed: getPanelIdForVizPanel(panel) !== panelModel.id,
      panel_grid_pos_changed: hasGridPosChanged(panel.parent.state, newState),
      panel_targets_changed: hasQueriesChanged(getQueryRunnerFor(panel), getQueryRunnerFor(newState.$data)),
    });
  };

  public onCodeEditorBlur = (value: string) => {
    this.setState({ jsonText: value, jsonError: undefined });
  };

  public onRestore = () => {
    this.setState({ jsonText: this.state.originalText, jsonError: undefined });
  };

  public isEditable() {
    if (this.state.source !== 'panel-json') {
      return false;
    }

    const panel = this.state.panelRef.resolve();

    // Library panels are not editable from the inspect
    if (isLibraryPanel(panel)) {
      return false;
    }

    // Only support normal grid items for now and not repeated items
    if (panel.parent instanceof DashboardGridItem && panel.parent.isRepeated()) {
      return false;
    }

    const dashboard = getDashboardSceneFor(panel);
    return dashboard.state.meta.canEdit;
  }

  static Component = ({ model }: SceneComponentProps<InspectJsonTab>) => {
    const { source: show, jsonText, originalText, jsonError } = model.useState();
    const options = model.getOptions();
    const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);

    const documentActions = () => (
      <>
        <ClipboardButton
          getText={() => model.state.jsonText}
          variant="secondary"
          fill="text"
          size="sm"
          icon="copy"
          aria-label="전체 JSON 복사"
          title="전체 JSON 복사"
        >
          <Trans i18nKey="wall.inspect-json-tab.text-524212f3">전체 JSON 복사</Trans>
        </ClipboardButton>
        <Button
          variant="ghost"
          size="sm"
          aria-label="JSON 파일 내보내기"
          title="JSON 파일 내보내기"
          disabled={Boolean(inspectJsonSyntax(jsonText).error)}
          onClick={() => {
            const parsed = inspectJsonSyntax(model.state.jsonText);
            if (!parsed.error) {
              downloadAsJson(parsed.value, `${model.state.panelRef.resolve().state.title}-${show}`);
            }
          }}
        >
          <Download size={15} />
          <Trans i18nKey="wall.inspect-json-tab.text-9ad53fb3">JSON 파일 내보내기</Trans>
        </Button>
      </>
    );
    return (
      <div ref={setPortalHost} className="wall-inspect-json">
        <div className="wall-inspect-json-toolbar" data-testid={selectors.components.PanelInspector.Json.content}>
          <div className="wall-json-source">
            <label htmlFor="select-source-dropdown">
              <Trans i18nKey="wall.inspect-json-tab.text-cf2cebe7">JSON 소스</Trans>
            </label>
            <Select
              inputId="select-source-dropdown"
              options={options}
              value={options.find((v) => v.value === show) ?? options[0].value}
              onChange={model.onChangeSource}
            />
          </div>
          <div className="wall-json-document-actions" role="group" aria-label="JSON 문서 작업">
            <Popover>
              <PopoverTrigger
                render={
                  <Button size="sm" variant="ghost" aria-label="문서 작업" title="문서 작업">
                    <Trans i18nKey="wall.inspect-json-tab.text-aa988127">문서 작업</Trans>
                    <ChevronDown size={14} />
                  </Button>
                }
              />
              <PopoverContent
                portalContainer={portalHost}
                className="wall-json-tool-menu wall-json-document-menu"
                aria-label="JSON 문서 작업 메뉴"
              >
                {documentActions()}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <WallJsonWorkspace
          key={show}
          text={jsonText}
          original={originalText}
          readOnly={!model.isEditable()}
          error={jsonError}
          onChange={model.onCodeEditorBlur}
          onRestore={model.onRestore}
          onApply={model.onApplyChange}
        />
      </div>
    );
  };
}

function getJsonText(show: ShowContent, panel: VizPanel): string {
  let objToStringify: object = {};

  switch (show) {
    case 'panel-json': {
      reportPanelInspectInteraction(InspectTab.JSON, 'panelData');

      const isInspectingLibraryPanel = isLibraryPanel(panel);
      const gridItem = panel.parent;

      if (isInspectingLibraryPanel) {
        objToStringify = libraryPanelToLegacyRepresentation(panel);
        break;
      }

      if (gridItem instanceof DashboardGridItem) {
        objToStringify = gridItemToPanel(gridItem);
      }

      break;
    }

    case 'panel-data': {
      reportPanelInspectInteraction(InspectTab.JSON, 'panelJSON');

      const dataProvider = sceneGraph.getData(panel);
      if (dataProvider.state.data) {
        objToStringify = panel.applyFieldConfig(dataProvider.state.data);
      }
      break;
    }

    case 'data-frames': {
      reportPanelInspectInteraction(InspectTab.JSON, 'dataFrame');
      const dataProvider = sceneGraph.getData(panel);

      if (dataProvider.state.data) {
        // Get raw untransformed data
        if (dataProvider instanceof SceneDataTransformer && dataProvider.state.$data?.state.data) {
          objToStringify = getPanelDataFrames(dataProvider.state.$data!.state.data);
        } else {
          objToStringify = getPanelDataFrames(dataProvider.state.data);
        }
      }
    }
  }

  return getPrettyJSON(objToStringify);
}

/**
 *
 * @param panel Must hold a LibraryPanel behavior
 * @returns object representation of the legacy library panel structure.
 */
function libraryPanelToLegacyRepresentation(panel: VizPanel<{}, {}>) {
  if (!isLibraryPanel(panel)) {
    throw 'Panel not a library panel';
  }

  const gridItem = panel.parent;

  if (!(gridItem instanceof DashboardGridItem)) {
    throw 'LibraryPanel not child of DashboardGridItem';
  }

  const gridPos = {
    x: gridItem.state.x || 0,
    y: gridItem.state.y || 0,
    h: gridItem.state.height || 0,
    w: gridItem.state.width || 0,
  };
  const libraryPanelObj = vizPanelToLibraryPanel(panel);
  const panelObj = vizPanelToPanel(panel.clone({ $behaviors: undefined }), gridPos, false, gridItem);

  return { libraryPanel: { ...libraryPanelObj }, ...panelObj };
}

function vizPanelToLibraryPanel(panel: VizPanel): LibraryPanel {
  if (!isLibraryPanel(panel)) {
    throw new Error('Panel not a Library panel');
  }

  const libraryPanel = getLibraryPanelBehavior(panel);

  if (!libraryPanel) {
    throw new Error('Library panel behavior not found');
  }

  if (!libraryPanel.state._loadedPanel) {
    throw new Error('Library panel not loaded');
  }
  return libraryPanel.state._loadedPanel;
}

function hasGridPosChanged(a: SceneGridItemStateLike, b: SceneGridItemStateLike) {
  return a.x !== b.x || a.y !== b.y || a.width !== b.width || a.height !== b.height;
}

function hasQueriesChanged(a: SceneQueryRunner | undefined, b: SceneQueryRunner | undefined) {
  if (a === undefined || b === undefined) {
    return false;
  }

  return !isEqual(a.state.queries, b.state.queries);
}
