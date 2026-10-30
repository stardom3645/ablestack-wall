import { History } from 'lucide-react';
import { type FormEvent } from 'react';

import { ModalsController } from '@grafana/ui';
import { t, Trans } from 'app/core/internationalization';
import type { DecoratedRevisionModel } from 'app/features/dashboard-scene/settings/VersionsEditView';
import { RevertDashboardModal } from 'app/features/dashboard-scene/settings/version-history/RevertDashboardModal';

import { Button } from '../ui';

export function WallVersionHistory({
  versions,
  canCompare,
  onCheck,
  onRestore,
}: {
  versions: DecoratedRevisionModel[];
  canCompare: boolean;
  onCheck: (event: FormEvent<HTMLInputElement>, id: number) => void;
  onRestore: (version: DecoratedRevisionModel) => Promise<boolean>;
}) {
  return (
    <section className="wall-settings-collection wall-version-history">
      <header className="wall-collection-heading">
        <div>
          <h3>
            <History size={16} />
            <Trans i18nKey="wall.settings.revision-history">변경 이력</Trans>
          </h3>
          <p>
            <Trans i18nKey="wall.settings.revision-help">
              두 버전을 선택해 변경 내용을 비교하거나 이전 버전으로 복원할 수 있습니다.
            </Trans>
          </p>
        </div>
      </header>
      <div className="wall-version-table-scroll">
        <table className="wall-version-table">
          <thead>
            <tr>
              <th aria-label={t('wall.settings.revision-select', '비교 선택')} />
              <th>{t('ablestack-wall.common.version', 'Version')}</th>
              <th>{t('ablestack-wall.common.date', 'Date')}</th>
              <th>{t('ablestack-wall.common.updated-by', 'Updated by')}</th>
              <th>{t('ablestack-wall.common.notes', 'Notes')}</th>
              <th aria-label={t('wall.settings.revision-actions', '버전 작업')} />
            </tr>
          </thead>
          <tbody>
            {versions.map((version, index) => (
              <tr key={version.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Toggle selection of version ${version.version}`}
                    checked={version.checked}
                    disabled={!version.checked && canCompare}
                    onChange={(event) => onCheck(event, version.id)}
                  />
                </td>
                <td>
                  <strong className="wall-version-number">{version.version}</strong>
                </td>
                <td className="wall-version-date">{version.createdDateString}</td>
                <td>{version.createdBy}</td>
                <td>{version.message}</td>
                <td>
                  {index === 0 ? (
                    <span className="wall-version-current">
                      <Trans i18nKey="wall.settings.latest-revision">현재 버전</Trans>
                    </span>
                  ) : (
                    <ModalsController>
                      {({ showModal, hideModal }) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => showModal(RevertDashboardModal, { version, hideModal, onRestore })}
                        >
                          <History size={14} />
                          {t('ablestack-wall.common.restore', 'Restore')}
                        </Button>
                      )}
                    </ModalsController>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
