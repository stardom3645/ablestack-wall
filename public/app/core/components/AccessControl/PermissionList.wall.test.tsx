import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PermissionList } from './PermissionList';
import { ResourcePermission } from './types';

const item: ResourcePermission = {
  id: 1,
  userId: 5,
  userLogin: 'api-owner',
  isManaged: true,
  isInherited: false,
  isServiceAccount: false,
  actions: [],
  permission: 'Edit',
};

it('keeps actual resource permission levels and the original item when selecting a Wall permission', async () => {
  const change = jest.fn();
  render(
    <PermissionList
      wallPresentation
      title="사용자"
      items={[item]}
      compareKey="userLogin"
      permissionLevels={['Edit', 'Admin']}
      canSet
      onChange={change}
      onRemove={jest.fn()}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'api-owner 접근 권한: Edit' }));
  await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Admin' }));
  expect(change).toHaveBeenCalledWith(item, 'Admin');
});

it.each([false, true])('keeps provisioned and inherited assignments locked even when canSet=%s', (canSet) => {
  render(
    <PermissionList
      wallPresentation
      title="사용자"
      items={[{ ...item, isManaged: false, isInherited: true }]}
      compareKey="userLogin"
      permissionLevels={['Edit', 'Admin']}
      canSet={canSet}
      onChange={jest.fn()}
      onRemove={jest.fn()}
    />
  );
  expect(screen.getByRole('button', { name: 'api-owner 접근 권한: Edit' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Remove permission for api-owner' })).not.toBeInTheDocument();
  expect(screen.getByText('폴더에서 상속됨')).toBeInTheDocument();
});
