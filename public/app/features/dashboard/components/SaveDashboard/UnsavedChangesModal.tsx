import React from 'react';
import { Button, Modal } from '@grafana/ui';
import { SaveDashboardButton } from './SaveDashboardButton';
import { DashboardModel } from '../../state';
import { css } from '@emotion/css';

interface UnsavedChangesModalProps {
  dashboard: DashboardModel;
  onDiscard: () => void;
  onDismiss: () => void;
  onSaveSuccess?: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  dashboard,
  onSaveSuccess,
  onDiscard,
  onDismiss,
}) => {
  return (
    <Modal
      isOpen={true}
      title="저장되지 않은 변경사항"
      onDismiss={onDismiss}
      icon="exclamation-triangle"
      className={css`
        width: 500px;
      `}
    >
      <h5>변경 사항을 저장하시겠습니까?</h5>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onDismiss} fill="outline">
          취소
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          저장하지 않음
        </Button>
        <SaveDashboardButton dashboard={dashboard} onSaveSuccess={onSaveSuccess} />
      </Modal.ButtonRow>
    </Modal>
  );
};
