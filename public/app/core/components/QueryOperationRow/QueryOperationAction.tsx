import { css, cx } from '@emotion/css';
import * as React from 'react';
import { useContext } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { Icon, IconButton, IconName, useStyles2 } from '@grafana/ui';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { Button as WallButton } from 'app/features/wall-modern/ui';

interface BaseQueryOperationActionProps {
  icon: IconName;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  dataTestId?: string;
}

function BaseQueryOperationAction(props: QueryOperationActionProps | QueryOperationToggleActionProps) {
  const styles = useStyles2(getStyles);
  const wallEditor = useContext(editorPresentationContext);
  if (wallEditor) {
    return (
      <WallButton
        size="icon"
        variant="ghost"
        title={props.title}
        aria-label={props.title}
        disabled={!!props.disabled}
        onClick={props.onClick}
        data-testid={props.dataTestId ?? selectors.components.QueryEditorRow.actionButton(props.title)}
        {...('active' in props && { 'aria-pressed': props.active })}
      >
        <Icon name={props.icon} size="sm" />
      </WallButton>
    );
  }

  return (
    <div className={cx(styles.icon, 'active' in props && props.active && styles.active)}>
      <IconButton
        name={props.icon}
        tooltip={props.title}
        className={styles.icon}
        disabled={!!props.disabled}
        onClick={props.onClick}
        type="button"
        data-testid={props.dataTestId ?? selectors.components.QueryEditorRow.actionButton(props.title)}
        {...('active' in props && { 'aria-pressed': props.active })}
      />
    </div>
  );
}

interface QueryOperationActionProps extends BaseQueryOperationActionProps {}
export function QueryOperationAction(props: QueryOperationActionProps) {
  return <BaseQueryOperationAction {...props} />;
}

interface QueryOperationToggleActionProps extends BaseQueryOperationActionProps {
  active: boolean;
}
export const QueryOperationToggleAction = (props: QueryOperationToggleActionProps) => {
  return <BaseQueryOperationAction {...props} />;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    icon: css({
      display: 'flex',
      position: 'relative',
      color: theme.colors.text.secondary,
    }),
    active: css({
      '&:before': {
        display: 'block',
        content: '" "',
        position: 'absolute',
        left: -1,
        right: 2,
        height: 3,
        borderRadius: theme.shape.radius.default,
        bottom: -8,
        backgroundImage: theme.colors.gradients.brandHorizontal,
      },
    }),
  };
};
