import { css, cx } from '@emotion/css';
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from 'lucide-react';
import { HTMLAttributes } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { AlertVariant, useStyles2 } from '@grafana/ui';
import { t } from 'app/core/internationalization';

import { wallApplicationTokens } from './applicationTokens';
import { wallSurfaceTokens } from './surfaceTokens';
import { wallEditorTypography, wallTypography } from './typography';
import { Button } from './ui';

interface Props extends HTMLAttributes<HTMLDivElement> {
  title: string;
  severity: AlertVariant;
  onRemove?: () => void;
  elevated?: boolean;
}

const icons = { success: CheckCircle2, error: CircleAlert, warning: TriangleAlert, info: Info };

/** Presentation only: the caller owns messages, actions, lifetime and error handling. */
export function WallNotice({ title, severity, onRemove, elevated = false, children, className, ...props }: Props) {
  const styles = useStyles2(getStyles, severity, elevated);
  const StatusIcon = icons[severity];

  return (
    <div
      role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
      aria-label={title}
      {...props}
      className={cx(styles.wrapper, className)}
    >
      <div className={styles.surface} data-testid={selectors.components.Alert.alertV2(severity)}>
        <StatusIcon size={20} strokeWidth={1.8} className={styles.icon} aria-hidden="true" />
        <div className={styles.content}>
          <div className={styles.title}>{title}</div>
          {children && <div className={styles.body}>{children}</div>}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className={styles.close}
            aria-label={t('wall.notifications.close', '알림 닫기')}
            onClick={onRemove}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2, severity: AlertVariant, elevated: boolean) {
  const colors = theme.isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  const gap = wallApplicationTokens.gap;
  return {
    wrapper: css({ minWidth: 0, fontFamily: wallTypography.family }),
    surface: css({
      display: 'flex',
      alignItems: 'flex-start',
      gap: gap * 1.5,
      padding: wallSurfaceTokens.padding,
      border: `1px solid ${colors.border}`,
      borderRadius: wallSurfaceTokens.radius,
      background: colors.surface,
      color: colors.text,
      boxShadow: elevated ? colors.shadow : 'none',
    }),
    icon: css({ color: theme.colors[severity].text, flexShrink: 0, marginTop: 1 }),
    content: css({ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }),
    title: css({
      fontSize: wallTypography.roles.section.size,
      fontWeight: wallTypography.roles.section.weight,
      lineHeight: `${wallTypography.roles.section.line}px`,
    }),
    body: css({
      marginTop: gap / 2,
      color: colors.muted,
      fontSize: wallEditorTypography.body.size,
      lineHeight: `${wallEditorTypography.body.line}px`,
      maxHeight: '40vh',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      whiteSpace: 'pre-wrap',
      '& p': { margin: 0 },
    }),
    close: css({
      flexShrink: 0,
      width: wallSurfaceTokens.controlSize,
      height: wallSurfaceTokens.controlSize,
      padding: 0,
      margin: -gap / 2,
      marginLeft: 0,
      border: '1px solid transparent',
      borderRadius: wallSurfaceTokens.radius / 2,
      background: 'transparent',
      color: colors.muted,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      '&:hover': { background: colors.hover, color: colors.text },
      '&:focus-visible': { outline: `2px solid ${colors.primary}`, outlineOffset: 2 },
    }),
  };
}
