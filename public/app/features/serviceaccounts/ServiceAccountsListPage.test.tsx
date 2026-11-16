import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestProvider } from 'test/helpers/TestProvider';

import { OrgRole, ServiceAccountDTO, ServiceAccountStateFilter } from 'app/types';

import { Props, ServiceAccountsListPageUnconnected } from './ServiceAccountsListPage';

jest.mock('app/core/core', () => ({
  contextSrv: {
    licensedAccessControlEnabled: () => false,
    hasPermission: () => true,
    hasPermissionInMetadata: () => true,
  },
}));

const setup = (propOverrides: Partial<Props>) => {
  const changePageMock = jest.fn();
  const changeQueryMock = jest.fn();
  const fetchACOptionsMock = jest.fn();
  const fetchServiceAccountsMock = jest.fn();
  const deleteServiceAccountMock = jest.fn();
  const updateServiceAccountMock = jest.fn();
  const changeStateFilterMock = jest.fn();
  const createServiceAccountTokenMock = jest.fn();
  const props: Props = {
    isLoading: false,
    page: 0,
    perPage: 10,
    query: '',
    roleOptions: [],
    serviceAccountStateFilter: ServiceAccountStateFilter.All,
    showPaging: false,
    totalPages: 1,
    serviceAccounts: [],
    changePage: changePageMock,
    changeQuery: changeQueryMock,
    fetchACOptions: fetchACOptionsMock,
    fetchServiceAccounts: fetchServiceAccountsMock,
    deleteServiceAccount: deleteServiceAccountMock,
    updateServiceAccount: updateServiceAccountMock,
    changeStateFilter: changeStateFilterMock,
    createServiceAccountToken: createServiceAccountTokenMock,
  };

  Object.assign(props, propOverrides);

  const { rerender } = render(
    <TestProvider>
      <ServiceAccountsListPageUnconnected {...props} />
    </TestProvider>
  );
  return {
    rerender: (element: JSX.Element) => rerender(<TestProvider>{element}</TestProvider>),
    props,
    changeQueryMock,
    fetchACOptionsMock,
    fetchServiceAccountsMock,
    deleteServiceAccountMock,
    updateServiceAccountMock,
    changeStateFilterMock,
    createServiceAccountTokenMock,
  };
};

const getDefaultServiceAccount: () => ServiceAccountDTO = () => ({
  id: 42,
  name: 'Data source scavenger',
  login: 'sa-data-source-scavenger',
  orgId: 1,
  role: OrgRole.Editor,
  isDisabled: false,
  teams: [],
  tokens: 1,
  createdAt: '2022-01-01 00:00:00',
});

describe('ServiceAccountsListPage tests', () => {
  it('Should display list of service accounts', async () => {
    setup({
      serviceAccounts: [getDefaultServiceAccount()],
    });
    expect(screen.getByText(/Data source scavenger/)).toBeInTheDocument();
    expect(screen.getByText(/sa-data-source-scavenger/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Data source scavenger 권한: Editor' })).toBeInTheDocument();
  });

  it('Should display enable action for disabled account', async () => {
    setup({
      serviceAccounts: [
        {
          ...getDefaultServiceAccount(),
          isDisabled: true,
        },
      ],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Data source scavenger 서비스 계정 작업' }));
    expect(await screen.findByRole('menuitem', { name: '활성화' })).toBeInTheDocument();
  });

  it('Should display Add token action for account without tokens', async () => {
    setup({
      serviceAccounts: [
        {
          ...getDefaultServiceAccount(),
          tokens: 0,
        },
      ],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Data source scavenger 서비스 계정 작업' }));
    expect(await screen.findByRole('menuitem', { name: '토큰 추가' })).toBeInTheDocument();
    expect(screen.getByText('토큰 0개')).toBeInTheDocument();
  });

  it('Should update service account role', async () => {
    const updateServiceAccountMock = jest.fn();
    setup({
      serviceAccounts: [getDefaultServiceAccount()],
      updateServiceAccount: updateServiceAccountMock,
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Data source scavenger 권한: Editor' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /관리자/ }));

    expect(updateServiceAccountMock).toHaveBeenCalledWith({
      ...getDefaultServiceAccount(),
      role: OrgRole.Admin,
    });
  });

  it('Should disable service account', async () => {
    const updateServiceAccountMock = jest.fn();
    setup({
      serviceAccounts: [getDefaultServiceAccount()],
      updateServiceAccount: updateServiceAccountMock,
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Data source scavenger 서비스 계정 작업' }));
    await user.click(await screen.findByRole('menuitem', { name: '비활성화' }));
    await user.click(screen.getByRole('button', { name: 'Disable service account' }));

    expect(updateServiceAccountMock).toHaveBeenCalledWith({
      ...getDefaultServiceAccount(),
      isDisabled: true,
    });
  });

  it('Should remove service account', async () => {
    const deleteServiceAccountMock = jest.fn();
    setup({
      serviceAccounts: [getDefaultServiceAccount()],
      deleteServiceAccount: deleteServiceAccountMock,
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Data source scavenger 서비스 계정 작업' }));
    await user.click(await screen.findByRole('menuitem', { name: '서비스 계정 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(deleteServiceAccountMock).toHaveBeenCalledWith(42);
  });
});
