import { useEffect, useMemo, useState } from 'react';

import { OrgRole } from '@grafana/data';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { config, getBackendSrv } from '@grafana/runtime';
import {
  Avatar,
  Box,
  Button,
  CellProps,
  Column,
  ConfirmModal,
  FetchDataFunc,
  Icon,
  InteractiveTable,
  Pagination,
  Stack,
  Tag,
  Text,
  Tooltip,
} from '@grafana/ui';
import { UserRolePicker } from 'app/core/components/RolePicker/UserRolePicker';
import { fetchRoleOptions, updateUserRoles } from 'app/core/components/RolePicker/api';
import { RolePickerBadges } from 'app/core/components/RolePickerDrawer/RolePickerBadges';
import { TagBadge } from 'app/core/components/TagFilter/TagBadge';
import { contextSrv } from 'app/core/core';
import { t } from 'app/core/internationalization';
import { AccessControlAction, OrgUser, Role } from 'app/types';

import { OrgRolePicker } from '../OrgRolePicker';

import {
  UserActions,
  UserIdentity,
  UserText,
  UsersEmptyState,
  WallUserRolePicker,
  UsersListFooter,
  MemberList,
  MemberItem,
} from './WallUsers';
import { organizationProtection } from './organizationProtection';

type Cell<T extends keyof OrgUser = keyof OrgUser> = CellProps<OrgUser, OrgUser[T]>;

const disabledRoleMessage = `This user's role is not editable because it is synchronized from your auth provider.
Refer to the Grafana authentication docs for details.`;

const getBasicRoleDisabled = (user: OrgUser) => {
  const isUserSynced = user?.isExternallySynced;
  return !contextSrv.hasPermissionInMetadata(AccessControlAction.OrgUsersWrite, user) || isUserSynced;
};

const selectors = e2eSelectors.pages.UserListPage.UsersListPage;

export interface Props {
  users: OrgUser[];
  orgId?: number;
  onRoleChange: (role: OrgRole, user: OrgUser) => void;
  onRemoveUser: (user: OrgUser) => void;
  fetchData?: FetchDataFunc<OrgUser>;
  changePage: (page: number) => void;
  page: number;
  totalPages: number;
  totalCount?: number;
  perPage?: number;
  rolesLoading?: boolean;
  onUserRolesChange?: () => void;
  wallPresentation?: boolean;
}

function OrganizationRole({
  user: original,
  orgId,
  onRoleChange,
  onUserRolesChange,
  rolesLoading,
  wallPresentation,
  roleOptions,
  protectionReason,
}: Pick<Props, 'orgId' | 'onRoleChange' | 'onUserRolesChange' | 'rolesLoading' | 'wallPresentation'> & {
  user: OrgUser;
  roleOptions: Role[];
  protectionReason?: string;
}) {
  const value = original.role;

  const basicRoleDisabled = Boolean(protectionReason) || getBasicRoleDisabled(original);
  const onUserRolesUpdate = async (newRoles: Role[], userId: number, orgId: number | undefined) => {
    await updateUserRoles(newRoles, userId, orgId);
    if (onUserRolesChange) {
      onUserRolesChange();
    }
  };

  if (protectionReason) {
    return (
      <WallUserRolePicker value={value} login={original.login} disabled reason={protectionReason} onChange={() => {}} />
    );
  }
  if (config.featureToggles.rolePickerDrawer) {
    return <RolePickerBadges disabled={basicRoleDisabled} user={original} />;
  }

  return contextSrv.licensedAccessControlEnabled() ? (
    <UserRolePicker
      userId={original.userId}
      roles={original.roles}
      apply={true}
      onApplyRoles={onUserRolesUpdate}
      isLoading={rolesLoading}
      orgId={orgId}
      roleOptions={roleOptions}
      basicRole={value}
      onBasicRoleChange={(newRole) => onRoleChange(newRole, original)}
      basicRoleDisabled={basicRoleDisabled}
      basicRoleDisabledMessage={disabledRoleMessage}
      width={40}
    />
  ) : wallPresentation ? (
    <WallUserRolePicker
      value={value}
      login={original.login}
      disabled={Boolean(basicRoleDisabled)}
      reason={
        original.isExternallySynced
          ? t('wall.users.synced-role', '외부 인증 제공자에서 동기화된 권한입니다.')
          : t('wall.users.readonly-role', '이 사용자의 권한을 변경할 권한이 없습니다.')
      }
      onChange={(role) => onRoleChange(role, original)}
    />
  ) : (
    <OrgRolePicker
      aria-label="Role"
      value={value}
      disabled={basicRoleDisabled}
      onChange={(newRole) => onRoleChange(newRole, original)}
    />
  );
}

