import { useDataSourceSettingsNav } from 'app/features/connections/hooks/useDataSourceSettingsNav';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';

import { EditDataSource } from '../components/EditDataSource';
import { EditDataSourceActions } from '../components/EditDataSourceActions';
import { useDataSourceInfo } from '../components/useDataSourceInfo';

export interface Props {
  uid: string;
  pageId: string | null;
}

export function DataSourceTabPage({ uid, pageId }: Props) {
  const { navId, pageNav, dataSourceHeader } = useDataSourceSettingsNav();

  const info = useDataSourceInfo({
    dataSourcePluginName: pageNav.dataSourcePluginName,
    alertingSupported: dataSourceHeader.alertingSupported,
  });

  return (
    <WallAdminPage
      navId={navId}
      detailNav={pageNav}
      description={pageNav.subTitle}
      info={info}
      actions={<EditDataSourceActions uid={uid} />}
    >
      <EditDataSource uid={uid} pageId={pageId} />
    </WallAdminPage>
  );
}

export default DataSourceTabPage;
