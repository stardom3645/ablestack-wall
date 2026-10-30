import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom-v5-compat';

import type { DashboardSearchItem } from '../search/types';

import WallDashboardLibrary from './WallDashboardLibrary';
import { WallDashboardContext, type WallDashboardSource } from './useWallDashboards';

jest.mock('app/core/services/context_srv', () => ({
  contextSrv: { isSignedIn: true, user: { orgName: '운영 조직' } },
}));

const items: DashboardSearchItem[] = [
  {
    uid: 'overview',
    title: '01. 종합 대시보드',
    url: '/d/overview/summary',
    uri: '',
    type: 'dash-db',
    tags: [],
    isStarred: true,
  },
  {
    uid: 'host',
    title: '02. 호스트 종합 현황',
    url: '/d/host/details',
    uri: '',
    type: 'dash-db',
    tags: ['infrastructure'],
    isStarred: false,
  },
];

function setup(overrides: Partial<WallDashboardSource> = {}) {
  const source: WallDashboardSource = {
    items,
    loading: false,
    error: undefined,
    toggleStar: jest.fn().mockResolvedValue(undefined),
    pendingStars: new Set(),
    reload: jest.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <WallDashboardContext.Provider value={source}>
        <WallDashboardLibrary />
      </WallDashboardContext.Provider>
    </MemoryRouter>
  );
  return source;
}

it('links to the existing UID URL and filters dashboard names', async () => {
  setup();
  expect(screen.getByRole('heading', { name: '01. 종합 대시보드' }).closest('a')).toHaveAttribute(
    'href',
    '/d/overview/summary'
  );
  await userEvent.type(screen.getByRole('textbox', { name: '대시보드 검색' }), '호스트');
  expect(screen.queryByRole('heading', { name: '01. 종합 대시보드' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '02. 호스트 종합 현황' })).toBeInTheDocument();
});

it('uses the existing star operation without navigating the card', async () => {
  const source = setup();
  await userEvent.click(screen.getByRole('button', { name: '02. 호스트 종합 현황 즐겨찾기 추가' }));
  expect(source.toggleStar).toHaveBeenCalledWith(items[1]);
});

it('filters favorites using keyboard-accessible Base UI tabs', async () => {
  setup();
  await userEvent.click(screen.getByRole('tab', { name: '즐겨찾기' }));
  expect(screen.getByRole('heading', { name: '01. 종합 대시보드' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '02. 호스트 종합 현황' })).not.toBeInTheDocument();
});

it('does not replace an API failure with fabricated cards', async () => {
  const source = setup({ error: '대시보드를 불러오지 못했습니다.', items: [] });
  expect(screen.getByRole('alert')).toHaveTextContent('대시보드를 불러오지 못했습니다.');
  expect(screen.queryByRole('heading', { name: '01. 종합 대시보드' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(source.reload).toHaveBeenCalledTimes(1);
});
