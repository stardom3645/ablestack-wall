import { css, cx } from '@emotion/css';
import { Database } from 'lucide-react';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import { SceneComponentProps, VizPanel } from '@grafana/scenes';
import { Button, Spinner, ToolbarButton, useStyles2 } from '@grafana/ui';
import { AppChromeUpdate } from 'app/core/components/AppChrome/AppChromeUpdate';
import { t } from 'app/core/internationalization';
import {
  WallEditorOptions,
  WallEditorPreview,
  WallPanelEditorFrame,
} from 'app/features/wall-modern/editor/WallPanelEditor';
import { WallPanelStudio } from 'app/features/wall-modern/editor/WallPanelStudio';
import { WallQueryResultStatus } from 'app/features/wall-modern/editor/WallQueryParts';
import { WallManagementActions } from 'app/features/wall-modern/management/WallManagement';
import { STORAGE_VM_DASHBOARD_UID } from 'app/features/wall-modern/statPresentation';
import { WallDashboardToolbar } from 'app/features/wall-modern/toolbar/WallDashboardToolbar';
import { OverviewPanelPresentation } from 'app/features/wall-modern/workspace/overviewPresentation';

import { DashboardControls } from '../scene/DashboardControls';
import { NavToolbarActions } from '../scene/NavToolbarActions';
import { UnlinkModal } from '../scene/UnlinkModal';
import { getDashboardSceneFor, getLibraryPanelBehavior } from '../utils/utils';

import { PanelDataPane } from './PanelDataPane/PanelDataPane';
import { PanelDataQueriesTab } from './PanelDataPane/PanelDataQueriesTab';
import { PanelEditor } from './PanelEditor';
import { SaveLibraryVizPanelModal } from './SaveLibraryVizPanelModal';
import { useSnappingSplitter } from './splitter/useSnappingSplitter';

export function PanelEditorRenderer({ model }: SceneComponentProps<PanelEditor>) {
  const dashboard = getDashboardSceneFor(model);
  const { optionsPane, isDirty } = model.useState();
  const { title: dashboardTitle } = dashboard.useState();
  const { title, pluginId } = model.getPanel().useState();
  // Shared editor for every regular dashboard. Query/model/permission ownership stays native.
  const wallEditor = !dashboard.state.meta.isSnapshot && !dashboard.state.meta.dashboardNotFound;
  const styles = useStyles2(getStyles);

  const { containerProps, primaryProps, secondaryProps, splitterProps, splitterState, onToggleCollapse } =
    useSnappingSplitter({
      direction: 'row',
      dragPosition: 'end',
      initialSize: 0.75,
      paneOptions: {
        collapseBelowPixels: 250,
        snapOpenToPixels: 400,
      },
    });

  if (wallEditor) {
    return (
      <>
        <AppChromeUpdate />
        <WallPanelEditorFrame
          enabled
          title={title}
          dashboardTitle={dashboardTitle}
          visualizationName={model.getPanel().getPlugin()?.meta.name ?? pluginId}
          dirty={isDirty}
          actions={
            <WallManagementActions
              dashboard={dashboard}
              editor={model}
              library={Boolean(getLibraryPanelBehavior(model.getPanel()))}
            />
          }
        >
          <WallPanelStudioRenderer model={model} />
        </WallPanelEditorFrame>
      </>
    );
  }

  return (
    <>
      {wallEditor ? <AppChromeUpdate /> : <NavToolbarActions dashboard={dashboard} />}
      <WallPanelEditorFrame
        enabled={wallEditor}
        title={title}
        dirty={isDirty}
        actions={
          <WallManagementActions
            dashboard={dashboard}
            editor={model}
            library={Boolean(getLibraryPanelBehavior(model.getPanel()))}
          />
        }
      >
        <div
          {...containerProps}
          className={cx(containerProps.className, styles.content)}
          data-testid={selectors.components.PanelEditor.General.content}
        >
          <div {...primaryProps} className={cx(primaryProps.className, styles.body)}>
            <VizAndDataPane model={model} />
          </div>
          <div {...splitterProps} />
          <div
            {...secondaryProps}
            className={cx(secondaryProps.className, wallEditor ? styles.wallOptionsPane : styles.optionsPane)}
          >
            {splitterState.collapsed && (
              <div className={styles.expandOptionsWrapper}>
                <ToolbarButton
                  tooltip={'Open options pane'}
                  icon={'arrow-to-right'}
                  onClick={onToggleCollapse}
                  variant="canvas"
                  className={styles.rotate180}
                  aria-label={'Open options pane'}
                />
              </div>
            )}
            {!splitterState.collapsed && optionsPane && (
              <WallEditorOptions>
                <optionsPane.Component model={optionsPane} />
              </WallEditorOptions>
            )}
            {!splitterState.collapsed && !optionsPane && <Spinner />}
          </div>
        </div>
      </WallPanelEditorFrame>
    </>
  );
}

