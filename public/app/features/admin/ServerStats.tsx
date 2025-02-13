import { css } from '@emotion/css';
import { useEffect, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { config, GrafanaBootConfig } from '@grafana/runtime';
import { LinkButton, useStyles2 } from '@grafana/ui';
import { Trans, t } from 'app/core/internationalization';
import { AccessControlAction } from 'app/types';

import { contextSrv } from '../../core/services/context_srv';

import { ServerStatsCard } from './ServerStatsCard';
import { getServerStats, ServerStat } from './state/apis';

export const ServerStats = () => {
  const [stats, setStats] = useState<ServerStat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const styles = useStyles2(getStyles);

  const hasAccessToDataSources = contextSrv.hasPermission(AccessControlAction.DataSourcesRead);
  const hasAccessToAdminUsers = contextSrv.hasPermission(AccessControlAction.UsersRead);

  useEffect(() => {
    if (contextSrv.hasPermission(AccessControlAction.ActionServerStatsRead)) {
      getServerStats().then((stats) => {
        setStats(stats);
        setIsLoading(false);
      });
    }
  }, []);

  if (!contextSrv.hasPermission(AccessControlAction.ActionServerStatsRead)) {
    return null;
  }

  return (
    <>
      <h2 className={styles.title}><Trans i18nKey="ablestack-wall.administration.general.instance-statistics">Instance statistics</Trans></h2>
      {!isLoading && !stats ? (
        <p className={styles.notFound}>No stats found.</p>
      ) : (
        <div className={styles.row}>
          <ServerStatsCard
            isLoading={isLoading}
            content={[
              { name: t("ablestack-wall.administration.general.dashboards-starred", "Dashboards (starred)"), value: `${stats?.dashboards} (${stats?.stars})` },
              { name: t("ablestack-wall.administration.general.tags", "Tags"), value: stats?.tags },
              { name: t("ablestack-wall.administration.general.playlists", "Playlists"), value: stats?.playlists },
              { name: t("ablestack-wall.administration.general.snapshots", "Snapshots"), value: stats?.snapshots },
            ]}
            footer={
              <LinkButton href={'/dashboards'} variant={'secondary'}>
                {t("ablestack-wall.administration.general.manage-dashboards", "Manage dashboards")}
              </LinkButton>
            }
          />

          <div className={styles.doubleRow}>
            <ServerStatsCard
              isLoading={isLoading}
              content={[{ name: t("ablestack-wall.administration.general.data-sources", "Data sources"), value: stats?.datasources }]}
              footer={
                hasAccessToDataSources && (
                  <LinkButton href={'/datasources'} variant={'secondary'}>
                    {t("ablestack-wall.administration.general.manage-data-sources", "Manage data sources")}
                  </LinkButton>
                )
              }
            />
            <ServerStatsCard
              isLoading={isLoading}
              content={[{ name: 'Alerts', value: stats?.alerts }]}
              footer={
                <LinkButton href={'/alerting/list'} variant={'secondary'}>
                  {t("ablestack-wall.administration.general.manage-alerts", "Manage alerts")}
                </LinkButton>
              }
            />
          </div>
          <ServerStatsCard
            isLoading={isLoading}
            content={[
              { name: t("ablestack-wall.administration.general.organisations", "Organisations"), value: stats?.orgs },
              { name: t("ablestack-wall.administration.general.users-total", "Users total"), value: stats?.users },
              { name: t("ablestack-wall.administration.general.active-sessions", "Active sessions"), value: stats?.activeSessions },
              { name: t("ablestack-wall.administration.general.active-users-in-last-30-days", "Active users in last 30 days"), value: stats?.activeUsers },
              ...getAnonymousStatsContent(stats, config),
            ]}
            footer={
              hasAccessToAdminUsers && (
                <LinkButton href={'/admin/users'} variant={'secondary'}>
                  {t("ablestack-wall.administration.general.manage-users", "Manage users")}
                </LinkButton>
              )
            }
          />
        </div>
      )}
    </>
  );
};

const getAnonymousStatsContent = (stats: ServerStat | null, config: GrafanaBootConfig) => {
  if (!config.anonymousEnabled || !stats?.activeDevices) {
    return [];
  }
  if (!config.anonymousDeviceLimit) {
    return [
      {
        name: 'Active anonymous devices',
        value: `${stats.activeDevices}`,
        tooltip: 'Detected devices that are not logged in, in last 30 days.',
      },
    ];
  } else {
    return [
      {
        name: 'Active anonymous devices',
        value: `${stats.activeDevices} / ${config.anonymousDeviceLimit}`,
        tooltip: 'Detected devices that are not logged in, in last 30 days.',
        highlight: stats.activeDevices > config.anonymousDeviceLimit,
      },
    ];
  }
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    title: css({
      marginBottom: theme.spacing(4),
    }),
    row: css({
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',

      '& > div:not(:last-of-type)': {
        marginRight: theme.spacing(2),
      },

      '& > div': {
        width: '33.3%',
      },
    }),
    doubleRow: css({
      display: 'flex',
      flexDirection: 'column',

      '& > div:first-of-type': {
        marginBottom: theme.spacing(2),
      },
    }),
    notFound: css({
      fontSize: theme.typography.h6.fontSize,
      textAlign: 'center',
      height: '290px',
    }),
  };
};
