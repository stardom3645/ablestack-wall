import { css, cx } from '@emotion/css';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { locationService, reportInteraction } from '@grafana/runtime';
import { Badge, Stack, useStyles2 } from '@grafana/ui';
import { SkeletonComponent, attachSkeleton } from '@grafana/ui/src/unstable';

import { CatalogPlugin } from '../types';

import { PluginListItemBadges } from './PluginListItemBadges';
import { PluginLogo } from './PluginLogo';

export const LOGO_SIZE = '48px';

type Props = {
  plugin: CatalogPlugin;
  pathName: string;
};

function PluginListItemComponent({ plugin, pathName }: Props) {
  const reportUserClickInteraction = () => {
    if (locationService.getSearchObject()?.q) {
      reportInteraction('plugins_search_user_click', {});
    }
  };
  return (
    <a href={`${pathName}/${plugin.id}`} className="wall-plugin-item" onClick={reportUserClickInteraction}>
      <span className="wall-plugin-logo">
        <PluginLogo src={plugin.info.logos.small} height="28px" alt="" />
      </span>
      <div>
        <h2>{plugin.name}</h2>
        {plugin.description && <p title={plugin.description}>{plugin.description}</p>}
        <p>
          {plugin.orgName}
          {plugin.type ? ` · ${plugin.type}` : ''}
        </p>
        <div className="wall-plugin-badges">
          <PluginListItemBadges plugin={plugin} />
        </div>
      </div>
    </a>
  );
}

const PluginListItemSkeleton: SkeletonComponent = ({ rootProps }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.container)} {...rootProps}>
      <Skeleton
        containerClassName={cx(
          styles.pluginLogo,
          css({
            lineHeight: 1,
          })
        )}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
      />
      <h2 className={styles.name}>
        <Skeleton width={100} />
      </h2>
      <div className={styles.content}>
        <p>
          <Skeleton width={120} />
        </p>
        <Stack direction="row">
          <Badge.Skeleton />
          <Badge.Skeleton />
        </Stack>
      </div>
      <div className={styles.pluginType}>
        <Skeleton width={16} height={16} />
      </div>
    </div>
  );
};

export const PluginListItem = attachSkeleton(PluginListItemComponent, PluginListItemSkeleton);

// Styles shared between the different type of list items
export const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      display: 'grid',
      gridTemplateColumns: `${LOGO_SIZE} 1fr ${theme.spacing(3)}`,
      gridTemplateRows: 'auto',
      gap: theme.spacing(2),
      gridAutoFlow: 'row',
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(3),
      [theme.transitions.handleMotion('no-preference', 'reduce')]: {
        transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'color'], {
          duration: theme.transitions.duration.short,
        }),
      },

      '&:hover': {
        background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
      },
    }),
    pluginType: css({
      gridArea: '1 / 3 / 2 / 4',
      color: theme.colors.text.secondary,
    }),
    pluginLogo: css({
      gridArea: '1 / 1 / 3 / 2',
      maxWidth: '100%',
      alignSelf: 'center',
      objectFit: 'contain',
    }),
    content: css({
      gridArea: '3 / 1 / 4 / 3',
      color: theme.colors.text.secondary,
    }),
    name: css({
      gridArea: '1 / 2 / 3 / 3',
      alignSelf: 'center',
      fontSize: theme.typography.h4.fontSize,
      color: theme.colors.text.primary,
      margin: 0,
      wordBreak: 'normal',
      overflowWrap: 'anywhere',
    }),
  };
};
