import React from 'react';
import { css } from '@emotion/css';
import { Alert, Field, Modal, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

export interface Props {
  onDismiss: () => void;
  apiKey: string;
  rootPath: string;
}

export function ApiKeysAddedModal({ onDismiss, apiKey, rootPath }: Props): JSX.Element {
  const styles = useStyles2(getStyles);
  return (
    <Modal title="API 키 생성" onDismiss={onDismiss} onClickBackdrop={onDismiss} isOpen>
      <Field label="키">
        <span className={styles.label}>{apiKey}</span>
      </Field>

      <Alert severity="info" title="이 키는 여기에서 한 번만 볼 수 있습니다!">
        이 형식으로 저장되지 않으므로 지금 복사해야 합니다.
      </Alert>

      <p className="text-muted">Authorization HTTP 헤더를 사용하여 요청을 인증할 수 있습니다. 예 :</p>
      <pre className={styles.small}>
        curl -H &quot;Authorization: Bearer {apiKey}&quot; {rootPath}/api/dashboards/home
      </pre>
    </Modal>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    label: css`
      padding: ${theme.spacing(1)};
      background-color: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.borderRadius()};
    `,
    small: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.bodySmall.fontWeight};
    `,
  };
}
