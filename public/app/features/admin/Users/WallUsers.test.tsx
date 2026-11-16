import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { OrgRole } from '@grafana/data';
import { contextSrv } from 'app/core/core';
import { getMockUsers } from 'app/features/users/__mocks__/userMocks';

import { OrgUsersTable } from './OrgUsersTable';
import { WallUsersRegion, UsersSort, UsersListFooter, UsersSearch, UserIdentity } from './WallUsers';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: () => ({ get: () => new Promise(() => {}) }),
}));

jest.mock('app/core/core', () => ({
  contextSrv: {
    user: { id: 99, orgId: 1, orgRole: 'Admin' },
    hasPermission: jest.fn(() => true),
    hasPermissionInMetadata: jest.fn(() => true),
    licensedAccessControlEnabled: () => false,
  },
}));

function setup({ synced = false, users = getMockUsers(2), totalPages = 2 } = {}) {
  users[0].isExternallySynced = synced;
  const onRoleChange = jest.fn(),
    onRemoveUser = jest.fn(),
    fetchData = jest.fn(),
    changePage = jest.fn();
  render(
    <WallUsersRegion>
      <UsersSort onChange={fetchData} />
      <OrgUsersTable
        wallPresentation
        users={users}
        page={1}
        totalPages={totalPages}
        onRoleChange={onRoleChange}
        onRemoveUser={onRemoveUser}
        changePage={changePage}
        fetchData={fetchData}
      />
    </WallUsersRegion>
  );
  return { user: userEvent.setup(), users, onRoleChange, onRemoveUser, fetchData, changePage };
}

beforeEach(() => jest.mocked(contextSrv.hasPermissionInMetadata).mockReturnValue(true));

it('keeps separate login/email/name sorting and native paging callbacks', async () => {
  const { user, fetchData } = setup();
  for (const [label, id] of [
    ['Login', 'login'],
    ['Email', 'email'],
    ['Name', 'name'],
  ]) {
    await user.click(screen.getByRole('button', { name: '사용자 정렬' }));
    await user.click(await screen.findByRole('menuitemradio', { name: label }));
    await waitFor(() => expect(fetchData).toHaveBeenLastCalledWith({ sortBy: [{ id, desc: false }] }));
  }
});

it('changes only a deliberately selected role, preserving the original user callback', async () => {
  const { user, users, onRoleChange } = setup();
  await user.click(screen.getByRole('button', { name: 'user-0 권한: Admin' }));
  expect(onRoleChange).not.toHaveBeenCalled();
  await user.click(await screen.findByRole('menuitemradio', { name: /Editor/ }));
  expect(onRoleChange).toHaveBeenCalledWith(OrgRole.Editor, users[0]);
});

it('keeps external synchronization and missing permission read-only', () => {
  setup({ synced: true });
  expect(screen.queryByRole('button', { name: 'user-0 권한: Admin' })).not.toBeInTheDocument();
  expect(screen.getByText('외부 인증 제공자에서 동기화된 권한입니다.')).toBeVisible();
});

it('hides removal and disables role changes without metadata permission', () => {
  jest.mocked(contextSrv.hasPermissionInMetadata).mockReturnValue(false);
  setup();
  expect(screen.queryByRole('button', { name: 'user-0 권한: Admin' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'user-0 사용자 작업' })).not.toBeInTheDocument();
});

it('retains confirmation before removing organization membership', async () => {
  const { user, users, onRemoveUser } = setup();
  await user.click(screen.getByRole('button', { name: 'user-0 사용자 작업' }));
  await user.click(await screen.findByRole('menuitem', { name: '조직에서 제거' }));
  expect(onRemoveUser).not.toHaveBeenCalled();
  expect(screen.getByText(/다른 조직에 속하지 않은 사용자는 계정도 삭제됩니다/)).toBeInTheDocument();
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '조직에서 제거' }));
  expect(onRemoveUser).toHaveBeenCalledWith(users[0]);
});

it('keeps an open action menu when the same user data is projected into a new array', async () => {
  const user = userEvent.setup(),
    users = getMockUsers(1);
  const onRoleChange = jest.fn(),
    onRemoveUser = jest.fn(),
    changePage = jest.fn();
  const view = () => (
    <WallUsersRegion>
      <OrgUsersTable
        wallPresentation
        users={[...users]}
        page={1}
        totalPages={1}
        onRoleChange={onRoleChange}
        onRemoveUser={onRemoveUser}
        changePage={changePage}
      />
    </WallUsersRegion>
  );
  const { rerender } = render(view());
  await user.click(screen.getByRole('button', { name: 'user-0 사용자 작업' }));
  expect(await screen.findByRole('menuitem', { name: '조직에서 제거' })).toBeVisible();
  rerender(view());
  expect(screen.getByRole('menuitem', { name: '조직에서 제거' })).toBeVisible();
});

