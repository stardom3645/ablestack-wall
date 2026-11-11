import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { t } from 'app/core/internationalization';

import { getMockDataSources } from '../__mocks__';

import { DataSourcesListView } from './DataSourcesList';

const setup = () => {
  return render(
    <DataSourcesListView
      dataSources={getMockDataSources(3)}
      dataSourcesCount={3}
      isLoading={false}
      hasCreateRights={true}
      hasWriteRights={true}
      hasExploreRights={true}
    />
  );
};

describe('<DataSourcesList>', () => {
  it('should render action bar', async () => {
    setup();

    expect(
      await screen.findByPlaceholderText(t('ablestack-wall.alert.search-by-name-or-type', 'Search by name or type'))
    ).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: 'Sort' })).toBeInTheDocument();
  });

  it('should render list of datasources', async () => {
    setup();

    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
    expect(await screen.findAllByRole('heading')).toHaveLength(3);
    expect(await screen.findAllByRole('link', { name: /대시보드 만들기/i })).toHaveLength(3);
    expect(await screen.findAllByRole('link', { name: '데이터 탐색' })).toHaveLength(3);
  });

  it('should render all elements in the list item', async () => {
    setup();

    expect(await screen.findByRole('heading', { name: 'dataSource-0' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'dataSource-0' })).toBeInTheDocument();
  });
});
