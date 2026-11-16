import { ComponentType, useEffect, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { selectors as e2eSelectors } from '@grafana/e2e-selectors/src';
import { RadioButtonGroup } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/core';
import { t, Trans } from 'app/core/internationalization';
import { Button } from 'app/features/wall-modern/ui';

import { AccessControlAction, StoreState, UserFilter } from '../../types';

import { UsersTable } from './Users/UsersTable';
import {
  WallUsersRegion,
  UsersWorkspace,
  UsersWorkspaceHeader,
  UsersSort,
  UsersSearch,
  UsersListTools,
  UsersPageFrame,
  UsersFilters,
} from './Users/WallUsers';
import { changeFilter, changePage, changeQuery, changeSort, fetchUsers } from './state/actions';

export interface FilterProps {
  filters: UserFilter[];
  onChange: (filter: UserFilter) => void;
  className?: string;
}
const extraFilters: Array<ComponentType<FilterProps>> = [];
export const addExtraFilters = (filter: ComponentType<FilterProps>) => {
  extraFilters.push(filter);
};

const selectors = e2eSelectors.pages.UserListPage.UserListAdminPage;

const mapDispatchToProps = {
  fetchUsers,
  changeQuery,
  changePage,
  changeFilter,
  changeSort,
};

const mapStateToProps = (state: StoreState) => ({
  users: state.userListAdmin.users,
  query: state.userListAdmin.query,
  showPaging: state.userListAdmin.showPaging,
  totalPages: state.userListAdmin.totalPages,
  totalCount: state.userListAdmin.totalCount,
  perPage: state.userListAdmin.perPage,
  sort: state.userListAdmin.sort,
  page: state.userListAdmin.page,
  filters: state.userListAdmin.filters,
  isLoading: state.userListAdmin.isLoading,
});

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps {
  navigation?: ReactNode;
}

type Props = OwnProps & ConnectedProps<typeof connector>;

export const UserListAdminPageUnConnected = ({
  fetchUsers,
  navigation,
  query,
  changeQuery,
  users,
  showPaging,
  changeFilter,
  filters,
  totalPages,
  totalCount,
  perPage,
  sort,
  page,
  changePage,
  changeSort,
  isLoading,
}: Props) => {
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Page.Contents isLoading={isLoading && users.length === 0}>
      <WallUsersRegion>
        <UsersWorkspace testId={selectors.container}>
          <UsersWorkspaceHeader
            description={t('wall.users.server-description', '서버의 사용자 계정과 접근 상태를 관리합니다.')}
            navigation={navigation}
            actions={
              <>
                {contextSrv.hasPermission(AccessControlAction.UsersCreate) && (
                  <Button
                    nativeButton={false}
                    role="link"
                    render={<a href="admin/users/create" aria-label={t('wall.users.create', '사용자 생성')} />}
                    variant="default"
                  >
                    <Trans i18nKey="wall.users.create">사용자 생성</Trans>
                  </Button>
                )}
              </>
            }
          />
          <UsersListTools title={t('wall.users.accounts', '계정')} count={totalCount}>
            <UsersSearch value={query} onChange={changeQuery} />
            <UsersFilters
              active={filters.some(
                (filter) => filter.value === true || (Array.isArray(filter.value) && filter.value.length > 0)
              )}
            >
              <RadioButtonGroup
                options={[
                  { label: t('ablestack-wall.administration.service-and-access.all-user', 'All users'), value: false },
                  {
                    label: t(
                      'ablestack-wall.administration.service-and-access.active-last-30-days',
                      'Active last 30 days'
                    ),
                    value: true,
                  },
                ]}
                onChange={(value) => changeFilter({ name: 'activeLast30Days', value })}
                value={filters.find((f) => f.name === 'activeLast30Days')?.value}
                className="wall-users-filter"
              />
              {extraFilters.map((FilterComponent, index) => (
                <FilterComponent key={index} filters={filters} onChange={changeFilter} className="wall-users-filter" />
              ))}
            </UsersFilters>
            <UsersSort value={sort} onChange={changeSort} />
          </UsersListTools>
          <UsersTable
            users={users}
            showPaging={showPaging}
            totalPages={totalPages}
            totalCount={totalCount}
            perPage={perPage}
            onChangePage={changePage}
            currentPage={page}
          />
        </UsersWorkspace>
      </WallUsersRegion>
    </Page.Contents>
  );
};

export const UserListAdminPageContent = connector(UserListAdminPageUnConnected);

export function UserListAdminPage() {
  return (
    <UsersPageFrame>
      <UserListAdminPageContent />
    </UsersPageFrame>
  );
}

export default UserListAdminPage;