export const OrgUsersTable = ({
  users,
  orgId,
  onRoleChange,
  onUserRolesChange,
  onRemoveUser,
  fetchData,
  changePage,
  page,
  totalPages,
  totalCount,
  perPage,
  rolesLoading,
  wallPresentation = false,
}: Props) => {
  const [administrators, setAdministrators] = useState<number[]>();
  const membershipOrg = orgId ?? contextSrv.user.orgId;
  const membershipSignature = users.map(({ userId, role, isDisabled }) => `${userId}:${role}:${isDisabled}`).join('|');
  useEffect(() => {
    let active = true;
    setAdministrators(undefined);
    if (contextSrv.hasPermission(AccessControlAction.OrgUsersRead)) {
      const path = membershipOrg === contextSrv.user.orgId ? '/api/org/users' : `/api/orgs/${membershipOrg}/users`;
      getBackendSrv()
        .get<OrgUser[]>(path)
        .then((members) => {
          if (active) {
            setAdministrators(
              members
                .filter((member) => member.role === OrgRole.Admin && !member.isDisabled)
                .map((member) => member.userId)
            );
          }
        })
        .catch(() => {
          /* The server remains authoritative when membership cannot be read. */
        });
    }
    return () => {
      active = false;
    };
  }, [membershipOrg, membershipSignature]);
  const protection = (user: OrgUser) => organizationProtection(user, membershipOrg, contextSrv.user, administrators);
  const [userToRemove, setUserToRemove] = useState<OrgUser | null>(null);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);

  useEffect(() => {
    async function fetchOptions() {
      try {
        if (contextSrv.hasPermission(AccessControlAction.ActionRolesList)) {
          let options = await fetchRoleOptions(orgId);
          setRoleOptions(options);
        }
      } catch (e) {
        console.error('Error loading options');
      }
    }
    if (contextSrv.licensedAccessControlEnabled()) {
      fetchOptions();
    }
  }, [orgId]);

  const columns: Array<Column<OrgUser>> = useMemo(
    () => [
      ...(!wallPresentation
        ? [
            {
              id: 'avatarUrl',
              header: '',
              cell: ({ cell: { value } }: Cell<'avatarUrl'>) => value && <Avatar src={value} alt="User avatar" />,
            },
          ]
        : []),
      {
        id: 'login',
        header: t('ablestack-wall.common.login', 'Login'),
        cell: ({ cell: { value }, row: { original } }: Cell<'login'>) =>
          wallPresentation ? (
            <UserIdentity login={value} name={original.name} email={original.email} avatarUrl={original.avatarUrl} />
          ) : (
            <div>{value}</div>
          ),
        sortType: 'string',
      },
      {
        id: 'email',
        header: t('ablestack-wall.common.email', 'Email'),
        cell: ({ cell: { value } }: Cell<'email'>) => (wallPresentation ? <UserText value={value} /> : value),
        sortType: 'string',
      },
      {
        id: 'name',
        header: t('ablestack-wall.common.name', 'Name'),
        cell: ({ cell: { value } }: Cell<'name'>) => (wallPresentation ? <UserText value={value} /> : value),
        sortType: 'string',
      },
      {
        id: 'lastSeenAtAge',
        header: t('ablestack-wall.common.last-active', 'Last active'),
        cell: ({ cell: { value }, row: { original } }: Cell<'lastSeenAtAge'>) => {
          return wallPresentation ? (
            <UserText
              value={value === '10 years' ? t('wall.users.never', '로그인 기록 없음') : value}
              title={value === '10 years' ? undefined : original.lastSeenAt}
            />
          ) : (
            <>{value && <>{value === '10 years' ? <Text color={'disabled'}>Never</Text> : value}</>}</>
          );
        },
        sortType: (a, b) => new Date(a.original.lastSeenAt).getTime() - new Date(b.original.lastSeenAt).getTime(),
      },
      {
        id: 'role',
        header: t('ablestack-wall.common.role', 'Role'),
        cell: ({ row: { original } }: Cell<'role'>) => (
          <OrganizationRole
            user={original}
            protectionReason={protection(original).roleReason}
            orgId={orgId}
            onRoleChange={onRoleChange}
            onUserRolesChange={onUserRolesChange}
            rolesLoading={rolesLoading}
            wallPresentation={wallPresentation}
            roleOptions={roleOptions}
          />
        ),
      },
      ...(!wallPresentation
        ? [
            {
              id: 'info',
              header: '',
              cell: ({ row: { original } }: Cell) => {
                const basicRoleDisabled = getBasicRoleDisabled(original);
                return (
                  basicRoleDisabled && (
                    <Box display={'flex'} alignItems={'center'} marginLeft={1}>
                      <Tooltip
                        interactive={true}
                        content={
                          <div>
                            This user&apos;s role is not editable because it is synchronized from your auth provider.
                            Refer to the&nbsp;
                            <a
                              href={
                                'https://grafana.com/docs/grafana/latest/administration/user-management/manage-org-users/#change-a-users-organization-permissions'
                              }
                              rel="noreferrer"
                              target="_blank"
                            >
                              Grafana authentication docs
                            </a>
                            &nbsp;for details.
                          </div>
                        }
                      >
                        <Icon name="question-circle" />
                      </Tooltip>
                    </Box>
                  )
                );
              },
            },
          ]
        : []),
      {
        id: 'authLabels',
        header: wallPresentation
          ? t('wall.users.auth-source', '인증 출처')
          : t('ablestack-wall.common.origin', 'Origin'),
        cell: ({ cell: { value } }: Cell<'authLabels'>) =>
          wallPresentation ? (
            <UserText value={Array.isArray(value) ? value.join(', ') : undefined} />
          ) : (
            <>
              {Array.isArray(value) && value.length > 0 && <TagBadge label={value[0]} removeIcon={false} count={0} />}
            </>
          ),
      },
      {
        id: 'isDisabled',
        header: wallPresentation ? t('wall.users.status', '상태') : '',
        cell: ({ cell: { value } }: Cell<'isDisabled'>) =>
          wallPresentation ? (
            <UserText value={value ? t('wall.users.disabled', '비활성') : t('wall.users.enabled', '사용 가능')} />
          ) : (
            <>{value && <Tag colorIndex={9} name={'Disabled'} />}</>
          ),
      },
      {
        id: 'delete',
        header: wallPresentation ? t('wall.users.actions-heading', '작업') : '',
        cell: ({ row: { original } }: Cell) => {
          return (
            !protection(original).removeReason &&
            contextSrv.hasPermissionInMetadata(AccessControlAction.OrgUsersRemove, original) &&
            (wallPresentation ? (
              <UserActions login={original.login} onRemove={() => setUserToRemove(original)} />
            ) : (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  setUserToRemove(original);
                }}
                icon="times"
                aria-label={`Delete user ${original.name}`}
              />
            ))
          );
        },
      },
    ],
    // Membership protection changes with the real organization snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rolesLoading, orgId, roleOptions, onUserRolesChange, onRoleChange, wallPresentation, administrators, membershipOrg]
  );

  return (
    <Stack direction={'column'} gap={wallPresentation ? 0 : 2} data-testid={selectors.container}>
      {wallPresentation ? (
        <>
          {users.length ? (
            <MemberList>
              {users.map((user) => (
                <MemberItem
                  key={user.userId}
                  {...user}
                  roleControl={
                    <OrganizationRole
                      user={user}
                      protectionReason={protection(user).roleReason}
                      orgId={orgId}
                      onRoleChange={onRoleChange}
                      onUserRolesChange={onUserRolesChange}
                      rolesLoading={rolesLoading}
                      wallPresentation
                      roleOptions={roleOptions}
                    />
                  }
                  actions={
                    !protection(user).removeReason &&
                    contextSrv.hasPermissionInMetadata(AccessControlAction.OrgUsersRemove, user) ? (
                      <UserActions login={user.login} onRemove={() => setUserToRemove(user)} />
                    ) : undefined
                  }
                />
              ))}
            </MemberList>
          ) : (
            <UsersEmptyState />
          )}
          {totalPages > 1 && (
            <UsersListFooter visibleCount={users.length} totalCount={totalCount} page={page} perPage={perPage}>
              <Pagination onNavigate={changePage} currentPage={page} numberOfPages={totalPages} hideWhenSinglePage />
            </UsersListFooter>
          )}
        </>
      ) : (
        <>
          <InteractiveTable
            columns={columns}
            data={users}
            getRowId={(user) => String(user.userId)}
            fetchData={fetchData}
          />
          <Stack justifyContent="flex-end">
            <Pagination onNavigate={changePage} currentPage={page} numberOfPages={totalPages} hideWhenSinglePage />
          </Stack>
        </>
      )}
      {Boolean(userToRemove) && (
        <ConfirmModal
          body={
            wallPresentation
              ? t(
                  'wall.users.remove-confirm',
                  '{{login}} 사용자를 이 조직에서 제거하시겠습니까? 다른 조직에 속하지 않은 사용자는 계정도 삭제됩니다.',
                  { login: userToRemove?.login }
                )
              : `Are you sure you want to delete user ${userToRemove?.login}?`
          }
          confirmText={wallPresentation ? t('wall.users.remove', '조직에서 제거') : 'Delete'}
          title={wallPresentation ? t('wall.users.remove-title', '조직 사용자 제거') : 'Delete'}
          onDismiss={() => {
            setUserToRemove(null);
          }}
          isOpen={true}
          onConfirm={() => {
            if (!userToRemove || protection(userToRemove).removeReason) {
              return;
            }
            onRemoveUser(userToRemove);
            setUserToRemove(null);
          }}
        />
      )}
    </Stack>
  );
};
