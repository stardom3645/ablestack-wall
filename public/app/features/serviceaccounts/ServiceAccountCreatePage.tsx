import { useCallback, useEffect, useState } from 'react';

import { getBackendSrv, locationService } from '@grafana/runtime';
import { Button, Input, Field, FieldSet } from '@grafana/ui';
import { Form } from 'app/core/components/Form/Form';
import { UserRolePicker } from 'app/core/components/RolePicker/UserRolePicker';
import { fetchRoleOptions, updateUserRoles } from 'app/core/components/RolePicker/api';
import { contextSrv } from 'app/core/core';
import { t } from 'app/core/internationalization';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';
import { AccessControlAction, OrgRole, Role, ServiceAccountCreateApiResponse, ServiceAccountDTO } from 'app/types';

import { WallUserRolePicker } from '../admin/Users/WallUsers';

export interface Props {}

const createServiceAccount = async (sa: ServiceAccountDTO) => {
  const result = await getBackendSrv().post('/api/serviceaccounts/', sa);
  await contextSrv.fetchUserPermissions();
  return result;
};

const updateServiceAccount = async (id: number, sa: ServiceAccountDTO) =>
  getBackendSrv().patch(`/api/serviceaccounts/${id}`, sa);

export const ServiceAccountCreatePage = ({}: Props): JSX.Element => {
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [pendingRoles, setPendingRoles] = useState<Role[]>([]);

  const currentOrgId = contextSrv.user.orgId;
  const [serviceAccount, setServiceAccount] = useState<ServiceAccountDTO>({
    id: 0,
    orgId: contextSrv.user.orgId,
    role: contextSrv.licensedAccessControlEnabled() ? OrgRole.None : OrgRole.Viewer,
    tokens: 0,
    name: '',
    login: '',
    isDisabled: false,
    createdAt: '',
    teams: [],
  });

  useEffect(() => {
    async function fetchOptions() {
      try {
        if (contextSrv.hasPermission(AccessControlAction.ActionRolesList)) {
          let options = await fetchRoleOptions(currentOrgId);
          setRoleOptions(options);
        }
      } catch (e) {
        console.error('Error loading options', e);
      }
    }
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchOptions();
    }
  }, [currentOrgId]);

  const onSubmit = useCallback(
    async (data: ServiceAccountDTO) => {
      data.role = serviceAccount.role;
      const response = await createServiceAccount(data);
      try {
        const newAccount: ServiceAccountCreateApiResponse = {
          avatarUrl: response.avatarUrl,
          id: response.id,
          isDisabled: response.isDisabled,
          login: response.login,
          name: response.name,
          orgId: response.orgId,
          role: response.role,
          tokens: response.tokens,
        };
        await updateServiceAccount(response.id, data);
        if (
          contextSrv.licensedAccessControlEnabled() &&
          contextSrv.hasPermission(AccessControlAction.ActionUserRolesAdd) &&
          contextSrv.hasPermission(AccessControlAction.ActionUserRolesRemove)
        ) {
          await updateUserRoles(pendingRoles, newAccount.id, newAccount.orgId);
        }
      } catch (e) {
        console.error(e);
      }
      locationService.push(`/org/serviceaccounts/${response.id}`);
    },
    [serviceAccount.role, pendingRoles]
  );

  const onRoleChange = (role: OrgRole) => {
    setServiceAccount({
      ...serviceAccount,
      role: role,
    });
  };

  const onPendingRolesUpdate = (roles: Role[], userId: number, orgId: number | undefined) => {
    // keep the new role assignments for user
    setPendingRoles(roles);
  };

  return (
    <WallAdminPage
      navId="serviceaccounts"
      title="서비스 계정 추가"
      description="API 접근용 계정을 생성합니다. 토큰은 계정을 만든 후 발급할 수 있습니다."
    >
      <div className="wall-admin-form">
        <Form onSubmit={onSubmit} validateOn="onSubmit">
          {({ register, errors }) => {
            return (
              <>
                <FieldSet>
                  <Field
                    label={t('ablestack-wall.common.display-name', 'Display name')}
                    required
                    invalid={!!errors.name}
                    error={errors.name ? 'Display name is required' : undefined}
                  >
                    <Input id="display-name-input" {...register('name', { required: true })} autoFocus />
                  </Field>
                  <Field label={t('ablestack-wall.common.role', 'Role')}>
                    {contextSrv.licensedAccessControlEnabled() ? (
                      <UserRolePicker
                        apply
                        userId={serviceAccount.id || 0}
                        orgId={serviceAccount.orgId}
                        basicRole={serviceAccount.role}
                        onBasicRoleChange={onRoleChange}
                        roleOptions={roleOptions}
                        onApplyRoles={onPendingRolesUpdate}
                        pendingRoles={pendingRoles}
                        maxWidth="100%"
                      />
                    ) : (
                      <WallUserRolePicker
                        login="새 서비스 계정"
                        value={serviceAccount.role}
                        onChange={onRoleChange}
                        disabled={false}
                      />
                    )}
                  </Field>
                </FieldSet>
                <Button type="submit">{t('ablestack-wall.common.create', 'Create')}</Button>
              </>
            );
          }}
        </Form>
      </div>
    </WallAdminPage>
  );
};

export default ServiceAccountCreatePage;
