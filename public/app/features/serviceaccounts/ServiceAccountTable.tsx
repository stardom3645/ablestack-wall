import { KeyRound, MoreHorizontal } from 'lucide-react';

import { LoadingPlaceholder, Pagination } from '@grafana/ui';
import { UserRolePicker } from 'app/core/components/RolePicker/UserRolePicker';
import { contextSrv } from 'app/core/core';
import { Trans } from 'app/core/internationalization';
import { WallUserRolePicker } from 'app/features/admin/Users/WallUsers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'app/features/wall-modern/components/ui/dropdown-menu';
import { Button } from 'app/features/wall-modern/ui';
import { AccessControlAction, OrgRole, Role, ServiceAccountDTO } from 'app/types';

interface ServiceAccountTableProps {
  services: ServiceAccountDTO[];
  onRoleChange: (role: OrgRole, serviceAccount: ServiceAccountDTO) => void;
  roleOptions: Role[];
  onRemoveButtonClick: (account: ServiceAccountDTO) => void;
  onDisable: (account: ServiceAccountDTO) => void;
  onEnable: (account: ServiceAccountDTO) => void;
  onAddTokenClick: (account: ServiceAccountDTO) => void;
  showPaging?: boolean;
  totalPages: number;
  onChangePage: (page: number) => void;
  currentPage: number;
  isLoading: boolean;
}
export const ServiceAccountTable = ({
  services,
  onRoleChange,
  roleOptions,
  onRemoveButtonClick,
  onDisable,
  onEnable,
  onAddTokenClick,
  showPaging,
  totalPages,
  onChangePage,
  currentPage,
  isLoading,
}: ServiceAccountTableProps) => {
  if (isLoading) {
    return <LoadingPlaceholder text="서비스 계정 불러오는 중" />;
  }
  return (
    <>
      <ul className="wall-service-list" aria-label="서비스 계정 목록">
        {services.map((account) => {
          const writable = contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsWrite, account);
          const removable = contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsDelete, account);
          const rolesVisible =
            contextSrv.hasPermission(AccessControlAction.ActionRolesList) &&
            contextSrv.hasPermission(AccessControlAction.ActionUserRolesList);
          const canManage = !account.isExternal && (writable || removable);
          return (
            <li className="wall-service-account" key={account.id}>
              <div className="wall-service-main">
                <span className="wall-service-mark" aria-hidden="true">
                  <KeyRound size={18} />
                </span>
                <div className="wall-service-identity">
                  <a href={`/org/serviceaccounts/${account.id}`} title={account.name}>
                    {account.name}
                  </a>
                  <small title={account.login}>{account.login}</small>
                </div>
                {contextSrv.licensedAccessControlEnabled() ? (
                  rolesVisible && (
                    <UserRolePicker
                      userId={account.id}
                      orgId={account.orgId}
                      basicRole={account.role}
                      roles={account.roles || []}
                      onBasicRoleChange={(role) => onRoleChange(role, account)}
                      roleOptions={roleOptions}
                      basicRoleDisabled={!writable}
                      disabled={account.isExternal || account.isDisabled}
                      width={30}
                    />
                  )
                ) : (
                  <WallUserRolePicker
                    login={account.name}
                    value={account.role}
                    disabled={Boolean(account.isExternal || account.isDisabled || !writable)}
                    reason={
                      account.isExternal
                        ? '외부에서 관리하는 계정입니다.'
                        : account.isDisabled
                          ? '비활성 계정의 권한은 변경할 수 없습니다.'
                          : '권한 변경이 허용되지 않습니다.'
                    }
                    onChange={(role) => onRoleChange(role, account)}
                  />
                )}
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon" />}
                      aria-label={`${account.name} 서비스 계정 작업`}
                    >
                      <MoreHorizontal size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {writable && !account.tokens && (
                        <DropdownMenuItem disabled={account.isDisabled} onClick={() => onAddTokenClick(account)}>
                          <Trans i18nKey="wall.admin.add-token">토큰 추가</Trans>
                        </DropdownMenuItem>
                      )}
                      {writable && (
                        <DropdownMenuItem onClick={() => (account.isDisabled ? onEnable(account) : onDisable(account))}>
                          {account.isDisabled ? '활성화' : '비활성화'}
                        </DropdownMenuItem>
                      )}
                      {removable && (
                        <DropdownMenuItem className="wall-user-danger" onClick={() => onRemoveButtonClick(account)}>
                          <Trans i18nKey="wall.admin.delete-service">서비스 계정 삭제</Trans>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="wall-service-meta">
                <span>{account.isDisabled ? '비활성' : '사용 가능'}</span>
                <a href={`/org/serviceaccounts/${account.id}`}>
                  <Trans i18nKey="wall.admin.token-count" values={{ count: account.tokens ?? 0 }}>
                    토큰 {{ count: account.tokens ?? 0 }}개
                  </Trans>
                </a>
                {account.isExternal && (
                  <span>
                    <Trans i18nKey="wall.admin.externally-managed">외부 관리</Trans>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {showPaging && totalPages > 1 && (
        <Pagination numberOfPages={totalPages} currentPage={currentPage} onNavigate={onChangePage} />
      )}
    </>
  );
};
ServiceAccountTable.displayName = 'ServiceAccountTable';
