import type { CSSObject } from '@emotion/react';
import { ChartNoAxesCombined, Database, SlidersHorizontal } from 'lucide-react';
import { useId, useMemo, useState, type ReactNode } from 'react';

import { useSplitter, useTheme2 } from '@grafana/ui';
import { PortalPresentationContext } from '@grafana/ui/src/components/Portal/PortalPresentationContext';
import { t, Trans } from 'app/core/internationalization';

import { wallApplicationTokens } from '../applicationTokens';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { wallEditorFormTokens, wallSurfaceTokens, wallStudioTokens, wallStudioVariables } from '../surfaceTokens';
import { wallEditorFontFamily, wallEditorTypography, wallTypography } from '../typography';

import { editorInspectorContext, studioPreviewContext, queryWorkspaceViewContext } from './EditorPresentationContext';
import { type EditorSurface } from './queryConnection';

interface Props {
  preview: ReactNode;
  controls?: ReactNode;
  options: ReactNode;
  data?: ReactNode;
  initialData?: boolean;
  resultStatus?: ReactNode;
  preferenceKey?: string;
  isNewPanel?: boolean;
}

/** Stable native trees; data mode reuses the native vertical splitter, not another editor. */
export function WallPanelStudio({ preview, controls, options, data, resultStatus }: Props) {
  const theme = useTheme2();
  const portalPresentation = useMemo<CSSObject>(() => {
    const app = theme.isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
    const colors = {
      surface: app.elevated,
      soft: app.hover,
      panelText: app.text,
      panelMuted: app.muted,
      cardBorder: app.border,
      cardShadow: app.shadow,
    };
    const hover = colors.soft;
    return {
      fontFamily: wallEditorFontFamily,
      fontSize: wallEditorTypography.control.size,
      lineHeight: `${wallEditorTypography.control.line}px`,
      fontWeight: wallEditorTypography.control.weight,
      letterSpacing: wallTypography.roles.body.tracking,
      color: colors.panelText,
      'input, textarea, select, button, label': {
        fontFamily: wallEditorFontFamily,
        fontSize: wallEditorTypography.control.size,
        lineHeight: `${wallEditorTypography.control.line}px`,
        letterSpacing: 'inherit',
      },
      '&[role="dialog"]': {
        'button:not([aria-label])': {
          borderRadius: wallSurfaceTokens.radius - 2,
          minHeight: wallEditorFormTokens.controlHeight,
        },
        '[class*="input-wrapper"]': { borderRadius: wallSurfaceTokens.radius - 2 },
        background: colors.surface,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: wallSurfaceTokens.radius,
      },
      '[aria-label="Select options menu"]': {
        background: colors.surface,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: wallSurfaceTokens.radius,
        boxShadow: colors.cardShadow,
        overflow: 'hidden',
      },
      '[role="option"]': { padding: '7px 10px', whiteSpace: 'normal', wordBreak: 'keep-all', overflowWrap: 'anywhere' },
      '[role="option"]::before': { display: 'none' },
      '[role="option"][aria-selected="true"]': { background: hover, '&::before': { display: 'none' } },
      '[data-select-focused="true"], [role="option"]:not([aria-disabled="true"]):hover': { background: hover },
      '[data-select-description]': {
        fontSize: wallEditorTypography.caption.size,
        lineHeight: `${wallEditorTypography.caption.line}px`,
        color: colors.panelMuted,
        fontWeight: 400,
        marginTop: 2,
      },
    };
  }, [theme.isDark]);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [expandedWorkspace, setExpandedWorkspace] = useState(false);
  const splitId = useId();
  const { containerProps, primaryProps, secondaryProps, splitterProps } = useSplitter({
    direction: 'row',
    initialSize: wallStudioTokens.queryPreviewRatio,
  });
  const [surface, setSurface] = useState<EditorSurface>('data');
  const [properties, setProperties] = useState<'visual' | 'panel'>(() => (surface === 'panel' ? 'panel' : 'visual'));
  const selectSurface = (value: EditorSurface) => {
    setExpandedPreview(false);
    setExpandedWorkspace(false);
    setSurface(value);
    if (value !== 'data') {
      setProperties(value);
    }
  };
  // Text and other query-free plugins can remove their data pane after plugin loading.
  // Never leave a disabled Data tab selected with an empty inspector.
  const selectedSurface = surface === 'data' && !data ? properties : surface;
  return (
    <PortalPresentationContext.Provider value={portalPresentation}>
      <Tabs
        className="wall-panel-studio"
        data-surface={selectedSurface}
        data-preview-expanded={expandedPreview || undefined}
        data-workspace-expanded={expandedWorkspace || undefined}
        onKeyDown={(event) => {
          const nestedPopup =
            event.target instanceof Element &&
            event.target.closest('[role="dialog"], [role="menu"], [data-slot="popover-content"]');
          if (
            !event.defaultPrevented &&
            !nestedPopup &&
            (expandedPreview || expandedWorkspace) &&
            event.key === 'Escape'
          ) {
            event.preventDefault();
            event.stopPropagation();
            setExpandedPreview(false);
            setExpandedWorkspace(false);
          }
        }}
        style={wallStudioVariables}
        value={selectedSurface}
        onValueChange={(value) => {
          if (value === 'visual' || value === 'panel' || value === 'data') {
            selectSurface(value);
          }
        }}
      >
        <TabsList
          aria-label={t('wall.studio.surfaces', '패널 편집 작업')}
          className="wall-studio-mode-bar"
          variant="line"
        >
          <TabsTrigger value="data" disabled={!data}>
            <Database size={16} aria-hidden="true" />
            <Trans i18nKey="wall.studio.data-query">데이터 쿼리</Trans>
          </TabsTrigger>
          <TabsTrigger value="visual">
            <ChartNoAxesCombined size={16} aria-hidden="true" />
            <Trans i18nKey="wall.studio.visual">시각화</Trans>
          </TabsTrigger>
          <TabsTrigger value="panel">
            <SlidersHorizontal size={16} aria-hidden="true" />
            <Trans i18nKey="wall.studio.panel-settings">패널 설정</Trans>
          </TabsTrigger>
        </TabsList>
        <div {...containerProps} className={`${containerProps.className} wall-studio-panes`}>
          <section
            {...primaryProps}
            style={{
              ...primaryProps.style,
              minHeight: 0,
              minWidth: selectedSurface === 'data' ? wallStudioTokens.queryPreviewMinWidth : 0,
            }}
            id={`wall-preview-${splitId}`}
            className={`${primaryProps.className} wall-studio-canvas`}
            aria-label={t('wall.studio.canvas', '패널 미리보기 캔버스')}
          >
            <studioPreviewContext.Provider
              value={{
                controls,
                resultStatus: resultStatus ?? (
                  <>
                    <span className="wall-studio-live-dot" aria-hidden="true" />
                    <Trans i18nKey="wall.studio.live">현재 데이터와 설정을 반영한 미리보기</Trans>
                  </>
                ),
                expanded: expandedPreview,
                onToggleExpand: () => {
                  setExpandedWorkspace(false);
                  setExpandedPreview((value) => !value);
                },
              }}
            >
              <div className="wall-studio-stage">{preview}</div>
            </studioPreviewContext.Provider>
          </section>
          <div
            {...splitterProps}
            className={`${splitterProps.className} wall-studio-splitter`}
            hidden={selectedSurface !== 'data' || expandedPreview}
            aria-label={t('wall.studio.resize-data', '미리보기와 쿼리 작업공간 너비 조절')}
            aria-orientation="vertical"
            aria-controls={`wall-preview-${splitId}`}
          >
            <span />
          </div>
          {/* Hidden trees stay mounted, preserving native input/Monaco state across modes. */}
          <TabsContent value={properties} keepMounted className="wall-studio-inspector wall-studio-properties">
            <div className="wall-studio-options-body">
              <editorInspectorContext.Provider value={properties}>{options}</editorInspectorContext.Provider>
            </div>
          </TabsContent>
          <TabsContent
            {...secondaryProps}
            value="data"
            style={{ ...secondaryProps.style, minHeight: 0, minWidth: wallStudioTokens.queryWorkspaceMinWidth }}
            keepMounted
            className={`${secondaryProps.className} wall-studio-data wall-studio-data-main`}
          >
            <queryWorkspaceViewContext.Provider
              value={{
                expanded: expandedWorkspace,
                onToggleExpand: () => {
                  setExpandedPreview(false);
                  setExpandedWorkspace((value) => !value);
                },
              }}
            >
              {data}
            </queryWorkspaceViewContext.Provider>
          </TabsContent>
        </div>
      </Tabs>
    </PortalPresentationContext.Provider>
  );
}
