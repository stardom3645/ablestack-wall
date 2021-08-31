import React, { FC } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import { ConfirmModal, stylesFactory, useTheme } from '@grafana/ui';
import { getLocationSrv } from '@grafana/runtime';
import { DashboardSection, OnDeleteItems } from '../types';
import { getCheckedUids } from '../utils';
import { deleteFoldersAndDashboards } from 'app/features/manage-dashboards/state/actions';

interface Props {
  onDeleteItems: OnDeleteItems;
  results: DashboardSection[];
  isOpen: boolean;
  onDismiss: () => void;
}

export const ConfirmDeleteModal: FC<Props> = ({ results, onDeleteItems, isOpen, onDismiss }) => {
  const theme = useTheme();
  const styles = getStyles(theme);

  const uids = getCheckedUids(results);
  const { folders, dashboards } = uids;
  const folderCount = folders.length;
  const dashCount = dashboards.length;

  let text = '';
  let subtitle;
  //const dashEnding = dashCount === 1 ? '' : 's';
  //const folderEnding = folderCount === 1 ? '' : 's';

  if (folderCount > 0 && dashCount > 0) {
    text += `선택한 폴더와 대시보드를`;
    subtitle = `선택한 폴더의 모든 대시보드 및 알림도 삭제됩니다.`;
  } else if (folderCount > 0) {
    text += `선택한 폴더와 모든 대시보드와 경고를`;
  } else {
    text += `선택한 대시보드를`;
  }
  text += ' 삭제하시겠습니까?';

  const deleteItems = () => {
    deleteFoldersAndDashboards(folders, dashboards).then(() => {
      onDismiss();
      // Redirect to /dashboard in case folder was deleted from f/:folder.uid
      getLocationSrv().update({ path: '/dashboards' });
      onDeleteItems(folders, dashboards);
    });
  };

  return isOpen ? (
    <ConfirmModal
      isOpen={isOpen}
      title="삭제"
      body={
        <>
          {text} {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </>
      }
      confirmText="삭제"
      onConfirm={deleteItems}
      onDismiss={onDismiss}
    />
  ) : null;
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    subtitle: css`
      font-size: ${theme.typography.size.base};
      padding-top: ${theme.spacing.md};
    `,
  };
});
