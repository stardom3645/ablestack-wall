import { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useParams } from 'react-router-dom-v5-compat';

import { getTimeZone } from '@grafana/data';
import { ConfirmModal } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { t, Trans } from 'app/core/internationalization';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';
import { Button } from 'app/features/wall-modern/ui';
import { AccessControlAction, ApiKey, ServiceAccountDTO, StoreState } from 'app/types';

import { ServiceAccountPermissions } from './ServiceAccountPermissions';
import { CreateTokenModal, ServiceAccountToken } from './components/CreateTokenModal';
import { ServiceAccountProfile } from './components/ServiceAccountProfile';
import { ServiceAccountTokensTable } from './components/ServiceAccountTokensTable';
import { fetchACOptions } from './state/actions';
import {
  createServiceAccountToken,
  deleteServiceAccount,
  deleteServiceAccountToken,
  loadServiceAccount,
  loadServiceAccountTokens,
  updateServiceAccount,
} from './state/actionsServiceAccountPage';

interface OwnProps {
  serviceAccount?: ServiceAccountDTO;
  tokens: ApiKey[];
  isLoading: boolean;
}

function mapStateToProps(state: StoreState) {
  return {
    serviceAccount: state.serviceAccountProfile.serviceAccount,
    tokens: state.serviceAccountProfile.tokens,
    isLoading: state.serviceAccountProfile.isLoading,
    timezone: getTimeZone(state.user),
  };
}

