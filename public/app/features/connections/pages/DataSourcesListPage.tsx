import { DataSourceAddButton } from 'app/features/datasources/components/DataSourceAddButton';
import { DataSourcesList } from 'app/features/datasources/components/DataSourcesList';
import { getDataSourcesCount } from 'app/features/datasources/state';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';
import { StoreState, useSelector } from 'app/types';

export function DataSourcesListPage() {
  const dataSourcesCount = useSelector(({ dataSources }: StoreState) => getDataSourcesCount(dataSources));

  const actions = dataSourcesCount > 0 ? <DataSourceAddButton /> : undefined;
  return (
    <WallAdminPage
      wide
      description="연결된 데이터 소스와 기본 연결을 관리합니다."
      navId={'connections-datasources'}
      actions={actions}
    >
      <DataSourcesList />
    </WallAdminPage>
  );
}
