import { Modal, VerticalGroup } from '@grafana/ui';
import React from 'react';

export interface AlertHowToModalProps {
  onDismiss: () => void;
}

export function AlertHowToModal({ onDismiss }: AlertHowToModalProps): JSX.Element {
  return (
    <Modal title="경고 추가" isOpen onDismiss={onDismiss} onClickBackdrop={onDismiss}>
      <VerticalGroup spacing="sm">
        <img src="public/img/alert_howto_new.png" alt="link to how to alert image" />
        <p>
          경고는 대시보드 그래프 패널의 경고 탭에 추가 및 구성되므로 기존 쿼리를 사용하여 경고를 작성하고 시각화할 수
          있습니다.
        </p>
        <p>알림 규칙 변경 사항을 유지하려면 대시보드를 저장해야 합니다.</p>
      </VerticalGroup>
    </Modal>
  );
}
