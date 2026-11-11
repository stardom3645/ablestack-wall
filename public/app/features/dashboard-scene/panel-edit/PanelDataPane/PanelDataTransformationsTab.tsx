import { css } from '@emotion/css';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { useContext, useState } from 'react';

import { DataTransformerConfig, GrafanaTheme2, PanelData } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import {
  SceneObjectBase,
  SceneComponentProps,
  SceneDataTransformer,
  SceneQueryRunner,
  SceneObjectRef,
  VizPanel,
  SceneObjectState,
} from '@grafana/scenes';
import { Button, ButtonGroup, ConfirmModal, Tab, useStyles2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { TransformationOperationRows } from 'app/features/dashboard/components/TransformationsEditor/TransformationOperationRows';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { WallEditorDataTab } from 'app/features/wall-modern/editor/WallPanelEditor';
import { Button as WallButton } from 'app/features/wall-modern/ui';

import { getQueryRunnerFor } from '../../utils/utils';

import { EmptyTransformationsMessage } from './EmptyTransformationsMessage';
import { TransformationsDrawer } from './TransformationsDrawer';
import { PanelDataPaneTab, TabId, PanelDataTabHeaderProps } from './types';

interface PanelDataTransformationsTabState extends SceneObjectState {
  panelRef: SceneObjectRef<VizPanel>;
}

export class PanelDataTransformationsTab
  extends SceneObjectBase<PanelDataTransformationsTabState>
  implements PanelDataPaneTab
{
  static Component = PanelDataTransformationsTabRendered;
  tabId = TabId.Transformations;

  getTabLabel() {
    return 'Transformations';
  }

  public renderTab(props: PanelDataTabHeaderProps) {
    return <TransformationsTab key={this.getTabLabel()} model={this} {...props} />;
  }

  public getQueryRunner(): SceneQueryRunner {
    return getQueryRunnerFor(this.state.panelRef.resolve())!;
  }

  public getDataTransformer(): SceneDataTransformer {
    const provider = this.state.panelRef.resolve().state.$data;

    if (!provider || !(provider instanceof SceneDataTransformer)) {
      throw new Error('Could not find SceneDataTransformer for panel');
    }
    return provider;
  }

  public onChangeTransformations(transformations: DataTransformerConfig[]) {
    const transformer = this.getDataTransformer();
    transformer.setState({ transformations });
    transformer.reprocessTransformations();
  }
}

export function PanelDataTransformationsTabRendered({ model }: SceneComponentProps<PanelDataTransformationsTab>) {
  const styles = useStyles2(getStyles);
  const wall = useContext(editorPresentationContext);
  const sourceData = model.getQueryRunner().useState();
  const { data, transformations: transformsWrongType } = model.getDataTransformer().useState();
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const transformations: DataTransformerConfig[] = transformsWrongType as unknown as DataTransformerConfig[];

  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  if (!data || !sourceData.data) {
    return;
  }

  const transformationsDrawer = (
    <TransformationsDrawer
      onClose={closeDrawer}
      onTransformationAdd={(selected) => {
        if (selected.value === undefined) {
          return;
        }
        model.onChangeTransformations([...transformations, { id: selected.value, options: {} }]);
        closeDrawer();
      }}
      isOpen={drawerOpen}
      series={data.series}
    ></TransformationsDrawer>
  );

  if (!wall && transformations.length < 1) {
    return (
      <>
        <EmptyTransformationsMessage onShowPicker={openDrawer}></EmptyTransformationsMessage>
        {transformationsDrawer}
      </>
    );
  }

  return (
    <>
      {wall && (
        <div className="wall-transform-heading">
          <span>
            <Trans i18nKey="wall.panel-data-transformations-tab.text-dd8033a8">데이터 변환 </Trans>
            <small>
              <Trans i18nKey="wall.panel-data-transformations-tab.text-1fdf0d90">· </Trans>
              {transformations.length}
              <Trans i18nKey="wall.panel-data-transformations-tab.text-11600c9a">개</Trans>
            </small>
          </span>
          <WallButton size="sm" variant="ghost" onClick={openDrawer}>
            <Trans i18nKey="wall.panel-data-transformations-tab.text-4f7bd7e0">변환 추가</Trans>
          </WallButton>
          {transformations.length > 0 && (
            <WallButton size="sm" variant="ghost" onClick={() => setConfirmModalOpen(true)}>
              <Trans i18nKey="wall.panel-data-transformations-tab.text-05234f1b">모두 삭제</Trans>
            </WallButton>
          )}
        </div>
      )}
      <div className={wall ? 'wall-transform-list' : undefined}>
        <TransformationsEditor data={sourceData.data} transformations={transformations} model={model} />
      </div>
      {!wall && (
        <ButtonGroup>
          <Button
            icon="plus"
            variant="secondary"
            onClick={openDrawer}
            data-testid={selectors.components.Transforms.addTransformationButton}
          >
            <Trans i18nKey="wall.panel-data-transformations-tab.text-0e095f9a">Add another transformation</Trans>
          </Button>
          <Button
            data-testid={selectors.components.Transforms.removeAllTransformationsButton}
            className={styles.removeAll}
            icon="times"
            variant="secondary"
            onClick={() => setConfirmModalOpen(true)}
          >
            <Trans i18nKey="wall.panel-data-transformations-tab.text-b2a81d9c">Delete all transformations</Trans>
          </Button>
        </ButtonGroup>
      )}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Delete all transformations?"
        body="By deleting all transformations, you will go back to the main selection screen."
        confirmText="Delete all"
        onConfirm={() => {
          model.onChangeTransformations([]);
          setConfirmModalOpen(false);
        }}
        onDismiss={() => setConfirmModalOpen(false)}
      />
      {transformationsDrawer}
    </>
  );
}

interface TransformationEditorProps {
  transformations: DataTransformerConfig[];
  model: PanelDataTransformationsTab;
  data: PanelData;
}

function TransformationsEditor({ transformations, model, data }: TransformationEditorProps) {
  const transformationEditorRows = transformations.map((t, i) => ({ id: `${i} - ${t.id}`, transformation: t }));

  const onDragEnd = (result: DropResult) => {
    if (!result || !result.destination) {
      return;
    }

    const startIndex = result.source.index;
    const endIndex = result.destination.index;
    if (startIndex === endIndex) {
      return;
    }
    const update = Array.from(transformationEditorRows);
    const [removed] = update.splice(startIndex, 1);
    update.splice(endIndex, 0, removed);
    model.onChangeTransformations(update.map((t) => t.transformation));
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="transformations-list" direction="vertical">
        {(provided) => {
          return (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <TransformationOperationRows
                onChange={(index, transformation) => {
                  const newTransformations = transformations.slice();
                  newTransformations[index] = transformation;
                  model.onChangeTransformations(newTransformations);
                }}
                onRemove={(index) => {
                  const newTransformations = transformations.slice();
                  newTransformations.splice(index, 1);
                  model.onChangeTransformations(newTransformations);
                }}
                configs={transformationEditorRows}
                data={data}
              ></TransformationOperationRows>
              {provided.placeholder}
            </div>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  removeAll: css({
    marginLeft: theme.spacing(2),
  }),
});

interface TransformationsTabProps extends PanelDataTabHeaderProps {
  model: PanelDataTransformationsTab;
}

function TransformationsTab(props: TransformationsTabProps) {
  const { model } = props;
  const transformerState = model.getDataTransformer().useState();

  return (
    <WallEditorDataTab
      value={model.tabId}
      label={model.getTabLabel()}
      icon="process"
      counter={transformerState.transformations.length}
      active={props.active}
      onChangeTab={props.onChangeTab}
    />
  );
}
