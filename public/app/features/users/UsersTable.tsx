import React, { FC, useState } from 'react';
import { AccessControlAction, OrgUser } from 'app/types';
import { OrgRolePicker } from '../admin/OrgRolePicker';
import { Button, ConfirmModal } from '@grafana/ui';
import { OrgRole } from '@grafana/data';
import { contextSrv } from 'app/core/core';

export interface Props {
  users: OrgUser[];
  onRoleChange: (role: OrgRole, user: OrgUser) => void;
  onRemoveUser: (user: OrgUser) => void;
}

const UsersTable: FC<Props> = (props) => {
  const { users, onRoleChange, onRemoveUser } = props;
  const canUpdateRole = contextSrv.hasPermission(AccessControlAction.OrgUsersRoleUpdate);
  const canRemoveFromOrg = contextSrv.hasPermission(AccessControlAction.OrgUsersRemove);

  const [showRemoveModal, setShowRemoveModal] = useState<string | boolean>(false);
  return (
    <table className="filter-table form-inline">
      <thead>
        <tr>
          <th />
          <th>사용자 이름</th>
          <th>이메일</th>
          <th>이름</th>
          <th>최근 로그인 시간</th>
          <th>권한</th>
          <th style={{ width: '34px' }} />
        </tr>
      </thead>
      <tbody>
        {users.map((user, index) => {
          return (
            <tr key={`${user.userId}-${index}`}>
              <td className="width-2 text-center">
                <img className="filter-table__avatar" src={user.avatarUrl} />
              </td>
              <td className="max-width-6">
                <span className="ellipsis" title={user.login}>
                  {user.login}
                </span>
              </td>

              <td className="max-width-5">
                <span className="ellipsis" title={user.email}>
                  {user.email}
                </span>
              </td>
              <td className="max-width-5">
                <span className="ellipsis" title={user.name}>
                  {user.name}
                </span>
              </td>
              <td className="width-1">{user.lastSeenAtAge}</td>

              <td className="width-8">
                <OrgRolePicker
                  value={user.role}
                  disabled={!canUpdateRole}
                  onChange={(newRole) => onRoleChange(newRole, user)}
                />
              </td>

              {canRemoveFromOrg && (
                <td>
                  <Button size="sm" variant="destructive" onClick={() => setShowRemoveModal(user.login)} icon="times" />
                  <ConfirmModal
                    body={`${user.login} 사용자를 삭제하시겠습니까?`}
                    confirmText="삭제"
                    title="삭제"
                    onDismiss={() => setShowRemoveModal(false)}
                    isOpen={user.login === showRemoveModal}
                    onConfirm={() => {
                      onRemoveUser(user);
                    }}
                  />
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default UsersTable;
