import { escapeStringForRegex } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { fetchUsers } from 'app/features/admin/state/actions';
import { StoreState } from 'app/types';

import { loadUsers } from './actions';

jest.mock('app/core/core', () => ({
  contextSrv: { licensedAccessControlEnabled: () => false, hasPermission: () => true },
}));
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
}));

it.each(['wall-qa-01', 'name+tag@example.invalid', 'A&B [user]'])(
  'searches literal user text %s without changing filters or sorting',
  async (text) => {
    const get = jest.fn().mockResolvedValue({ orgUsers: [], totalCount: 0, perPage: 30, page: 1 });
    jest.mocked(getBackendSrv).mockReturnValue({ get } as unknown as ReturnType<typeof getBackendSrv>);
    const dispatch = jest.fn();
    const query = escapeStringForRegex(text);
    const getState = () =>
      ({
        users: { perPage: 30, page: 1, searchQuery: query, sort: 'login-asc' },
        userListAdmin: {
          perPage: 30,
          page: 1,
          query,
          sort: 'email-desc',
          filters: [{ name: 'activeLast30Days', value: true }],
        },
      }) as unknown as StoreState;

    await loadUsers()(dispatch, getState, undefined);
    expect(get).toHaveBeenLastCalledWith(
      '/api/org/users/search',
      expect.objectContaining({
        query: text,
        sort: 'login-asc',
        page: 1,
        perpage: 30,
      })
    );
    await fetchUsers()(dispatch, getState, undefined);
    const request = new URL(get.mock.calls[1][0], 'http://localhost');
    expect(request.searchParams.get('query')).toBe(text);
    expect(request.searchParams.get('sort')).toBe('email-desc');
    expect(request.searchParams.get('activeLast30Days')).toBe('true');
  }
);
