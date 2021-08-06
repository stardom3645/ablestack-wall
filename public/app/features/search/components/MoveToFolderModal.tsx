import React, { FC, useState } from 'react';
import { css } from '@emotion/css';
import { Button, HorizontalGroup, Modal, stylesFactory, useTheme } from '@grafana/ui';
import { AppEvents, GrafanaTheme } from '@grafana/data';
import { FolderInfo } from 'app/types';
import { FolderPicker } from 'app/core/components/Select/FolderPicker';
import appEvents from 'app/core/app_events';
import { DashboardSection, OnMoveItems } from '../types';
import { getCheckedDashboards } from '../utils';
import { moveDashboards } from 'app/features/manage-dashboards/state/actions';

interface Props {
  onMoveItems: OnMoveItems;
  results: DashboardSection[];
  isOpen: boolean;
  onDismiss: () => void;
}

export const MoveToFolderModal: FC<Props> = ({ results, onMoveItems, isOpen, onDismiss }) => {
  const [folder, setFolder] = useState<FolderInfo | null>(null);
  const theme = useTheme();
  const styles = getStyles(theme);
  const selectedDashboards = getCheckedDashboards(results);

  const moveTo = () => {
    if (folder && selectedDashboards.length) {
      const folderTitle = folder.title ?? 'General';

      moveDashboards(selectedDashboards.map((d) => d.uid) as string[], folder).then((result: any) => {
        if (result.successCount > 0) {
          const ending = result.successCount === 1 ? '' : 's';
          const header = `Dashboard${ending} Moved`;
          const msg = `${result.successCount} dashboard${ending} moved to ${folderTitle}`;
          appEvents.emit(AppEvents.alertSuccess, [header, msg]);
        }

        if (result.totalCount === result.alreadyInFolderCount) {
          appEvents.emit(AppEvents.alertError, ['Error', `Dashboard already belongs to folder ${folderTitle}`]);
        } else {
          onMoveItems(selectedDashboards, folder);
        }

        onDismiss();
      });
    }
  };

  return isOpen ? (
    <Modal className={styles.modal} title="대시보드 폴더 선택" icon="folder-plus" isOpen={isOpen} onDismiss={onDismiss}>
      <>
        <div className={styles.content}>
          <p>선택한 {selectedDashboards.length}개의 대시보드를 다음 폴더로 이동합니다.</p>
          <FolderPicker onChange={(f) => setFolder(f as FolderInfo)} />
        </div>

        <HorizontalGroup justify="center">
          <Button variant="primary" onClick={moveTo}>
            이동
          </Button>
          <Button variant="secondary" onClick={onDismiss}>
            취소
          </Button>
        </HorizontalGroup>
      </>
    </Modal>
  ) : null;
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    modal: css`
      width: 500px;
    `,
    content: css`
      margin-bottom: ${theme.spacing.lg};
    `,
  };
});
