import { act, renderHook, waitFor } from '@testing-library/react';

import { getBackendSrv } from '@grafana/runtime';
import { appEvents } from 'app/core/app_events';
import { contextSrv } from 'app/core/services/context_srv';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import type { DashboardSearchItem } from 'app/features/search/types';
import { useDispatch } from 'app/types';

import { WallDashboardStarredEvent } from './events';
import { useWallDashboardSource } from './useWallDashboards';

jest.mock('@grafana/runtime', () => ({ getBackendSrv: jest.fn() }));
jest.mock('app/core/services/context_srv', () => ({ contextSrv: { isSignedIn: true } }));
jest.mock('app/core/reducers/navBarTree', () => ({
  setStarred: (payload: unknown) => ({ type: 'nav/setStarred', payload }),
}));
jest.mock('app/features/dashboard/services/DashboardSrv', () => ({ getDashboardSrv: jest.fn() }));
jest.mock('app/types', () => ({ useDispatch: jest.fn() }));

const item: DashboardSearchItem = {
  uid: 'existing-uid',
  title: '01. 종합 대시보드',
  url: '/d/existing-uid',
  uri: '',
  tags: [],
  type: 'dash-db',
  isStarred: false,
};
const get = jest.fn();
const star = jest.fn();
const dispatch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  contextSrv.isSignedIn = true;
  jest.mocked(getBackendSrv).mockReturnValue({ get } as unknown as ReturnType<typeof getBackendSrv>);
  jest
    .mocked(getDashboardSrv)
    .mockReturnValue({ starDashboard: star } as unknown as ReturnType<typeof getDashboardSrv>);
  jest.mocked(useDispatch).mockReturnValue(dispatch);
});

it('loads every search page without manufacturing additional resources', async () => {
  const first = Array.from({ length: 1000 }, (_, i) => ({ ...item, uid: `resource-${i}` }));
  get.mockResolvedValueOnce(first).mockResolvedValueOnce([item]);
  const { result } = renderHook(useWallDashboardSource);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(get.mock.calls.map((call) => call[1].page)).toEqual([1, 2]);
  expect(result.current.items).toHaveLength(1001);
  expect(result.current.items[1000].uid).toBe('existing-uid');
});

it('retains the existing star state when the server denies a mutation', async () => {
  get.mockResolvedValue([item]);
  star.mockRejectedValue(new Error('permission denied'));
  const { result } = renderHook(useWallDashboardSource);
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await expect(result.current.toggleStar(item)).rejects.toThrow('permission denied');
  });
  expect(result.current.items[0].isStarred).toBe(false);
  expect(result.current.pendingStars.size).toBe(0);
  expect(dispatch).not.toHaveBeenCalled();
});

it('updates Grafana navigation only after a successful UID-based star operation', async () => {
  get.mockResolvedValue([item]);
  star.mockResolvedValue(true);
  const { result } = renderHook(useWallDashboardSource);
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await result.current.toggleStar(item);
  });
  expect(star).toHaveBeenCalledWith('existing-uid', false);
  expect(result.current.items[0].isStarred).toBe(true);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ payload: expect.objectContaining({ id: 'existing-uid', isStarred: true }) })
  );
});

it('does not issue a star mutation for anonymous users', async () => {
  contextSrv.isSignedIn = false;
  get.mockResolvedValue([item]);
  const { result } = renderHook(useWallDashboardSource);
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    await result.current.toggleStar(item);
  });
  expect(star).not.toHaveBeenCalled();
});

it('reflects favorites changed by either native dashboard renderer', async () => {
  get.mockResolvedValue([item]);
  const { result } = renderHook(useWallDashboardSource);
  await waitFor(() => expect(result.current.loading).toBe(false));
  act(() => {
    appEvents.publish(new WallDashboardStarredEvent({ uid: item.uid, isStarred: true }));
  });
  expect(result.current.items[0].isStarred).toBe(true);
});
