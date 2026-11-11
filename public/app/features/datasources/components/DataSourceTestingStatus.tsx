import { css, cx } from '@emotion/css';
import { HTMLAttributes } from 'react';

import { DataSourceSettings as DataSourceSettingsType, GrafanaTheme2 } from '@grafana/data';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { TestingStatus, config } from '@grafana/runtime';
import { AlertVariant, Alert, useTheme2, Link, useStyles2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { safeQueryError } from 'app/features/wall-modern/panels/safeQueryError';

import { contextSrv } from '../../../core/core';
import { trackCreateDashboardClicked } from '../tracking';

export type Props = {
  saveFailed?: boolean;
  testingStatus?: TestingStatus;
  exploreUrl: string;
  dataSource: DataSourceSettingsType;
};

interface AlertMessageProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  severity?: AlertVariant;
  exploreUrl: string;
  dataSourceId: string;
  onDashboardLinkClicked: () => void;
}

const getStyles = (theme: GrafanaTheme2, hasTitle: boolean) => {
  return {
    content: css({
      color: theme.colors.text.secondary,
      paddingTop: hasTitle ? theme.spacing(1) : 0,
      maxHeight: '50vh',
      overflowY: 'auto',
    }),
    disabled: css({
      pointerEvents: 'none',
      color: theme.colors.text.secondary,
    }),
  };
};

const AlertSuccessMessage = ({ title, exploreUrl, dataSourceId, onDashboardLinkClicked }: AlertMessageProps) => {
  const theme = useTheme2();
  const hasTitle = Boolean(title);
  const styles = getStyles(theme, hasTitle);
  const canExploreDataSources = contextSrv.hasAccessToExplore();

  return (
    <div className={styles.content}>
      <Trans i18nKey="wall.data-source-testing-status.text-73d017b9">Next, you can start to visualize data by</Trans>{' '}
      <Link
        aria-label={`Create a dashboard`}
        href={`/dashboard/new-with-ds/${dataSourceId}`}
        className="external-link"
        onClick={onDashboardLinkClicked}
      >
        <Trans i18nKey="wall.data-source-testing-status.text-6dd971ff">building a dashboard</Trans>
      </Link>
      <Trans i18nKey="wall.data-source-testing-status.text-9e30fa70">, or by querying data in the</Trans>{' '}
      <Link
        aria-label={`Explore data`}
        className={cx('external-link', {
          [`${styles.disabled}`]: !canExploreDataSources,
          'test-disabled': !canExploreDataSources,
        })}
        href={exploreUrl}
      >
        <Trans i18nKey="wall.data-source-testing-status.text-ea091d26">Explore view</Trans>
      </Link>
      <Trans i18nKey="wall.data-source-testing-status.text-3a52ce78">.</Trans>
    </div>
  );
};

AlertSuccessMessage.displayName = 'AlertSuccessMessage';

const alertVariants = new Set(['success', 'info', 'warning', 'error']);
const isAlertVariant = (str: string): str is AlertVariant => alertVariants.has(str);
const getAlertVariant = (status: string): AlertVariant => {
  if (status.toLowerCase() === 'ok') {
    return 'success';
  }
  return isAlertVariant(status) ? status : 'info';
};

export function DataSourceTestingStatus({ testingStatus, exploreUrl, dataSource, saveFailed }: Props) {
  const severity = getAlertVariant(testingStatus?.status ?? 'error');
  const message = testingStatus?.message ? safeQueryError(testingStatus.message) : undefined;
  const detailsMessage = testingStatus?.details?.message;
  const detailsVerboseMessage = testingStatus?.details?.verboseMessage;
  const onDashboardLinkClicked = () => {
    trackCreateDashboardClicked({
      grafana_version: config.buildInfo.version,
      datasource_uid: dataSource.uid,
      plugin_name: dataSource.typeName,
      path: location.pathname,
    });
  };
  const styles = useStyles2(getTestingStatusStyles);

  if (message) {
    return (
      <div
        className={cx('wall-datasource-test-result', styles.container)}
        aria-live={severity === 'error' ? 'assertive' : 'polite'}
      >
        <h3>
          {saveFailed
            ? '설정 저장 실패'
            : severity === 'success'
              ? '연결 성공'
              : severity === 'error'
                ? '연결 실패'
                : '연결 확인'}
        </h3>
        <Alert severity={severity} title={message} data-testid={e2eSelectors.pages.DataSource.alert}>
          {testingStatus?.details && (
            <>
              {detailsMessage ? safeQueryError(String(detailsMessage)) : null}
              {severity === 'success' ? (
                <AlertSuccessMessage
                  title={message}
                  exploreUrl={exploreUrl}
                  dataSourceId={dataSource.uid}
                  onDashboardLinkClicked={onDashboardLinkClicked}
                />
              ) : null}
              {detailsVerboseMessage ? (
                <details>
                  <summary>
                    <Trans i18nKey="wall.data-source-testing-status.text-4c3f41ee">상세 메시지</Trans>
                  </summary>
                  {safeQueryError(String(detailsVerboseMessage))}
                </details>
              ) : null}
            </>
          )}
        </Alert>
      </div>
    );
  }

  return null;
}

const getTestingStatusStyles = (theme: GrafanaTheme2) => ({
  container: css({
    paddingTop: theme.spacing(3),
  }),
});