function WallPanelStudioRenderer({ model }: SceneComponentProps<PanelEditor>) {
  const dashboard = getDashboardSceneFor(model);
  const { controls, wallModern } = dashboard.useState();
  const { dataPane, optionsPane, tableView, showLibraryPanelSaveModal, showLibraryPanelUnlinkModal, isNewPanel } =
    model.useState();
  const panel = model.getPanel();
  const libraryPanel = getLibraryPanelBehavior(panel);
  return (
    <>
      <WallPanelStudio
        key={`${dashboard.state.uid ?? 'new'}:${model.getPanelId()}`}
        initialData={dataPane?.state.tab === 'transformations'}
        isNewPanel={isNewPanel}
        preferenceKey={`wall:panel-editor:surface:v1:${config.bootData.user.orgId}:${config.bootData.user.id}`}
        resultStatus={dataPane && <PreviewResult pane={dataPane} />}
        controls={
          <div className="wall-preview-context">
            {dataPane && <PreviewDataSource pane={dataPane} />}
            {controls && <WallDashboardToolbar dashboard={dashboard} controls={controls} analysisOnly />}
          </div>
        }
        preview={
          <WallEditorPreview
            tableView={Boolean(tableView)}
            hasData={Boolean(dataPane)}
            onToggleTableView={model.onToggleTableView}
          >
            <OverviewPanelPresentation
              pluginId={panel.state.pluginId}
              id={
                dashboard.state.uid === STORAGE_VM_DASHBOARD_UID
                  ? (wallModern?.panelSources?.[model.getPanelId()] ?? model.getPanelId())
                  : undefined
              }
            >
              <VizWrapper panel={panel} tableView={tableView} />
            </OverviewPanelPresentation>
          </WallEditorPreview>
        }
        options={optionsPane ? <optionsPane.Component model={optionsPane} /> : <Spinner />}
        data={dataPane && <dataPane.Component model={dataPane} />}
      />
      {showLibraryPanelSaveModal && libraryPanel && (
        <SaveLibraryVizPanelModal
          libraryPanel={libraryPanel}
          onDismiss={model.onDismissLibraryPanelSaveModal}
          onConfirm={model.onConfirmSaveLibraryPanel}
          onDiscard={model.onDiscard}
        />
      )}
      {showLibraryPanelUnlinkModal && libraryPanel && (
        <UnlinkModal
          onDismiss={model.onDismissUnlinkLibraryPanelModal}
          onConfirm={model.onConfirmUnlinkLibraryPanel}
          isOpen
        />
      )}
    </>
  );
}

function PreviewResult({ pane }: { pane: PanelDataPane }) {
  const { tabs } = pane.useState();
  const queries = tabs.find((tab): tab is PanelDataQueriesTab => tab instanceof PanelDataQueriesTab);
  return queries ? <PreviewQueryResult model={queries} /> : null;
}
function PreviewQueryResult({ model }: { model: PanelDataQueriesTab }) {
  const { data } = model.queryRunner.useState();
  return <WallQueryResultStatus data={data} />;
}

/** Read-only source identity; the one native datasource selector remains in the query workspace. */
function PreviewDataSource({ pane }: { pane: PanelDataPane }) {
  const { tabs } = pane.useState();
  const queries = tabs.find((tab): tab is PanelDataQueriesTab => tab instanceof PanelDataQueriesTab);
  return queries ? <PreviewDataSourceName model={queries} /> : null;
}
function PreviewDataSourceName({ model }: { model: PanelDataQueriesTab }) {
  const { dsSettings } = model.useState();
  return dsSettings ? (
    <span className="wall-preview-source" title={`${t('wall.editor.datasource', '데이터 소스')}: ${dsSettings.name}`}>
      <Database size={14} aria-hidden="true" />
      <span>{dsSettings.name}</span>
    </span>
  ) : null;
}

