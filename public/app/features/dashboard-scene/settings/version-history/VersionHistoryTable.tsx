import { css } from '@emotion/css';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Button, Tag, ModalsController, useStyles2 } from '@grafana/ui';
import { t } from 'app/core/internationalization';

import { DecoratedRevisionModel } from '../VersionsEditView';

import { RevertDashboardModal } from './RevertDashboardModal';

type VersionsTableProps = {
  versions: DecoratedRevisionModel[];
  canCompare: boolean;
  onCheck: (ev: React.FormEvent<HTMLInputElement>, versionId: number) => void;
  onRestore: (version: DecoratedRevisionModel) => Promise<boolean>;
};

export const VersionHistoryTable = ({ versions, canCompare, onCheck, onRestore }: VersionsTableProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.margin}>
      <table className="filter-table">
        <thead>
          <tr>
            <th className="width-4"></th>
            <th className="width-4">{t('ablestack-wall.common.version', 'Version')}</th>
            <th className="width-14">{t('ablestack-wall.common.date', 'Date')}</th>
            <th className="width-10">{t('ablestack-wall.common.updated-by', 'Updated by')}</th>
            <th>{t('ablestack-wall.common.notes', 'Notes')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {versions.map((version, idx) => (
            <tr key={version.id}>
              <td>
                <Checkbox
                  aria-label={`Toggle selection of version ${version.version}`}
                  className={css({
                    display: 'inline',
                  })}
                  checked={version.checked}
                  onChange={(ev) => onCheck(ev, version.id)}
                  disabled={!version.checked && canCompare}
                />
              </td>
              <td>{version.version}</td>
              <td>{version.createdDateString}</td>
              <td>{version.createdBy}</td>
              <td>{version.message}</td>
              <td className="text-right">
                {idx === 0 ? (
                  <Tag name="Latest" colorIndex={17} />
                ) : (
                  <ModalsController>
                    {({ showModal, hideModal }) => (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon="history"
                        onClick={() => {
                          showModal(RevertDashboardModal, {
                            version,
                            hideModal,
                            onRestore,
                          });
                        }}
                      >
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
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    margin: css({
      marginBottom: theme.spacing(4),
    }),
  };
}
