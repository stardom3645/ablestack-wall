import { css } from '@emotion/css';
import { useCallback, useEffect } from 'react';

import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { notifyApp, hideAppNotification } from 'app/core/actions';
import appEvents from 'app/core/app_events';
import { selectVisible } from 'app/core/reducers/appNotification';
import { wallApplicationTokens } from 'app/features/wall-modern/applicationTokens';
import { useSelector, useDispatch } from 'app/types';

import {
  createErrorNotification,
  createInfoNotification,
  createSuccessNotification,
  createWarningNotification,
} from '../../copy/appNotification';

import AppNotificationItem from './AppNotificationItem';

export function AppNotificationList() {
  const appNotifications = useSelector((state) => selectVisible(state.appNotifications));
  const dispatch = useDispatch();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    appEvents.on(AppEvents.alertWarning, (payload) => dispatch(notifyApp(createWarningNotification(...payload))));
    appEvents.on(AppEvents.alertSuccess, (payload) => dispatch(notifyApp(createSuccessNotification(...payload))));
    appEvents.on(AppEvents.alertError, (payload) => dispatch(notifyApp(createErrorNotification(...payload))));
    appEvents.on(AppEvents.alertInfo, (payload) => dispatch(notifyApp(createInfoNotification(...payload))));
  }, [dispatch]);

  const onClearAppNotification = useCallback((id: string) => dispatch(hideAppNotification(id)), [dispatch]);

  if (!appNotifications.length) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      {appNotifications.map((appNotification) => (
        <AppNotificationItem
          key={appNotification.id}
          appNotification={appNotification}
          onClearNotification={onClearAppNotification}
        />
      ))}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    wrapper: css({
      label: 'app-notifications-list',
      zIndex: theme.zIndex.portal,
      display: 'grid',
      gap: wallApplicationTokens.gap,
      width: `min(420px, calc(100vw - ${wallApplicationTokens.gap * 4}px))`,
      minWidth: 0,
      maxHeight: `calc(100dvh - ${wallApplicationTokens.header + wallApplicationTokens.gap * 4}px)`,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      position: 'fixed',
      right: wallApplicationTokens.gap * 2,
      top: wallApplicationTokens.header + wallApplicationTokens.gap * 2,
      padding: wallApplicationTokens.gap,
      margin: -wallApplicationTokens.gap,
    }),
  };
}
