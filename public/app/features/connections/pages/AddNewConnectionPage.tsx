import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';

import { AddNewConnection } from '../tabs/ConnectData';

export function AddNewConnectionPage() {
  return (
    <WallAdminPage
      navId="connections-add-new-connection"
      wide
      description="데이터에 연결할 유형을 선택하고 기존 설정 화면에서 연결을 구성합니다."
    >
      <AddNewConnection />
    </WallAdminPage>
  );
}
