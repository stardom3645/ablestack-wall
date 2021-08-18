import React from 'react';
import { ConfirmModal } from '@grafana/ui';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const UnlinkModal: React.FC<Props> = ({ isOpen, onConfirm, onDismiss }) => {
  return (
    <ConfirmModal
      title="이 패널의 연결을 해제하시겠습니까?"
      icon="question-circle"
      body="이 패널의 연결을 해제하면 다른 대시보드에 영향을 주지 않고 편집할 수 있습니다.
            그러나 일단 변경하면 원래의 재사용 가능한 패널로 되돌릴 수 없습니다."
      confirmText="예, 연결 해제"
      onConfirm={() => {
        onConfirm();
        onDismiss();
      }}
      onDismiss={onDismiss}
      isOpen={isOpen}
    />
  );
};
