import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockToolkitActionCreator } from 'test/core/redux/mocks';

import { config } from 'app/core/config';

import { Props, UsersActionBarUnconnected } from './UsersActionBar';
import { searchQueryChanged } from './state/reducers';

jest.mock('app/core/core', () => ({
  contextSrv: {
    hasPermission: () => true,
  },
}));

const setup = (propOverrides?: object) => {
  const props: Props = {
    searchQuery: '',
    changeSearchQuery: mockToolkitActionCreator(searchQueryChanged),
    onShowInvites: jest.fn(),
    pendingInvitesCount: 0,
    externalUserMngLinkUrl: '',
    externalUserMngLinkName: '',
    showInvites: false,
  };

  Object.assign(props, propOverrides);

  const { rerender } = render(<UsersActionBarUnconnected {...props} />);

  return { rerender, props };
};

describe('Render', () => {
  it('should render component', () => {
    setup();

    expect(screen.getByTestId('users-action-bar')).toBeInTheDocument();
  });

  it('should render pending invites button', () => {
    setup({
      pendingInvitesCount: 5,
    });

    expect(screen.getByRole('radio', { name: '초대 대기 (5)' })).toBeInTheDocument();
  });

  it('does not show the removed invitation entry point', () => {
    setup();

    expect(screen.queryByRole('link', { name: '사용자 초대' })).not.toBeInTheDocument();
  });

  it('should show external user management button', () => {
    setup({
      externalUserMngLinkUrl: 'some/url',
      externalUserMngLinkName: 'someUrl',
    });

    expect(screen.getByRole('link', { name: 'someUrl' })).toHaveAttribute('href', 'some/url');
  });

  it('should not show invite button when externalUserMngInfo is set and disableLoginForm is true', () => {
    const originalExternalUserMngInfo = config.externalUserMngInfo;
    config.externalUserMngInfo = 'truthy';
    config.disableLoginForm = true;

    setup();

    expect(screen.queryByRole('link', { name: '사용자 초대' })).not.toBeInTheDocument();
    // Reset the disableLoginForm mock to its original value
    config.externalUserMngInfo = originalExternalUserMngInfo;
  });

  it('does not show the removed invitation entry point when externalUserMngInfo is not set and disableLoginForm is true', () => {
    config.externalUserMngInfo = '';
    config.disableLoginForm = true;

    setup();

    expect(screen.queryByRole('link', { name: '사용자 초대' })).not.toBeInTheDocument();
    // Reset the disableLoginForm mock to its original value
    config.disableLoginForm = false;
  });

  it('does not show the removed invitation entry point when externalUserMngInfo is set and disableLoginForm is false', () => {
    const originalExternalUserMngInfo = config.externalUserMngInfo;
    config.externalUserMngInfo = 'truthy';

    setup();

    expect(screen.queryByRole('link', { name: '사용자 초대' })).not.toBeInTheDocument();
    // Reset the disableLoginForm mock to its original value
    config.externalUserMngInfo = originalExternalUserMngInfo;
  });
});

it('keeps the invitation filter callback and displays the actual filtered invitation count', async () => {
  const { props, rerender } = setup({ pendingInvitesCount: 5, visibleInvitesCount: 2, totalCount: 100 });
  expect(screen.getByRole('heading', { name: '계정' })).toBeInTheDocument();
  expect(screen.getByText('100명')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('radio', { name: '초대 대기 (5)' }));
  expect(props.onShowInvites).toHaveBeenCalledTimes(1);
  rerender(<UsersActionBarUnconnected {...props} showInvites />);
  expect(screen.getByRole('heading', { name: '초대 대기' })).toBeInTheDocument();
  expect(screen.getByText('2명')).toBeInTheDocument();
  expect(screen.queryByText('100명')).not.toBeInTheDocument();
});
