import { useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { DataSourceSettings } from '@grafana/data';
import { config } from '@grafana/runtime';
import { EmptyState, LinkButton, TextLink } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { Trans, t } from 'app/core/internationalization';
import { StoreState, AccessControlAction, useSelector } from 'app/types';

import { ROUTES } from '../../connections/constants';
import { getDataSources, getDataSourcesCount, useLoadDataSources } from '../state';
import { trackDataSourcesListViewed } from '../tracking';

import { DataSourcesListCard } from './DataSourcesListCard';
import { DataSourcesListHeader } from './DataSourcesListHeader';

import './dataSources.css';

export function DataSourcesList() {
  const { isLoading } = useLoadDataSources();

  const dataSources = useSelector((state) => getDataSources(state.dataSources));
  const dataSourcesCount = useSelector(({ dataSources }: StoreState) => getDataSourcesCount(dataSources));
  const hasCreateRights = contextSrv.hasPermission(AccessControlAction.DataSourcesCreate);
  const hasWriteRights = contextSrv.hasPermission(AccessControlAction.DataSourcesWrite);
  const hasExploreRights = contextSrv.hasAccessToExplore();

  return (
    <DataSourcesListView
      dataSources={dataSources}
      dataSourcesCount={dataSourcesCount}
      isLoading={isLoading}
      hasCreateRights={hasCreateRights}
      hasWriteRights={hasWriteRights}
      hasExploreRights={hasExploreRights}
    />
  );
}

export type ViewProps = {
  dataSources: DataSourceSettings[];
  dataSourcesCount: number;
  isLoading: boolean;
  hasCreateRights: boolean;
  hasWriteRights: boolean;
  hasExploreRights: boolean;
};

export function DataSourcesListView({
  dataSources,
  dataSourcesCount,
  isLoading,
  hasCreateRights,
  hasWriteRights,
  hasExploreRights,
}: ViewProps) {
  const location = useLocation();

  useEffect(() => {
    trackDataSourcesListViewed({
      grafana_version: config.buildInfo.version,
      path: location.pathname,
    });
  }, [location]);

  if (!isLoading && dataSourcesCount === 0) {
    return (
      <EmptyState
        variant="call-to-action"
        button={
          <LinkButton disabled={!hasCreateRights} href={ROUTES.DataSourcesNew} icon="database" size="lg">
            <Trans i18nKey="data-source-list.empty-state.button-title">Add data source</Trans>
          </LinkButton>
        }
        message={t('data-source-list.empty-state.title', 'No data sources defined')}
      >
        <Trans i18nKey="data-source-list.empty-state.pro-tip">
          You can also define data sources through configuration files.{' '}
          <TextLink
            external
            href="http://docs.grafana.org/administration/provisioning/?utm_source=grafana_ds_list#data-sources"
          >
            Learn more
          </TextLink>
        </Trans>
      </EmptyState>
    );
  }

  const getDataSourcesList = () => {
    if (isLoading) {
      return new Array(20)
        .fill(null)
        .map((_, index) => <DataSourcesListCard.Skeleton key={index} hasExploreRights={hasExploreRights} />);
    }

    return dataSources.map((dataSource) => (
      <li key={dataSource.uid}>
        <DataSourcesListCard
          dataSource={dataSource}
          hasWriteRights={hasWriteRights}
          hasExploreRights={hasExploreRights}
        />
      </li>
    ));
  };

  return (
    <div className="wall-datasource-management">
      {/* List Header */}
      <DataSourcesListHeader />

      <div className="wall-datasource-list-label">
        <Trans i18nKey="wall.data-sources-list.text-291e2bba">연결된 데이터 소스 · </Trans>
        {dataSources.length}
        <Trans i18nKey="wall.data-sources-list.text-11600c9a">개</Trans>
      </div>
      {/* List */}
      {dataSources.length === 0 && !isLoading ? (
        <EmptyState variant="not-found" message={t('data-sources.empty-state.message', 'No data sources found')} />
      ) : (
        <ul className="wall-datasource-list">{getDataSourcesList()}</ul>
      )}
    </div>
  );
}
