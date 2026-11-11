import { DataSourcesState } from 'app/types/datasources';

import { getMockDataSource } from '../__mocks__';

import { getDataSources, getFilteredDataSourcePlugins } from './selectors';

it('uses literal searches for names/types, including regex punctuation', () => {
  const ds = getMockDataSource({ name: '운영 [Primary]', type: 'mysql', typeName: 'MySQL' });
  const state = { dataSources: [ds], searchQuery: '[', isSortAscending: true } as DataSourcesState;
  expect(getDataSources(state)).toEqual([ds]);
  expect(getDataSources({ ...state, searchQuery: 'MYSQL' })).toEqual([ds]);
  expect(getDataSources({ ...state, searchQuery: 'absent' })).toEqual([]);
  expect(getFilteredDataSourcePlugins({ ...state, plugins: [], dataSourceTypeSearchQuery: '[' })).toEqual([]);
});
