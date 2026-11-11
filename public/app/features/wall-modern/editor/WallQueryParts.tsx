import { Draggable, Droppable } from '@hello-pangea/dnd';
import { ChevronDown, GripVertical } from 'lucide-react';
import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { LoadingState, type DataQuery, type PanelData } from '@grafana/data';
import { t } from 'app/core/internationalization';

import { Collapsible } from '../components/ui/collapsible';
import { wallStudioTokens } from '../surfaceTokens';
import { Button } from '../ui';

import {
  queryAdvancedSlotContext,
  queryWorkspaceViewContext,
  type WallCodeQueryPresentation,
} from './EditorPresentationContext';
import { WallQueryOptions, WallQueryToolbar } from './WallQueryToolbar';

/** Local UI composition only. Native Scenes own queries, transforms, execution and persistence. */
export function WorkspaceSection({
  title,
  children,
  summary,
  initialOpen = false,
  className = '',
  open,
  onOpenChange,
}: {
  title: string;
  children: ReactNode;
  summary?: ReactNode;
  initialOpen?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={initialOpen}
      className={`wall-work-section ${className}`}
    >
      <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-work-section-heading">
        <span>{title}</span>
        {summary && <small>{summary}</small>}
        <ChevronDown size={14} />
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted className="wall-work-section-content">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

/** The existing QueryEditorRows drag callbacks own ordering; these are presentation handles only. */
export function WallQueryNavigation({
  queries,
  selected,
  onSelect,
  actions,
}: {
  queries: DataQuery[];
  selected?: string;
  onSelect?: (id: string) => void;
  actions?: ReactNode;
}) {
  return (
    <div className="wall-work-query-navigation">
      <Droppable droppableId="wall-query-navigation" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="wall-work-query-list"
            aria-label="쿼리 목록"
          >
            {queries.map((query, index) => (
              <Draggable draggableId={query.refId} index={index} key={query.refId}>
                {(drag) => (
                  <div
                    ref={drag.innerRef}
                    {...drag.draggableProps}
                    className="wall-work-query-choice"
                    data-selected={selected === query.refId || undefined}
                  >
                    <span
                      {...drag.dragHandleProps}
                      className="wall-work-query-grip"
                      aria-label={`쿼리 ${query.refId} 순서 변경`}
                    >
                      <GripVertical size={14} />
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => onSelect?.(query.refId)}
                      aria-pressed={selected === query.refId}
                      aria-label={`쿼리 ${query.refId} 선택`}
                    >
                      <b>{query.refId}</b>
                      <small>{query.hide ? t('wall.work.hidden', '결과 숨김') : null}</small>
                    </Button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {actions}
    </div>
  );
}

export function WallSelectedQuery({
  children,
  metadata,
  actions,
}: {
  children: ReactNode;
  metadata: ReactNode;
  actions: ReactNode;
}) {
  const slot = useContext(queryAdvancedSlotContext);
  const management = (
    <section className="wall-query-management-advanced" hidden={slot ? !slot.active : undefined}>
      <h3>{t('wall.work.query-actions', '쿼리 관리')}</h3>
      <div className="wall-work-query-metadata">{metadata}</div>
      <div className="wall-work-native-actions">{actions}</div>
    </section>
  );
  return (
    <div className="wall-selected-query">
      {children}
      {slot?.host ? (
        createPortal(management, slot.host)
      ) : (
        <WorkspaceSection title={t('wall.work.query-actions', '쿼리 관리')}>{management}</WorkspaceSection>
      )}
    </div>
  );
}

export function WallQueryResultStatus({ data }: { data?: PanelData }) {
  const status = data?.state;
  const error = data?.error?.message ?? data?.errors?.[0]?.message;
  const failed = Boolean(error) || status === LoadingState.Error;
  return (
    <div
      className="wall-query-result-status"
      data-error={failed || undefined}
      role={failed ? 'alert' : 'status'}
      title={error}
    >
      <span className="wall-query-status-dot" />
      {failed ? (
        <span>{error ?? t('wall.work.failed', '조회 실패')}</span>
      ) : (
        <span>
          {status === LoadingState.Loading
            ? t('wall.work.running', '결과 조회 중')
            : status === LoadingState.Streaming
              ? t('wall.work.streaming', '실시간 결과 수신 중')
              : status === LoadingState.Done
                ? `${t('wall.work.done', '최근 조회 완료')} · ${data?.series.length ?? 0}${t('wall.work.frames', '개 결과')}`
                : t('wall.work.waiting', '조회 대기')}
        </span>
      )}
    </div>
  );
}

/** Host render callbacks also work for independently bundled datasource plugins. */
export function WallCodeQueryHost({ children }: { children: (presentation: WallCodeQueryPresentation) => ReactNode }) {
  const view = useContext(queryWorkspaceViewContext);
  return (
    <>
      {children({
        codeHeight: view?.expanded
          ? wallStudioTokens.queryCodeExpandedHeight
          : wallStudioTokens.queryWorkspaceCodeMinHeight,
        options: (content) => (
          <WallQueryOptions title="쿼리 옵션" summary={[]}>
            {content}
          </WallQueryOptions>
        ),
        actions: (run, loading) => (
          <WallQueryToolbar
            onRun={run}
            loading={loading}
            stale={false}
            expanded={Boolean(view?.expanded)}
            onToggleExpand={() => view?.onToggleExpand()}
            runShortcut="Ctrl / ⌘ + Enter"
          />
        ),
      })}
    </>
  );
}
