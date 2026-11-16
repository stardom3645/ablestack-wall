import { ReactNode } from 'react';
import { connect, ConnectedProps } from 'react-redux';

import { RadioButtonGroup } from '@grafana/ui';
import { Button } from 'app/features/wall-modern/ui';
import { StoreState } from 'app/types';

import { t } from '../../core/internationalization';
import {
  UsersWorkspaceHeader,
  UsersSort,
  UsersSortChange,
  UsersSearch,
  UsersListTools,
} from '../admin/Users/WallUsers';
import { selectTotal } from '../invites/state/selectors';

import { changeSearchQuery } from './state/actions';
import { getUsersSearchQuery } from './state/selectors';

export interface OwnProps {
  showInvites: boolean;
  navigation?: ReactNode;
  onShowInvites: () => void;
  totalCount?: number;
  visibleInvitesCount?: number;
  sort?: string;
  onSort?: UsersSortChange;
}

function mapStateToProps(state: StoreState) {
  return {
    searchQuery: getUsersSearchQuery(state.users),
    pendingInvitesCount: selectTotal(state.invites),
    externalUserMngLinkName: state.users.externalUserMngLinkName,
    externalUserMngLinkUrl: state.users.externalUserMngLinkUrl,
  };
}

const mapDispatchToProps = {
  changeSearchQuery,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export type Props = ConnectedProps<typeof connector> & OwnProps;

export const UsersActionBarUnconnected = ({
  externalUserMngLinkName,
  externalUserMngLinkUrl,
  searchQuery,
  pendingInvitesCount,
  changeSearchQuery,
  onShowInvites,
  showInvites,
  navigation,
  totalCount,
  visibleInvitesCount,
  sort,
  onSort,
}: Props): JSX.Element => {
  const options = [
    { label: t('wall.users.users', '사용자'), value: 'users' },
    { label: t('wall.users.pending', '초대 대기 ({{count}})', { count: pendingInvitesCount }), value: 'invites' },
  ];

  return (
    <div data-testid="users-action-bar">
      <UsersWorkspaceHeader
        description={t('wall.users.org-description', '현재 조직의 사용자와 권한을 관리합니다.')}
        navigation={navigation}
        actions={
          <>
            {externalUserMngLinkUrl && (
              <Button
                nativeButton={false}
                role="link"
                render={
                  <a
                    href={externalUserMngLinkUrl}
                    aria-label={externalUserMngLinkName}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {externalUserMngLinkName}
              </Button>
            )}
          </>
        }
      />
      <UsersListTools
        title={showInvites ? t('wall.users.pending-title', '초대 대기') : t('wall.users.accounts', '계정')}
        count={showInvites ? (visibleInvitesCount ?? pendingInvitesCount) : totalCount}
      >
        <UsersSearch value={searchQuery} onChange={changeSearchQuery} />
        {pendingInvitesCount > 0 && (
          <div>
            <RadioButtonGroup value={showInvites ? 'invites' : 'users'} options={options} onChange={onShowInvites} />
          </div>
        )}
        {!showInvites && onSort && <UsersSort value={sort} onChange={onSort} />}
      </UsersListTools>
    </div>
  );
};

export const UsersActionBar = connector(UsersActionBarUnconnected);