it('groups name, unique login and email into one profile cell without dropping identity data', () => {
  const users = getMockUsers(1).slice(0, 1);
  users[0].name = '운영 담당자';
  users[0].email = 'long-address@example.invalid';
  setup({ users });
  const cells = within(screen.getByRole('list', { name: '사용자 계정' })).getAllByRole('listitem');
  expect(cells).toHaveLength(1);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(within(cells[0]).getByText('운영 담당자')).toBeInTheDocument();
  expect(within(cells[0]).getByText('user-0')).toBeInTheDocument();
  expect(within(cells[0]).getByText(users[0].email)).toHaveAttribute('title', users[0].email);
});

it('keeps descending and default server sorting accessible after merging profile columns', async () => {
  const change = jest.fn();
  function Control() {
    const [sort, setSort] = useState<string>();
    return (
      <WallUsersRegion>
        <UsersSort
          value={sort}
          onChange={(args) => {
            change(args);
            const next = args.sortBy[0];
            setSort(next ? `${next.id}-${next.desc ? 'desc' : 'asc'}` : undefined);
          }}
        />
      </WallUsersRegion>
    );
  }
  const user = userEvent.setup();
  render(<Control />);
  await user.click(screen.getByRole('button', { name: '사용자 정렬' }));
  await user.click(await screen.findByRole('menuitemradio', { name: 'Email' }));
  expect(change).toHaveBeenLastCalledWith({ sortBy: [{ id: 'email', desc: false }] });
  await user.click(screen.getByRole('button', { name: '사용자 정렬' }));
  await user.click(await screen.findByRole('menuitemradio', { name: '내림차순' }));
  expect(change).toHaveBeenLastCalledWith({ sortBy: [{ id: 'email', desc: true }] });
  await user.click(screen.getByRole('button', { name: '사용자 정렬' }));
  await user.click(await screen.findByRole('menuitem', { name: '기본 순서' }));
  expect(change).toHaveBeenLastCalledWith({ sortBy: [] });
});

it('reports the real final-page range without inventing a total from page count', () => {
  render(
    <WallUsersRegion>
      <UsersListFooter visibleCount={10} totalCount={100} page={4} perPage={30} />
    </WallUsersRegion>
  );
  expect(screen.getByText('91–100 / 100명')).toBeInTheDocument();
});

it('keeps the displayed range inside the known total while a page request replaces previous rows', () => {
  render(
    <WallUsersRegion>
      <UsersListFooter visibleCount={30} totalCount={100} page={4} perPage={30} />
    </WallUsersRegion>
  );
  expect(screen.getByText('91–100 / 100명')).toBeInTheDocument();
});

it('uses a compact account list without table headers or pagination for a single user', () => {
  setup({ users: getMockUsers(1).slice(0, 1), totalPages: 1 });
  expect(within(screen.getByRole('list', { name: '사용자 계정' })).getAllByRole('listitem')).toHaveLength(1);
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'next page' })).not.toBeInTheDocument();
});

it('reveals search on demand and restores keyboard focus without losing an active search', async () => {
  function SearchControl() {
    const [value, setValue] = useState('');
    return (
      <WallUsersRegion>
        <UsersSearch value={value} onChange={setValue} />
      </WallUsersRegion>
    );
  }
  const user = userEvent.setup();
  render(<SearchControl />);
  expect(screen.queryByRole('textbox', { name: '사용자 검색' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '사용자 검색 열기' }));
  await user.type(screen.getByRole('textbox', { name: '사용자 검색' }), 'account');
  await user.click(screen.getByRole('button', { name: '사용자 검색 열기' }));
  expect(screen.getByRole('textbox', { name: '사용자 검색' })).toHaveValue('account');
  await user.clear(screen.getByRole('textbox', { name: '사용자 검색' }));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('textbox', { name: '사용자 검색' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '사용자 검색 열기' })).toHaveFocus();
});

it.each(['true', 'false', null])(
  'preserves custom avatars and replaces only a confirmed generated fallback (%s)',
  async (classification) => {
    const request = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, headers: { get: () => classification } } as unknown as Response);
    const { container } = render(
      <UserIdentity login="operator" avatarUrl="/avatar/00000000000000000000000000000000" />
    );
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    if (classification === 'false') {
      await waitFor(() => expect(container.querySelector('.wall-user-initial')).toHaveTextContent('O'));
    } else {
      expect(container.querySelector('img')).toHaveAttribute('src', '/avatar/00000000000000000000000000000000');
    }
    request.mockRestore();
  }
);
