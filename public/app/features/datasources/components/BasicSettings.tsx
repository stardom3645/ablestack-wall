import { css } from '@emotion/css';
import * as React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Field, InlineSwitch, Input, Badge, useStyles2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

export interface Props {
  dataSourceName: string;
  isDefault: boolean;
  onNameChange: (name: string) => void;
  onDefaultChange: (value: boolean) => void;
  disabled?: boolean;
}

export function BasicSettings({ dataSourceName, isDefault, onDefaultChange, onNameChange, disabled }: Props) {
  return (
    <div className="wall-datasource-basic" aria-label="Datasource settings page basic settings">
      <Field label="데이터 소스 이름" htmlFor="basic-settings-name" disabled={disabled}>
        <Input
          id="basic-settings-name"
          type="text"
          value={dataSourceName}
          placeholder="Name"
          onChange={(event) => onNameChange(event.currentTarget.value)}
          required
          disabled={disabled}
          data-testid={selectors.pages.DataSource.name}
        />
      </Field>
      <div className="wall-datasource-basic-default">
        <InlineSwitch
          id="basic-settings-default"
          label="기본 데이터 소스"
          value={isDefault}
          disabled={disabled}
          onChange={(event: React.FormEvent<HTMLInputElement>) => onDefaultChange(event.currentTarget.checked)}
        />
        <label htmlFor="basic-settings-default">
          <Trans i18nKey="wall.basic-settings.text-0aee3b4d">기본 데이터 소스</Trans>
        </label>
      </div>
    </div>
  );
}

export function AlertingEnabled({ enabled }: { enabled: boolean }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.badge}>
      {enabled ? (
        <Badge color="green" icon="check-circle" text="Alerting supported" />
      ) : (
        <Badge color="orange" icon="exclamation-triangle" text="Alerting not supported" />
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  badge: css`
    margin-bottom: ${theme.spacing(2)};
  `,
});
