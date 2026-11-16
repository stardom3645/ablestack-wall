import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { dateTimeFormat, TimeZone } from '@grafana/data';
import { ConfirmModal } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { Button } from 'app/features/wall-modern/ui';
import { ApiKey } from 'app/types';

interface Props {
  tokens: ApiKey[];
  timeZone: TimeZone;
  tokenActionsDisabled?: boolean;
  onDelete: (token: ApiKey) => void;
}

export const ServiceAccountTokensTable = ({ tokens, timeZone, tokenActionsDisabled, onDelete }: Props): JSX.Element => {
  const [removing, setRemoving] = useState<ApiKey>();
  const date = (value?: string) => (value ? dateTimeFormat(value, { timeZone }) : undefined);
  return (
    <>
      {tokens.length ? (
        <ul className="wall-token-list" aria-label="API 토큰 목록">
          {tokens.map((token) => (
            <li key={token.id}>
              <div className="wall-token-copy">
                <strong title={token.name}>{token.name}</strong>
                <dl>
                  <div>
                    <dt>
                      <Trans i18nKey="wall.enterprise.text-36009eb0">만료</Trans>
                    </dt>
                    <dd className={token.hasExpired || token.isRevoked ? 'wall-admin-danger' : undefined}>
                      {token.hasExpired ? '만료됨' : (date(token.expiration) ?? '만료 없음')}
                      {token.isRevoked && (
                        <span title="이 토큰이 공개되었습니다. 토큰을 교체하세요.">
                          <Trans i18nKey="wall.enterprise.text-29c2af3a">· 폐기됨</Trans>
                        </span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Trans i18nKey="wall.enterprise.text-d1a2d3a2">생성</Trans>
                    </dt>
                    <dd>{date(token.created) ?? '정보 없음'}</dd>
                  </div>
                  <div>
                    <dt>
                      <Trans i18nKey="wall.enterprise.text-8c72ac64">최근 사용</Trans>
                    </dt>
                    <dd>{date(token.lastUsedAt) ?? '사용 기록 없음'}</dd>
                  </div>
                </dl>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="wall-admin-danger"
                aria-label={`Delete service account token ${token.name}`}
                disabled={tokenActionsDisabled}
                onClick={() => setRemoving(token)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="wall-admin-empty">
          <Trans i18nKey="wall.enterprise.text-3e822e67">발급된 토큰이 없습니다.</Trans>
        </p>
      )}
      <ConfirmModal
        isOpen={Boolean(removing)}
        title="API 토큰 삭제"
        body={`토큰 ${removing?.name ?? ''}을 삭제하면 이 토큰을 사용하는 연결이 중단됩니다. 삭제한 토큰은 복구할 수 없습니다.`}
        confirmText="삭제"
        onDismiss={() => setRemoving(undefined)}
        onConfirm={() => {
          if (removing && !tokenActionsDisabled) {
            onDelete(removing);
          }
          setRemoving(undefined);
        }}
      />
    </>
  );
};
