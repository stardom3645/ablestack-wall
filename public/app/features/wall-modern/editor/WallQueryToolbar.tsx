import { ChevronDown, Maximize2, Minimize2, Play } from 'lucide-react';
import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { t } from 'app/core/internationalization';

import { Collapsible } from '../components/ui/collapsible';
import { Button } from '../ui';

import { queryAdvancedSlotContext, queryWorkspaceViewContext } from './EditorPresentationContext';

/** Native execution, presented as the final action after the code. */
export function WallQueryToolbar({
  onRun,
  loading,
  stale,
  expanded,
  onToggleExpand,
  runShortcut = 'Shift + Enter',
}: {
  runShortcut?: string;
  onRun: () => void;
  loading: boolean;
  stale: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const workspaceView = useContext(queryWorkspaceViewContext);
  return (
    <div className="wall-query-runbar" role="group" aria-label={t('wall.query.run', '쿼리 실행')}>
      <span className="wall-query-run-hint">{runShortcut}</span>
      <div className="wall-query-run-actions">
        {stale && <small className="wall-query-stale">{t('wall.work.before-run', '실행 전')}</small>}
        {!workspaceView && (
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={expanded}
            onClick={onToggleExpand}
            aria-label={
              expanded ? t('wall.query.restore', '코드 편집 영역 축소') : t('wall.query.expand', '코드 편집 영역 확대')
            }
          >
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
        )}
        <Button size="sm" variant="default" disabled={loading} onClick={onRun}>
          <Play size={14} />
          {loading ? t('wall.query.running', '실행 중') : t('wall.query.run', '쿼리 실행')}
        </Button>
      </div>
    </div>
  );
}

export function WallQueryOptions({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string[];
  children: ReactNode;
}) {
  const slot = useContext(queryAdvancedSlotContext);
  if (slot?.host) {
    return createPortal(
      <section hidden={!slot.active} className="wall-query-advanced-options">
        <h3>{t('wall.work.per-query-options', '쿼리별 조회·표시')}</h3>
        <div className="wall-prom-options-content">{children}</div>
      </section>,
      slot.host
    );
  }
  return (
    <Collapsible.Root className="wall-prom-options">
      <Collapsible.Trigger render={<Button variant="ghost" size="sm" />} className="wall-prom-options-trigger">
        <ChevronDown size={14} />
        <span>{title === '쿼리 설정' ? t('wall.work.per-query-options', '쿼리별 조회·표시') : title}</span>
        <span className="wall-prom-option-summary">{summary.join(' · ')}</span>
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted className="wall-prom-options-content">
        {children}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