const mapDispatchToProps = {
  createServiceAccountToken,
  deleteServiceAccount,
  deleteServiceAccountToken,
  loadServiceAccount,
  loadServiceAccountTokens,
  updateServiceAccount,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = OwnProps & ConnectedProps<typeof connector>;

export const ServiceAccountPageUnconnected = ({
  serviceAccount,
  tokens,
  timezone,
  isLoading,
  createServiceAccountToken,
  deleteServiceAccount,
  deleteServiceAccountToken,
  loadServiceAccount,
  loadServiceAccountTokens,
  updateServiceAccount,
}: Props): JSX.Element => {
  const [newToken, setNewToken] = useState('');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const { id = '' } = useParams();

  const serviceAccountId = parseInt(id, 10);
  const tokenActionsDisabled =
    serviceAccount.isDisabled ||
    serviceAccount.isExternal ||
    !contextSrv.hasPermission(AccessControlAction.ServiceAccountsWrite);

  const ableToWrite = contextSrv.hasPermission(AccessControlAction.ServiceAccountsWrite);
  const canReadPermissions = contextSrv.hasPermissionInMetadata(
    AccessControlAction.ServiceAccountsPermissionsRead,
    serviceAccount!
  );

  useEffect(() => {
    loadServiceAccount(serviceAccountId);
    loadServiceAccountTokens(serviceAccountId);
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  }, [loadServiceAccount, loadServiceAccountTokens, serviceAccountId]);

  const onProfileChange = (serviceAccount: ServiceAccountDTO) => {
    updateServiceAccount(serviceAccount);
  };

  const showDeleteServiceAccountModal = (show: boolean) => () => {
    setIsDeleteModalOpen(show);
  };

  const showDisableServiceAccountModal = (show: boolean) => () => {
    setIsDisableModalOpen(show);
  };

  const handleServiceAccountDelete = () => {
    deleteServiceAccount(serviceAccount.id);
  };

  const handleServiceAccountDisable = () => {
    updateServiceAccount({ ...serviceAccount, isDisabled: true });
    setIsDisableModalOpen(false);
  };

  const handleServiceAccountEnable = () => {
    updateServiceAccount({ ...serviceAccount, isDisabled: false });
  };

  const onDeleteServiceAccountToken = (key: ApiKey) => {
    deleteServiceAccountToken(serviceAccount?.id, key.id!);
  };

  const onCreateToken = (token: ServiceAccountToken) => {
    createServiceAccountToken(serviceAccount?.id, token, setNewToken);
  };

  const onTokenModalClose = () => {
    setIsTokenModalOpen(false);
    setNewToken('');
  };

  return (
    <WallAdminPage
      navId="serviceaccounts"
      title={serviceAccount.name}
      isLoading={isLoading}
      description="서비스 계정의 권한, 상태 및 API 토큰을 관리합니다."
      context={
        serviceAccount.id && !isLoading ? (
          <>
            <span>{serviceAccount.isDisabled ? '사용 중지' : '사용 가능'}</span>
            {serviceAccount.isExternal && (
              <span>
                <Trans i18nKey="wall.enterprise.text-076ad705">외부에서 관리됨</Trans>
              </span>
            )}
          </>
        ) : undefined
      }
    >
      <div aria-busy={isLoading}>
        <section className="wall-admin-section">
          <header>
            <h2>
              <Trans i18nKey="wall.enterprise.text-ddd297db">계정 정보</Trans>
            </h2>
            <p>
              <Trans i18nKey="wall.enterprise.text-c629013f">이름과 기본 역할을 확인하고 관리합니다.</Trans>
            </p>
          </header>
          {serviceAccount && (
            <ServiceAccountProfile serviceAccount={serviceAccount} timeZone={timezone} onChange={onProfileChange} />
          )}
        </section>
        <section className="wall-admin-section">
          <header className="wall-admin-section-heading">
            <div>
              <h2>
                <Trans i18nKey="wall.enterprise.text-066199f3">API 토큰</Trans>
              </h2>
              <p>
                <Trans i18nKey="wall.enterprise.text-5580449f">
                  자동화와 외부 애플리케이션에서 사용하는 접근 토큰입니다.
                </Trans>
              </p>
            </div>
            {!serviceAccount.isExternal && (
              <Button variant="outline" onClick={() => setIsTokenModalOpen(true)} disabled={tokenActionsDisabled}>
                {t(
                  'ablestack-wall.administration.service-and-access.add-service-account-token',
                  'Add service account token'
                )}
              </Button>
            )}
          </header>
          {tokens && (
            <ServiceAccountTokensTable
              tokens={tokens}
              timeZone={timezone}
              onDelete={onDeleteServiceAccountToken}
              tokenActionsDisabled={tokenActionsDisabled}
            />
          )}
        </section>
        {!serviceAccount.isExternal && canReadPermissions && (
          <section className="wall-admin-section">
            <header>
              <h2>
                <Trans i18nKey="wall.enterprise.text-0df08157">계정 접근 권한</Trans>
              </h2>
              <p>
                <Trans i18nKey="wall.enterprise.text-03d09892">
                  이 서비스 계정을 관리할 수 있는 사용자와 역할입니다.
                </Trans>
              </p>
            </header>
            <ServiceAccountPermissions serviceAccount={serviceAccount} />
          </section>
        )}
        {serviceAccount && !serviceAccount.isExternal && (
          <section className="wall-admin-section wall-admin-danger-zone">
            <header>
              <h2>
                <Trans i18nKey="wall.enterprise.text-01574b26">계정 상태 및 삭제</Trans>
              </h2>
              <p>
                <Trans i18nKey="wall.enterprise.text-85487b69">
                  비활성화하면 토큰을 사용할 수 없습니다. 삭제한 계정과 토큰은 복구할 수 없습니다.
                </Trans>
              </p>
            </header>
            <div className="wall-admin-actions">
              {serviceAccount.isDisabled ? (
                <Button variant="outline" onClick={handleServiceAccountEnable} disabled={!ableToWrite}>
                  {t(
                    'ablestack-wall.administration.service-and-access.enable-service-account',
                    'Enable service account'
                  )}
                </Button>
              ) : (
                <Button variant="outline" onClick={showDisableServiceAccountModal(true)} disabled={!ableToWrite}>
                  {t(
                    'ablestack-wall.administration.service-and-access.disable-service-account',
                    'Disable service account'
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                className="wall-admin-danger"
                onClick={showDeleteServiceAccountModal(true)}
                disabled={!contextSrv.hasPermission(AccessControlAction.ServiceAccountsDelete)}
              >
                {t('ablestack-wall.administration.service-and-access.delete-service-account', 'Delete service account')}
              </Button>
            </div>
          </section>
        )}

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title={t('ablestack-wall.administration.service-and-access.delete-service-account', 'Delete service account')}
          body={t(
            'ablestack-wall.administration.service-and-access.confirm-delete-service-account',
            'Are you sure you want to delete this service account?'
          )}
          confirmText={t(
            'ablestack-wall.administration.service-and-access.delete-service-account',
            'Delete service account'
          )}
          onConfirm={handleServiceAccountDelete}
          onDismiss={showDeleteServiceAccountModal(false)}
        />
        <ConfirmModal
          isOpen={isDisableModalOpen}
          title={t(
            'ablestack-wall.administration.service-and-access.disable-service-account',
            'Disable service account'
          )}
          body={`서비스 계정 ${serviceAccount.name}을 비활성화하면 이 계정의 토큰을 사용할 수 없습니다.`}
          confirmText={t(
            'ablestack-wall.administration.service-and-access.disable-service-account',
            'Disable service account'
          )}
          onConfirm={handleServiceAccountDisable}
          onDismiss={showDisableServiceAccountModal(false)}
        />
        <CreateTokenModal
          isOpen={isTokenModalOpen}
          token={newToken}
          serviceAccountLogin={serviceAccount.login}
          onCreateToken={onCreateToken}
          onClose={onTokenModalClose}
        />
      </div>
    </WallAdminPage>
  );
};

export default connector(ServiceAccountPageUnconnected);
