import { useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { OrgRole } from '@grafana/data';
import { ConfirmModal, FilterInput, LinkButton, EmptyState } from '@grafana/ui';
import config from 'app/core/config';
import { contextSrv } from 'app/core/core';
import { t, Trans } from 'app/core/internationalization';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';
import { WallChoice } from 'app/features/wall-modern/management/WallChoice';
import { StoreState, ServiceAccountDTO, AccessControlAction, ServiceAccountStateFilter } from 'app/types';

import { ServiceAccountTable } from './ServiceAccountTable';
import { CreateTokenModal, ServiceAccountToken } from './components/CreateTokenModal';
import {
  changeQuery,
  changePage,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
} from './state/actions';

interface OwnProps {}

export type Props = OwnProps & ConnectedProps<typeof connector>;

function mapStateToProps(state: StoreState) {
  return {
    ...state.serviceAccounts,
  };
}

const mapDispatchToProps = {
  changePage,
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

const availableFilters = [
  { label: t('ablestack-wall.common.all', 'All'), value: ServiceAccountStateFilter.All },
  {
    label: t('ablestack-wall.administration.service-and-access.with-expired-tokens', 'With expired tokens'),
    value: ServiceAccountStateFilter.WithExpiredTokens,
  },
  { label: t('ablestack-wall.common.disabled', 'Disabled'), value: ServiceAccountStateFilter.Disabled },
];

if (config.featureToggles.externalServiceAccounts) {
  availableFilters.push({ label: 'Managed', value: ServiceAccountStateFilter.External });
}

export const ServiceAccountsListPageUnconnected = ({
  page,
  changePage,
  totalPages,
  serviceAccounts,
  isLoading,
  roleOptions,
  query,
  serviceAccountStateFilter,
  changeQuery,
  fetchACOptions,
  fetchServiceAccounts,
  deleteServiceAccount,
  updateServiceAccount,
  changeStateFilter,
  createServiceAccountToken,
}: Props): JSX.Element => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [currentServiceAccount, setCurrentServiceAccount] = useState<ServiceAccountDTO | null>(null);

  useEffect(() => {
    fetchServiceAccounts({ withLoadingIndicator: true });
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  }, [fetchACOptions, fetchServiceAccounts]);

  const noServiceAccountsCreated =
    serviceAccounts.length === 0 && serviceAccountStateFilter === ServiceAccountStateFilter.All && !query;

  const onRoleChange = async (role: OrgRole, serviceAccount: ServiceAccountDTO) => {
    const updatedServiceAccount = { ...serviceAccount, role: role };
    updateServiceAccount(updatedServiceAccount);
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchACOptions();
    }
  };

  const onQueryChange = (value: string) => {
    changeQuery(value);
  };

  const onStateFilterChange = (value: ServiceAccountStateFilter) => {
    changeStateFilter(value);
  };

  const onRemoveButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsRemoveModalOpen(true);
  };

  const onServiceAccountRemove = async () => {
    if (currentServiceAccount) {
      deleteServiceAccount(currentServiceAccount.id);
    }
    onRemoveModalClose();
  };

  const onDisableButtonClick = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsDisableModalOpen(true);
  };

  const onDisable = () => {
    if (currentServiceAccount) {
      updateServiceAccount({ ...currentServiceAccount, isDisabled: true });
    }
    onDisableModalClose();
  };

  const onEnable = (serviceAccount: ServiceAccountDTO) => {
    updateServiceAccount({ ...serviceAccount, isDisabled: false });
  };

  const onTokenAdd = (serviceAccount: ServiceAccountDTO) => {
    setCurrentServiceAccount(serviceAccount);
    setIsAddModalOpen(true);
  };

  const onTokenCreate = async (token: ServiceAccountToken) => {
    if (currentServiceAccount) {
      createServiceAccountToken(currentServiceAccount.id, token, setNewToken);
    }
  };

  const onAddModalClose = () => {
    setIsAddModalOpen(false);
    setCurrentServiceAccount(null);
    setNewToken('');
  };

  const onRemoveModalClose = () => {
    setIsRemoveModalOpen(false);
    setCurrentServiceAccount(null);
  };

  const onDisableModalClose = () => {
    setIsDisableModalOpen(false);
    setCurrentServiceAccount(null);
  };

  return (
    <WallAdminPage
      navId="serviceaccounts"
      description="자동화와 외부 애플리케이션이 Wall API를 사용하도록 계정과 토큰을 관리합니다."
      actions={
        <>
          {contextSrv.hasPermission(AccessControlAction.ServiceAccountsCreate) && (
            <LinkButton href="org/serviceaccounts/create" variant="primary">
              {t('ablestack-wall.administration.service-and-access.add-service-account', 'Add service account')}
            </LinkButton>
          )}
        </>
      }
    >
      <div>
        <div className="page-action-bar">
          <FilterInput
            aria-label="서비스 계정 검색"
            placeholder="이름으로 서비스 계정 검색"
            value={query}
            onChange={onQueryChange}
          />
          <WallChoice
            label="서비스 계정 상태"
            value={serviceAccountStateFilter}
            options={availableFilters}
            onChange={(value) => {
              const selected = availableFilters.find((filter) => filter.value === value);
              if (selected) {
                onStateFilterChange(selected.value);
              }
            }}
          />
        </div>
        {!isLoading && !noServiceAccountsCreated && serviceAccounts.length === 0 && (
          <EmptyState
            variant="not-found"
            message={t('service-accounts.empty-state.message', 'No services accounts found')}
          />
        )}
        {!isLoading && noServiceAccountsCreated && (
          <EmptyState variant="not-found" message="서비스 계정이 없습니다.">
            <Trans i18nKey="wall.enterprise.text-c537b379">API 접근이 필요한 경우 서비스 계정을 추가하세요.</Trans>
          </EmptyState>
        )}

        {(isLoading || serviceAccounts.length !== 0) && (
          <ServiceAccountTable
            services={serviceAccounts}
            showPaging={true}
            totalPages={totalPages}
            onChangePage={changePage}
            currentPage={page}
            onRoleChange={onRoleChange}
            roleOptions={roleOptions}
            onRemoveButtonClick={onRemoveButtonClick}
            onDisable={onDisableButtonClick}
            onEnable={onEnable}
            onAddTokenClick={onTokenAdd}
            isLoading={isLoading}
          />
        )}
        {currentServiceAccount && (
          <>
            <ConfirmModal
              isOpen={isRemoveModalOpen}
              body={`${currentServiceAccount.name} 서비스 계정과 연결된 토큰 ${currentServiceAccount.tokens ?? 0}개를 삭제합니다. 이 계정의 API 접근이 중단됩니다.`}
              confirmText="삭제"
              title="서비스 계정 삭제"
              onConfirm={onServiceAccountRemove}
              onDismiss={onRemoveModalClose}
            />
            <ConfirmModal
              isOpen={isDisableModalOpen}
              title={t(
                'ablestack-wall.administration.service-and-access.disable-service-account',
                'Disable service account'
              )}
              body={t(
                'ablestack-wall.administration.service-and-access.confirm-disable',
                `서비스 계정 ${currentServiceAccount.name}을 비활성화하면 이 계정의 토큰을 사용할 수 없습니다.`
              )}
              confirmText={t(
                'ablestack-wall.administration.service-and-access.disable-service-account',
                'Disable service account'
              )}
              onConfirm={onDisable}
              onDismiss={onDisableModalClose}
            />
            <CreateTokenModal
              isOpen={isAddModalOpen}
              token={newToken}
              serviceAccountLogin={currentServiceAccount.login}
              onCreateToken={onTokenCreate}
              onClose={onAddModalClose}
            />
          </>
        )}
      </div>
    </WallAdminPage>
  );
};

const ServiceAccountsListPage = connector(ServiceAccountsListPageUnconnected);
export default ServiceAccountsListPage;
