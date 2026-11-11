import { AlertCircle, Database, Loader2 } from 'lucide-react';
import { SyntheticEvent } from 'react';

import { Trans } from 'app/core/internationalization';

import { Button } from '../ui';

import { PanelDisplayState } from './panelPresentation';
import { safeQueryError } from './safeQueryError';

/** Only shown for genuinely empty results; populated and partial results stay native. */
export function WallPanelState({
  state,
  message,
  onInspect,
}: {
  state: PanelDisplayState;
  message?: string;
  onInspect?: (event: SyntheticEvent) => void;
}) {
  if (!state) {
    return null;
  }
  const Icon = state === 'error' ? AlertCircle : state === 'loading' ? Loader2 : Database;
  return (
    <div className="wall-panel-state" data-wall-panel-state={state} role={state === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{state === 'error' ? '조회 오류' : state === 'loading' ? '데이터 불러오는 중' : '데이터 없음'}</span>
      {message && <small title={safeQueryError(message)}>{safeQueryError(message)}</small>}
      {state === 'error' && onInspect && (
        <Button size="sm" variant="ghost" onClick={onInspect}>
          <Trans i18nKey="wall.wall-panel-state.text-f90d45ed">오류 상세 보기</Trans>
        </Button>
      )}
    </div>
  );
}
