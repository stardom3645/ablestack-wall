import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom-v5-compat';

import { UserDTO } from 'app/types';

import { UsersTable } from './UsersTable';
import { WallUsersRegion, UsersSort } from './WallUsers';

it('preserves account details, all sort keys, authentication information and server pagination', async () => {
  const user = userEvent.setup(),
    fetchData = jest.fn(),
    onChangePage = jest.fn();
  const account: UserDTO = {
    id: 42,
    login: 'server-user',
    name: 'Server User',
    email: 'user@example.invalid',
    isGrafanaAdmin: false,
    isDisabled: true,
    authLabels: ['LDAP', 'OAuth'],
    lastSeenAt: '2026-11-01',
    lastSeenAtAge: '10 years',
  };
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallUsersRegion>
        <UsersSort onChange={fetchData} />
        <UsersTable users={[account]} showPaging currentPage={1} totalPages={2} onChangePage={onChangePage} />
      </WallUsersRegion>
    </MemoryRouter>
  );
  expect(screen.getByRole('link', { name: 'server-user 사용자 상세' })).toHaveAttribute('href', '/admin/users/edit/42');
  expect(screen.getByText('LDAP, OAuth')).toBeInTheDocument();
  expect(screen.getByText('로그인 기록 없음')).toBeInTheDocument();
  expect(screen.getByText('비활성')).toBeInTheDocument();
  for (const [label, id] of [
    ['Login', 'login'],
    ['Email', 'email'],
    ['Name', 'name'],
    ['Last active', 'lastSeenAtAge'],
  ]) {
    await user.click(screen.getByRole('button', { name: '사용자 정렬' }));
    await user.click(await screen.findByRole('menuitemradio', { name: label }));
    await waitFor(() => expect(fetchData).toHaveBeenLastCalledWith({ sortBy: [{ id, desc: false }] }));
  }
  await user.click(screen.getByRole('button', { name: 'next page' }));
  expect(onChangePage).toHaveBeenCalledWith(2);
  await user.click(screen.getByRole('button', { name: 'server-user 사용자 작업' }));
  expect(await screen.findByRole('menuitem', { name: '사용자 상세' })).toHaveAttribute('href', 'admin/users/edit/42');
  expect(screen.queryByRole('menuitem', { name: '조직에서 제거' })).not.toBeInTheDocument();
});
