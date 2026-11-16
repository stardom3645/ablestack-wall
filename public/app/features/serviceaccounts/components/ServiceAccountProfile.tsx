import { useState, useEffect } from 'react';

import { dateTimeFormat, OrgRole, TimeZone } from '@grafana/data';
import { Label, TextLink } from '@grafana/ui';
import { fetchRoleOptions } from 'app/core/components/RolePicker/api';
import { contextSrv } from 'app/core/core';
import { t, Trans } from 'app/core/internationalization';
import { AccessControlAction, Role, ServiceAccountDTO } from 'app/types';

import { ServiceAccountProfileRow } from './ServiceAccountProfileRow';
import { ServiceAccountRoleRow } from './ServiceAccountRoleRow';

interface Props {
  serviceAccount: ServiceAccountDTO;
  timeZone: TimeZone;
  onChange: (serviceAccount: ServiceAccountDTO) => void;
}

export function ServiceAccountProfile({ serviceAccount, timeZone, onChange }: Props): JSX.Element {
  const ableToWrite = contextSrv.hasPermission(AccessControlAction.ServiceAccountsWrite);
  const [roles, setRoleOptions] = useState<Role[]>([]);

  const onRoleChange = (role: OrgRole) => {
    onChange({ ...serviceAccount, role: role });
  };

  const onNameChange = (newValue: string) => {
    onChange({ ...serviceAccount, name: newValue });
  };

  useEffect(() => {
    async function fetchOptions() {
      try {
        if (contextSrv.hasPermission(AccessControlAction.ActionRolesList)) {
          let options = await fetchRoleOptions(serviceAccount.orgId);
          setRoleOptions(options);
        }
      } catch (e) {
        console.error('Error loading options for service account');
      }
    }
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchOptions();
    }
  }, [serviceAccount.orgId]);

  return (
    <div>
      <div className="wall-service-profile" role="group" aria-label="서비스 계정 정보">
        <ServiceAccountProfileRow
          label={t('ablestack-wall.common.name', 'Name')}
          value={serviceAccount.name}
          onChange={!serviceAccount.isExternal ? onNameChange : undefined}
          disabled={!ableToWrite || serviceAccount.isDisabled}
        />
        <ServiceAccountProfileRow label="ID" value={serviceAccount.login} disabled={serviceAccount.isDisabled} />
        <ServiceAccountRoleRow
          label={t('ablestack-wall.common.roles', 'Roles')}
          serviceAccount={serviceAccount}
          onRoleChange={onRoleChange}
          roleOptions={roles}
        />
        <ServiceAccountProfileRow
          label={t('ablestack-wall.common.creation-date', 'Creation date')}
          value={dateTimeFormat(serviceAccount.createdAt, { timeZone })}
          disabled={serviceAccount.isDisabled}
        />
        {serviceAccount.isExternal && serviceAccount.requiredBy && (
          <div className="wall-service-profile-row">
            <div>
              <Label>
                <Trans i18nKey="wall.enterprise.text-f5060abc">Used by</Trans>
              </Label>
            </div>
            <div>
              <TextLink href={`/plugins/${serviceAccount.requiredBy}`}>{serviceAccount.requiredBy}</TextLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
