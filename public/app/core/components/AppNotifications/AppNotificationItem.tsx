import { css } from '@emotion/css';
import { useEffect } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { WallNotice } from 'app/features/wall-modern/WallNotice';
import { wallEditorTypography } from 'app/features/wall-modern/typography';
import { AppNotification, timeoutMap } from 'app/types';

interface Props {
  appNotification: AppNotification;
  onClearNotification: (id: string) => void;
}

export default function AppNotificationItem({ appNotification, onClearNotification }: Props) {
  const styles = useStyles2(getStyles);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClearNotification(appNotification.id);
    }, timeoutMap[appNotification.severity]);
    return () => clearTimeout(timer);
  }, [appNotification.id, appNotification.severity, onClearNotification]);

  const hasBody = appNotification.component || appNotification.text || appNotification.traceId;

  return (
    <WallNotice
      severity={appNotification.severity}
      title={appNotification.title}
      onRemove={() => onClearNotification(appNotification.id)}
      elevated
    >
      {hasBody && (
        <div className={styles.wrapper}>
          <div>{appNotification.component || appNotification.text}</div>
          {appNotification.traceId && <span className={styles.trace}>Trace ID: {appNotification.traceId}</span>}
        </div>
      )}
    </WallNotice>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    wrapper: css({
      display: 'flex',
      flexDirection: 'column',
    }),
    trace: css({
      fontSize: wallEditorTypography.caption.size,
      lineHeight: `${wallEditorTypography.caption.line}px`,
      marginTop: theme.spacing(0.5),
    }),
  };
}
