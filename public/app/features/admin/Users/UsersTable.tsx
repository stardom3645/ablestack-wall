import { Pagination, Text, Tooltip, Icon } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import { UserDTO } from 'app/types';

import { OrgUnits } from './OrgUnits';
import { MemberList, MemberItem, UserActions, UsersListFooter, UsersEmptyState } from './WallUsers';

interface UsersTableProps {
  users: UserDTO[];
  showPaging?: boolean;
  totalPages: number;
  totalCount?: number;
  perPage?: number;
  onChangePage: (page: number) => void;
  currentPage: number;
}

export const UsersTable = ({
  users,
  showPaging,
  totalPages,
  totalCount,
  perPage,
  onChangePage,
  currentPage,
}: UsersTableProps) => (
  <>
    {users.length ? (
      <MemberList>
        {users.map((user) => (
          <MemberItem
            key={user.id}
            {...user}
            href={`/admin/users/edit/${user.id}`}
            roleControl={
              <span className="wall-server-permission">
                {user.isAdmin || user.isGrafanaAdmin
                  ? t('wall.users.server-admin', '서버 관리자')
                  : t('wall.users.server-account', '서버 사용자')}
              </span>
            }
            actions={<UserActions login={user.login} editHref={`admin/users/edit/${user.id}`} />}
            details={
              <>
                <OrgUnits units={user.orgs} icon="building" />
                {user.licensedRole &&
                  (user.licensedRole === 'None' ? (
                    <Text color="disabled">
                      Not assigned{' '}
                      <Tooltip placement="top" content="A licensed role will be assigned when this user signs in">
                        <Icon name="question-circle" />
                      </Tooltip>
                    </Text>
                  ) : (
                    <span>{user.licensedRole}</span>
                  ))}
              </>
            }
          />
        ))}
      </MemberList>
    ) : (
      <UsersEmptyState />
    )}
    {showPaging && (
      <UsersListFooter visibleCount={users.length} totalCount={totalCount} page={currentPage} perPage={perPage}>
        <Pagination numberOfPages={totalPages} currentPage={currentPage} onNavigate={onChangePage} />
      </UsersListFooter>
    )}
  </>
);
