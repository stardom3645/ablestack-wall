import { Menu } from '@base-ui/react/menu';
import { ArrowLeft, Check, ChevronDown, Save, Settings2, Undo2 } from 'lucide-react';
import { type PropsWithChildren } from 'react';
import { Link } from 'react-router-dom-v5-compat';

import type { NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { useTheme2 } from '@grafana/ui';
import { t, Trans } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import type { PanelEditor } from 'app/features/dashboard-scene/panel-edit/PanelEditor';
import type { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { useWallMonacoTheme } from '../editor/useWallMonacoTheme';
import { wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, useWallTypographyFonts } from '../typography';
import { Button } from '../ui';

import '../modern.css';
import { settingsPresentationContext } from './SettingsPresentationContext';
import './management.css';

export const WallSettingsContext = settingsPresentationContext;

export function WallManagementActions({
  dashboard,
  editor,
  library = false,
}: {
  dashboard: DashboardScene;
  editor?: PanelEditor;
  library?: boolean;
}) {
  const state = dashboard.useState();
  const theme = useTheme2();
  const canSaveAs = contextSrv.hasEditPermissionInFolders;
  const canSave = state.isEditing && !state.kioskMode && !library && (state.meta.canSave || canSaveAs);
  const onlyCopy = canSaveAs && !state.meta.canSave && !state.meta.canMakeEditable && !state.meta.isNew;
  if (editor) {
    return (
      <div className="wall-management-actions wall-panel-edit-actions">
        <span className="wall-management-unsaved" role="status">
          {(editor.state.isDirty || state.isDirty) && <span />}
          {editor.state.isDirty
            ? t('wall.editor.unsaved', '변경 사항 있음')
            : state.isDirty
              ? t('wall.editor.dashboard-pending', '대시보드 미저장 변경')
              : t('wall.editor.unchanged', '변경 사항 없음')}
        </span>
        {!state.kioskMode && (
          <Button size="sm" variant="ghost" onClick={editor.onDiscard}>
            <Trans i18nKey="wall.editor.cancel">취소</Trans>
          </Button>
        )}
        {!state.kioskMode && (canSave || library) && (
          <Button
            size="sm"
            variant="default"
            onClick={library ? editor.onSaveLibraryPanel : () => locationService.partial({ editPanel: null })}
          >
            <Check size={14} />
            <Trans i18nKey="wall.editor.apply">적용</Trans>
          </Button>
        )}
        {canSave && (
          <Menu.Root>
            <Menu.Trigger
              render={<Button size="sm" variant="ghost" />}
              aria-label={t('wall.management.save-options', '저장 옵션')}
            >
              <ChevronDown size={14} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="end" className="wall-menu-positioner">
                <Menu.Popup
                  className="wall-modern wall-management-menu"
                  data-wall-theme={theme.isDark ? 'dark' : 'light'}
                  style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark, true) }}
                >
                  <Menu.Item
                    className="wall-management-menu-item"
                    onClick={() => dashboard.openSaveDrawer(onlyCopy ? { saveAsCopy: true } : {})}
                  >
                    <Save size={14} />
                    {onlyCopy
                      ? t('wall.management.save-copy', '복사본 저장')
                      : t('wall.management.save-current', '대시보드 저장')}
                  </Menu.Item>
                  {!onlyCopy && canSaveAs && (
                    <Menu.Item
                      className="wall-management-menu-item"
                      onClick={() => dashboard.openSaveDrawer({ saveAsCopy: true })}
                    >
                      <Save size={14} />
                      <Trans i18nKey="wall.management.save-copy">복사본 저장</Trans>
                    </Menu.Item>
                  )}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        )}
        {!state.kioskMode && library && (
          <Button size="sm" onClick={editor.onUnlinkLibraryPanel}>
            <Trans i18nKey="wall.management.unlink">라이브러리 연결 해제</Trans>
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="wall-management-actions">
      {state.isDirty && (
        <span className="wall-management-unsaved">
          <span />
          <Trans i18nKey="wall.management.unsaved">미저장 변경</Trans>
        </span>
      )}
      {!state.kioskMode && state.isDirty && (
        <Button
          size="sm"
          variant="ghost"
          disabled={!state.isDirty}
          onClick={() => dashboard.exitEditMode({ skipConfirm: false, restoreInitialState: true })}
        >
          <Undo2 size={14} />
          <Trans i18nKey="wall.management.discard">변경 취소</Trans>
        </Button>
      )}
      {canSave && (
        <div className="wall-management-save">
          <Button
            size="sm"
            variant="default"
            onClick={() => dashboard.openSaveDrawer(onlyCopy ? { saveAsCopy: true } : {})}
          >
            <Save size={14} />
            {onlyCopy ? t('wall.management.save-copy', '복사본 저장') : t('wall.management.save', '변경 사항 저장')}
          </Button>
          {!state.meta.isNew && !onlyCopy && (
            <Menu.Root>
              <Menu.Trigger
                render={<Button size="sm" variant="default" />}
                aria-label={t('wall.management.save-options', '저장 옵션')}
              >
                <ChevronDown size={14} />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={6} align="end" className="wall-menu-positioner">
                  <Menu.Popup
                    className="wall-modern wall-management-menu"
                    data-wall-theme={theme.isDark ? 'dark' : 'light'}
                    style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark, true) }}
                  >
                    <Menu.Item className="wall-management-menu-item" onClick={() => dashboard.openSaveDrawer({})}>
                      <Check size={14} />
                      <Trans i18nKey="wall.management.save-current">대시보드 저장</Trans>
                    </Menu.Item>
                    {canSaveAs && (
                      <Menu.Item
                        className="wall-management-menu-item"
                        onClick={() => dashboard.openSaveDrawer({ saveAsCopy: true })}
                      >
                        <Save size={14} />
                        <Trans i18nKey="wall.management.save-copy">복사본 저장</Trans>
                      </Menu.Item>
                    )}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          )}
        </div>
      )}
    </div>
  );
}
export function WallManagementBack({ dashboardTitle }: { dashboardTitle?: string }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      className={dashboardTitle ? 'wall-editor-back' : undefined}
      title={dashboardTitle}
      aria-label={dashboardTitle ? `${t('wall.management.back', '대시보드로 돌아가기')}: ${dashboardTitle}` : undefined}
      onClick={() => locationService.partial({ editPanel: null, editview: null, editIndex: null, viewPanel: null })}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      {dashboardTitle ? (
        <span>{dashboardTitle}</span>
      ) : (
        <Trans i18nKey="wall.management.back">대시보드로 돌아가기</Trans>
      )}
    </Button>
  );
}
export function WallSettingsPage({
  dashboard,
  pageNav,
  children,
}: PropsWithChildren<{ dashboard: DashboardScene; pageNav?: NavModelItem }>) {
  const theme = useTheme2();
  const fontStatus = useWallTypographyFonts(true);
  const { title, editview } = dashboard.useState();
  useWallMonacoTheme(editview?.getUrlKey() === 'json-model');
  let root = pageNav;
  while (root && !root.children?.length && root.parentItem) {
    root = root.parentItem;
  }
  const items = root?.children ?? [];
  const current = items.find((item) => item.active);
  return (
    <section
      className="wall-modern wall-management wall-settings"
      data-wall-theme={theme.isDark ? 'dark' : 'light'}
      data-wall-typography="storage-vm"
      data-wall-font-status={fontStatus}
      style={{ ...wallTypographyVariables, ...wallSurfaceVariables(theme.isDark, true) }}
    >
      <header className="wall-management-header">
        <div className="wall-management-identity">
          <WallManagementBack />
          <div>
            <span>{title}</span>
            <h1>
              <Trans i18nKey="wall.management.settings">대시보드 설정</Trans>
            </h1>
          </div>
        </div>
        <WallManagementActions dashboard={dashboard} />
      </header>
      <div className="wall-settings-workspace">
        <nav className="wall-settings-navigation" aria-label={t('wall.management.settings-nav', '대시보드 설정 메뉴')}>
          <div className="wall-settings-nav-label">
            <Settings2 size={14} />
            <Trans i18nKey="wall.management.configuration">CONFIGURATION</Trans>
          </div>
          {items.map((item) => (
            <Button
              key={item.url ?? item.text}
              render={<Link to={item.url ?? ''} />}
              nativeButton={false}
              variant="ghost"
              className="wall-settings-nav-item"
              aria-current={item.active ? 'page' : undefined}
            >
              <span className="wall-settings-nav-dot" />
              {item.text}
            </Button>
          ))}
        </nav>
        <div className="wall-settings-scroll">
          <div className="wall-settings-section-heading">
            <h2>{current?.text ?? pageNav?.text}</h2>
            <p>
              <Trans i18nKey="wall.management.settings-help">변경 사항을 검토한 뒤 대시보드에 저장하세요.</Trans>
            </p>
          </div>
          <div className="wall-settings-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
