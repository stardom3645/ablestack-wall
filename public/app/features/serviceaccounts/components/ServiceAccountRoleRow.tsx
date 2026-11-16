import { Label } from '@grafana/ui';
import { UserRolePicker } from 'app/core/components/RolePicker/UserRolePicker';
import { contextSrv } from 'app/core/core';
import { WallUserRolePicker } from 'app/features/admin/Users/WallUsers';
import { AccessControlAction, OrgRole, Role, ServiceAccountDTO } from 'app/types';

interface Props {
  label: string;
  serviceAccount: ServiceAccountDTO;
  onRoleChange: (role: OrgRole) => void;
  roleOptions: Role[];
}

export const ServiceAccountRoleRow = ({ label, serviceAccount, roleOptions, onRoleChange }: Props): JSX.Element => {
  const inputId = `${label}-input`;
  const canUpdateRole = contextSrv.hasPermissionInMetadata(AccessControlAction.ServiceAccountsWrite, serviceAccount);

  return (
    <div className="wall-service-profile-row">
      <div>
        <Label htmlFor={inputId}>{label}</Label>
      </div>
      {contextSrv.licensedAccessControlEnabled() ? (
        <div className="wall-service-profile-value">
          <UserRolePicker
            userId={serviceAccount.id}
            orgId={serviceAccount.orgId}
            basicRole={serviceAccount.role}
            onBasicRoleChange={onRoleChange}
            roleOptions={roleOptions}
            basicRoleDisabled={!canUpdateRole}
            disabled={serviceAccount.isExternal || serviceAccount.isDisabled}
          />
        </div>
      ) : (
        <>
          <div>
            <WallUserRolePicker
              login={serviceAccount.name}
              value={serviceAccount.role}
              disabled={!canUpdateRole || Boolean(serviceAccount.isExternal) || serviceAccount.isDisabled}
              reason={
                serviceAccount.isExternal
                  ? '외부에서 관리됨'
                  : serviceAccount.isDisabled
                    ? '비활성화된 계정'
                    : !canUpdateRole
                      ? '변경 권한 없음'
                      : undefined
              }
              onChange={onRoleChange}
            />
          </div>
          <div />
        </>
      )}
    </div>
  );
};
