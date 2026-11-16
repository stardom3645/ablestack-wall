import { useCallback, useEffect, useState, ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { renderMarkdown } from '@grafana/data';
import { Alert } from '@grafana/ui';
import { Page } from 'app/core/components/Page/Page';
import { contextSrv } from 'app/core/core';
import { OrgUser, OrgRole, StoreState } from 'app/types';

import { OrgUsersTable } from '../admin/Users/OrgUsersTable';
import { WallUsersRegion, UsersWorkspace, UsersPageFrame } from '../admin/Users/WallUsers';
import InviteesTable from '../invites/InviteesTable';
import { fetchInvitees } from '../invites/state/actions';
import { selectInvitesMatchingQuery } from '../invites/state/selectors';

import { UsersActionBar } from './UsersActionBar';
import { loadUsers, removeUser, updateUser, changePage, changeSort } from './state/actions';
import { getUsers, getUsersSearchQuery } from './state/selectors';

function mapStateToProps(state: StoreState) {
  const searchQuery = getUsersSearchQuery(state.users);
  return {
    users: getUsers(state.users),
    searchQuery: getUsersSearchQuery(state.users),
    page: state.users.page,
    totalPages: state.users.totalPages,
    totalCount: state.users.totalCount,
    sort: state.users.sort,
    perPage: state.users.perPage,
    invitees: selectInvitesMatchingQuery(state.invites, searchQuery),
    externalUserMngInfo: state.users.externalUserMngInfo,
    isLoading: state.users.isLoading,
    rolesLoading: state.users.rolesLoading,
  };
}

const mapDispatchToProps = {
  loadUsers,
  fetchInvitees,
  changePage,
  changeSort,
  updateUser,
  removeUser,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = ConnectedProps<typeof connector> & { navigation?: ReactNode };

export interface State {
  showInvites: boolean;
}

export const UsersListPageUnconnected = ({
  users,
  navigation,
  page,
  totalPages,
  totalCount,
  perPage,
  sort,
  invitees,
  externalUserMngInfo,
  isLoading,
  rolesLoading,
  loadUsers,
  fetchInvitees,
  changePage,
  updateUser,
  removeUser,
  changeSort,
}: Props) => {
  const [showInvites, setShowInvites] = useState(false);
  const externalUserMngInfoHtml = externalUserMngInfo ? renderMarkdown(externalUserMngInfo) : '';

  useEffect(() => {
    loadUsers();
    fetchInvitees();
  }, [fetchInvitees, loadUsers]);

  const onRoleChange = useCallback(
    (role: OrgRole, user: OrgUser) => {
      updateUser({ ...user, role: role });
    },
    [updateUser]
  );

  const onRemoveUser = useCallback((user: OrgUser) => removeUser(user.userId), [removeUser]);

  const onShowInvites = useCallback(() => setShowInvites((value) => !value), []);

  const onUserRolesChange = useCallback(() => {
    loadUsers();
  }, [loadUsers]);

  const renderTable = () => {
    if (showInvites) {
      return <InviteesTable invitees={invitees} />;
    } else {
      return (
        <OrgUsersTable
          wallPresentation
          users={users}
          orgId={contextSrv.user.orgId}
          rolesLoading={rolesLoading}
          onRoleChange={onRoleChange}
          onRemoveUser={onRemoveUser}
          onUserRolesChange={onUserRolesChange}
          fetchData={changeSort}
          changePage={changePage}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          perPage={perPage}
        />
      );
    }
  };

  return (
    <Page.Contents isLoading={totalCount === undefined && !isLoading}>
      <WallUsersRegion>
        <UsersWorkspace>
          <UsersActionBar
            navigation={navigation}
            onShowInvites={onShowInvites}
            showInvites={showInvites}
            totalCount={totalCount}
            visibleInvitesCount={invitees.length}
            sort={sort}
            onSort={changeSort}
          />
          {externalUserMngInfoHtml && (
            <Alert severity="info" title="">
              <div dangerouslySetInnerHTML={{ __html: externalUserMngInfoHtml }} />
            </Alert>
          )}
          {isLoading && renderTable()}
        </UsersWorkspace>
      </WallUsersRegion>
    </Page.Contents>
  );
};

export const UsersListPageContent = connector(UsersListPageUnconnected);

export default function UsersListPage() {
  return (
    <UsersPageFrame navId="users">
      <UsersListPageContent />
    </UsersPageFrame>
  );
}
