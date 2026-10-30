import { css, cx } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Legend, useStyles2 } from '@grafana/ui';
import { useWallSettings } from 'app/features/wall-modern/management/SettingsPresentationContext';

export function VariableLegend({ className, ...rest }: Parameters<typeof Legend>['0']) {
  const styles = useStyles2(getStyles);
  const wallSettings = useWallSettings();
  if (wallSettings) {
    return <h3 className="wall-variable-legend">{rest.children}</h3>;
  }
  return <Legend {...rest} className={cx(styles.legend, className)} />;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    legend: css({
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(1),
    }),
  };
}
