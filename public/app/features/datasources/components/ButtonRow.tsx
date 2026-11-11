import * as React from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Button } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

export interface Props {
  pending?: string;
  canSave: boolean;
  canDelete: boolean;
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSubmit: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTest: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function ButtonRow({ canSave, canDelete, onDelete, onSubmit, onTest, pending }: Props) {
  return (
    <div className="wall-datasource-actions">
      <Button
        type="button"
        variant="destructive"
        disabled={!canDelete || !!pending}
        onClick={onDelete}
        data-testid={selectors.pages.DataSource.delete}
      >
        <Trans i18nKey="wall.button-row.text-fc81e222">삭제</Trans>
      </Button>
      <div>
        {pending && (
          <span role="status" aria-live="polite">
            {pending}
          </span>
        )}
        {canSave && (
          <Button
            type="submit"
            variant="primary"
            disabled={!canSave || !!pending}
            onClick={onSubmit}
            data-testid={selectors.pages.DataSource.saveAndTest}
          >
            {pending || '저장 및 연결 테스트'}
          </Button>
        )}
        {!canSave && (
          <Button type="button" variant="primary" disabled={!!pending} onClick={onTest}>
            {pending || '연결 테스트'}
          </Button>
        )}
      </div>
    </div>
  );
}