function VizAndDataPane({ model }: SceneComponentProps<PanelEditor>) {
  const dashboard = getDashboardSceneFor(model);
  const { dataPane, showLibraryPanelSaveModal, showLibraryPanelUnlinkModal, tableView } = model.useState();
  const panel = model.getPanel();
  const libraryPanel = getLibraryPanelBehavior(panel);
  const { controls } = dashboard.useState();
  const styles = useStyles2(getStyles);

  const { containerProps, primaryProps, secondaryProps, splitterProps, splitterState, onToggleCollapse } =
    useSnappingSplitter({
      direction: 'column',
      dragPosition: 'start',
      initialSize: 0.5,
      paneOptions: {
        collapseBelowPixels: 150,
      },
    });

  containerProps.className = cx(containerProps.className, styles.container);

  if (!dataPane) {
    primaryProps.style.flexGrow = 1;
  }

  return (
    <div className={cx(styles.pageContainer, controls && styles.pageContainerWithControls)}>
      {controls && (
        <div className={styles.controlsWrapper}>
          {controls instanceof DashboardControls ? (
            <WallDashboardToolbar dashboard={dashboard} controls={controls} analysisOnly />
          ) : (
            <controls.Component model={controls} />
          )}
        </div>
      )}
      <div {...containerProps}>
        <div {...primaryProps}>
          <WallEditorPreview
            tableView={Boolean(tableView)}
            hasData={Boolean(dataPane)}
            onToggleTableView={model.onToggleTableView}
          >
            <VizWrapper panel={panel} tableView={tableView} />
          </WallEditorPreview>
        </div>
        {showLibraryPanelSaveModal && libraryPanel && (
          <SaveLibraryVizPanelModal
            libraryPanel={libraryPanel}
            onDismiss={model.onDismissLibraryPanelSaveModal}
            onConfirm={model.onConfirmSaveLibraryPanel}
            onDiscard={model.onDiscard}
          ></SaveLibraryVizPanelModal>
        )}
        {showLibraryPanelUnlinkModal && libraryPanel && (
          <UnlinkModal
            onDismiss={model.onDismissUnlinkLibraryPanelModal}
            onConfirm={model.onConfirmUnlinkLibraryPanel}
            isOpen
          />
        )}
        {dataPane && (
          <>
            <div {...splitterProps} />
            <div {...secondaryProps}>
              {splitterState.collapsed && (
                <div className={styles.expandDataPane}>
                  <Button
                    tooltip={'Open query pane'}
                    icon={'arrow-to-right'}
                    onClick={onToggleCollapse}
                    variant="secondary"
                    size="sm"
                    className={styles.openDataPaneButton}
                    aria-label={'Open query pane'}
                  />
                </div>
              )}
              {!splitterState.collapsed && <dataPane.Component model={dataPane} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface VizWrapperProps {
  panel: VizPanel;
  tableView?: VizPanel;
}

function VizWrapper({ panel, tableView }: VizWrapperProps) {
  const styles = useStyles2(getStyles);
  const panelToShow = tableView ?? panel;

  return (
    <div className={styles.vizWrapper}>
      <panelToShow.Component model={panelToShow} />
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    pageContainer: css({
      display: 'grid',
      gridTemplateAreas: `
        "panels"`,
      gridTemplateColumns: `1fr`,
      gridTemplateRows: '1fr',
      height: '100%',
    }),
    pageContainerWithControls: css({
      gridTemplateAreas: `
        "controls"
        "panels"`,
      gridTemplateRows: 'auto 1fr',
    }),
    container: css({
      gridArea: 'panels',
      height: '100%',
    }),
    canvasContent: css({
      label: 'canvas-content',
      display: 'flex',
      flexDirection: 'column',
      flexBasis: '100%',
      flexGrow: 1,
      minHeight: 0,
      width: '100%',
    }),
    content: css({
      position: 'absolute',
      width: '100%',
      height: '100%',
    }),
    body: css({
      label: 'body',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }),
    wallOptionsPane: css({
      flexDirection: 'column',
    }),
    optionsPane: css({
      flexDirection: 'column',
      borderLeft: `1px solid ${theme.colors.border.weak}`,
      background: theme.colors.background.primary,
    }),
    expandOptionsWrapper: css({
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2, 1),
    }),
    expandDataPane: css({
      display: 'flex',
      flexDirection: 'row',
      padding: theme.spacing(1),
      borderTop: `1px solid ${theme.colors.border.weak}`,
      borderRight: `1px solid ${theme.colors.border.weak}`,
      background: theme.colors.background.primary,
      flexGrow: 1,
      justifyContent: 'space-around',
    }),
    rotate180: css({
      rotate: '180deg',
    }),
    controlsWrapper: css({
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 0,
      gridArea: 'controls',
      padding: theme.spacing(2, 0, 2, 2),
    }),
    openDataPaneButton: css({
      width: theme.spacing(8),
      justifyContent: 'center',
      svg: {
        rotate: '-90deg',
      },
    }),
    vizWrapper: css({
      height: '100%',
      width: '100%',
      paddingLeft: theme.spacing(2),
    }),
  };
}
