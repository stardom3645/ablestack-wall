import { ChevronDown, Database, SlidersHorizontal } from 'lucide-react';
import { useContext, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { useTheme2, Tab } from '@grafana/ui';
import { Trans, t } from 'app/core/internationalization';

import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { WallManagementBack } from '../management/WallManagement';
import { wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, useWallTypographyFonts } from '../typography';
import { Button } from '../ui';

import '../modern.css';
import '../typography.css';
import { editorPresentationContext } from './EditorPresentationContext';
import { useWallMonacoTheme } from './useWallMonacoTheme';
import './panelEditor.css';

export const WallPanelEditorContext = editorPresentationContext;

export function WallEditorVisualizationButton({
  name,
  logo,
  onOpen,
}: {
  name: string;
  logo: string;
  onOpen: () => void;
}) {
  return (
    <Button
      className="wall-editor-visualization-button"
      onClick={onOpen}
      data-testid={selectors.components.PanelEditor.toggleVizPicker}
      aria-label="Change Visualization"
    >
      <img src={logo} alt="" />
      <span>{name}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </Button>
  );
}

/** Presentation boundary only. Native Scenes still own every edit and save action. */
export function WallPanelEditorFrame({
  enabled,
  title,
  dirty,
  actions,
  children,
}: PropsWithChildren<{ enabled: boolean; title: string; dirty?: boolean; actions?: ReactNode }>) {
  const theme = useTheme2();
  const fontStatus = useWallTypographyFonts(enabled);
  useWallMonacoTheme(enabled);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <WallPanelEditorContext.Provider value={true}>
      <section
        className="wall-modern wall-panel-editor"
        data-wall-theme={theme.isDark ? 'dark' : 'light'}
        data-wall-typography="storage-vm"
        data-wall-font-status={fontStatus}
        style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark) }}
      >
        <header className="wall-editor-heading">
          <div className="wall-editor-identity">
            <WallManagementBack />
            <div className="wall-editor-title">
              <span>
                <Trans i18nKey="wall.editor.label">패널 편집</Trans>
              </span>
              <h1 title={title}>{title}</h1>
            </div>
          </div>
          {actions ?? (
            <span className="wall-editor-status" data-dirty={dirty || undefined} role="status">
              {dirty ? t('wall.editor.dirty', '저장 전 변경 사항') : t('wall.editor.preview', '미리보기')}
            </span>
          )}
        </header>
        <div className="wall-editor-workspace">{children}</div>
      </section>
    </WallPanelEditorContext.Provider>
  );
}

export function WallEditorPreview({
  children,
  tableView,
  onToggleTableView,
  hasData,
}: PropsWithChildren<{ tableView: boolean; hasData: boolean; onToggleTableView: () => void }>) {
  const enabled = useContext(WallPanelEditorContext);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <Card className="wall-editor-preview">
      <header className="wall-editor-region-heading">
        <span>
          <Trans i18nKey="wall.editor.visualization-preview">시각화 미리보기</Trans>
        </span>
        {hasData && (
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={tableView}
            onClick={onToggleTableView}
            data-testid={selectors.components.PanelEditor.toggleTableView}
          >
            <Database size={14} aria-hidden="true" />
            <Trans i18nKey="wall.editor.table-view">테이블 보기</Trans>
          </Button>
        )}
      </header>
      <div className="wall-editor-preview-content">{children}</div>
    </Card>
  );
}

export function WallEditorOptions({ children }: PropsWithChildren) {
  const enabled = useContext(WallPanelEditorContext);
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <Card className="wall-editor-options">
      <header className="wall-editor-region-heading">
        <SlidersHorizontal size={15} aria-hidden="true" />
        <span>
          <Trans i18nKey="wall.editor.display-options">표시 설정</Trans>
        </span>
      </header>
      <div className="wall-editor-options-content">{children}</div>
    </Card>
  );
}

/** Existing query/transform/rule headers keep their live counters and permissions. */
export function WallEditorDataTab({ value, ...props }: ComponentProps<typeof Tab> & { value: string }) {
  const enabled = useContext(WallPanelEditorContext);
  if (!enabled) {
    return <Tab {...props} />;
  }
  return (
    <TabsTrigger value={value} data-testid={selectors.components.Tab.title(props.label)}>
      {props.label}
      {typeof props.counter === 'number' && <span className="wall-editor-tab-count">{props.counter}</span>}
    </TabsTrigger>
  );
}

export function WallEditorDataTabs({
  value,
  onValueChange,
  tabs,
  children,
}: PropsWithChildren<{ value: string; onValueChange: (value: string) => void; tabs: ReactNode }>) {
  return (
    <Tabs
      className="wall-editor-data"
      value={value}
      onValueChange={(value) => {
        if (typeof value === 'string') {
          onValueChange(value);
        }
      }}
    >
      <TabsList variant="line" aria-label={t('wall.editor.data-tabs', '패널 데이터 편집')}>
        {tabs}
      </TabsList>
      <TabsContent value={value} className="wall-editor-data-content">
        {children}
      </TabsContent>
    </Tabs>
  );
}
