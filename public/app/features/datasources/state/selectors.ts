import memoizeOne from 'memoize-one';

import { DataSourcePluginMeta, DataSourceSettings, UrlQueryValue } from '@grafana/data';
import { DataSourcesState } from 'app/types/datasources';

export const getDataSources = memoizeOne((state: DataSourcesState) => {
  const query = state.searchQuery.trim().toLocaleLowerCase();

  const filteredDataSources = state.dataSources.filter((dataSource: DataSourceSettings) => {
    return [dataSource.name, dataSource.database, dataSource.type, dataSource.typeName].some((value) =>
      value?.toLocaleLowerCase().includes(query)
    );
  });

  return filteredDataSources.sort((a, b) =>
    state.isSortAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );
});

export const getFilteredDataSourcePlugins = memoizeOne((state: DataSourcesState) => {
  const query = state.dataSourceTypeSearchQuery.trim().toLocaleLowerCase();

  return state.plugins.filter((type: DataSourcePluginMeta) => {
    return [type.name, type.id].some((value) => value?.toLocaleLowerCase().includes(query));
  });
});

export const getDataSource = (state: DataSourcesState, dataSourceId: UrlQueryValue): DataSourceSettings => {
  if (state.dataSource.uid === dataSourceId) {
    return state.dataSource;
  }
  return {} as DataSourceSettings;
};

export const getDataSourceMeta = (state: DataSourcesState, type: string): DataSourcePluginMeta => {
  if (state.dataSourceMeta.id === type) {
    return state.dataSourceMeta;
  }

  return {} as DataSourcePluginMeta;
};

export const getDataSourcesSearchQuery = (state: DataSourcesState) => state.searchQuery;
export const getDataSourcesLayoutMode = (state: DataSourcesState) => state.layoutMode;
export const getDataSourcesCount = (state: DataSourcesState) => state.dataSourcesCount;
export const getDataSourcesSort = (state: DataSourcesState) => state.isSortAscending;
