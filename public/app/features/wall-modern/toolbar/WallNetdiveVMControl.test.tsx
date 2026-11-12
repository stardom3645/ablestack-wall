import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Subject } from 'rxjs';

import { getBackendSrv, getDataSourceSrv, type FetchResponse } from '@grafana/runtime';
import { QueryVariable, SceneTimeRange, SceneVariableSet } from '@grafana/scenes';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

import { useNetdiveURL } from '../useNetdiveURL';

import { WallNetdiveVMControl } from './WallNetdiveVMControl';

jest.mock('../useNetdiveURL', () => ({ useNetdiveURL: jest.fn() }));
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getBackendSrv: jest.fn(),
  getDataSourceSrv: jest.fn(),
}));
jest.mock('app/features/panel/panellinks/link_srv', () => ({
  getLinkSrv: () => ({ getAnchorInfo: (link: { url: string }) => ({ href: link.url }) }),
}));

const uuid = '12345678-1234-1234-1234-123456789abc';
const other = '22345678-1234-1234-1234-123456789abc';
let request: Subject<FetchResponse<unknown>>;
const fetcher = jest.fn();

beforeEach(() => {
  request = new Subject();
  fetcher.mockReset().mockImplementation(() => request);
  jest.mocked(useNetdiveURL).mockReturnValue('http://netdive.test:8082/ui_v2/');
  jest.mocked(getBackendSrv).mockReturnValue({ fetch: fetcher } as unknown as ReturnType<typeof getBackendSrv>);
  jest.mocked(getDataSourceSrv).mockReturnValue({
    getInstanceSettings: () => ({ uid: 'actual-prom', type: 'prometheus' }),
  } as unknown as ReturnType<typeof getDataSourceSrv>);
  contextSrv.user.orgId = 7;
});

function setup(value: string = uuid, query = 'label_values(libvirt_domain_info_meta,uuid)') {
  const variable = new QueryVariable({ name: 'collected_uuid', query, value, datasource: { uid: 'actual-prom' } });
  const dashboard = new DashboardScene({
    uid: 'actual-dashboard',
    title: 'VM',
    $variables: new SceneVariableSet({ variables: [variable] }),
    $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
  });
  const result = render(<WallNetdiveVMControl dashboard={dashboard} />);
  return { ...result, variable, dashboard };
}
const emit = (uuidValue = uuid, instances = ['agent-a']) =>
  act(() =>
    request.next({
      data: {
        status: 'success',
        data: { result: instances.map((instance) => ({ metric: { uuid: uuidValue, domain: 'i-2-VM', instance } })) },
      },
    } as FetchResponse<unknown>)
  );

it('does no metric lookup before intent and creates a native new-tab link only after verification', async () => {
  const { dashboard } = setup();
  expect(fetcher).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  expect(fetcher).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'GET',
      url: '/api/datasources/proxy/uid/actual-prom/api/v1/query',
      headers: { 'X-Grafana-Org-Id': '7' },
    })
  );
  expect(screen.queryByRole('link', { name: 'Netdive 관계 탐색 열기' })).not.toBeInTheDocument();
  emit();
  const link = await screen.findByRole('link', { name: 'Netdive 관계 탐색 열기' });
  const url = new URL(link.getAttribute('href')!);
  expect(url.searchParams.get('ndID')).toBe(uuid);
  expect(url.searchParams.get('wallOrg')).toBe('7');
  expect(url.searchParams.get('wallDashboard')).toBe(dashboard.state.uid);
  expect(url.searchParams.has('from')).toBe(true);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

it('shows a clear All-selection state and does not infer an identity or request metrics', async () => {
  setup('$__all');
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  expect(screen.getByRole('status')).toHaveTextContent('단일 VM');
  expect(fetcher).not.toHaveBeenCalled();
});

it('blocks duplicate exporter identities and cancels stale verification after changing the selected VM', async () => {
  const { variable } = setup();
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  emit(uuid, ['agent-a', 'agent-b']);
  expect(await screen.findByRole('status')).toHaveTextContent('동일 UUID');
  expect(screen.queryByRole('link', { name: 'Netdive 관계 탐색 열기' })).not.toBeInTheDocument();
  const previous = request;
  request = new Subject();
  act(() => variable.setState({ value: other }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(previous.observed).toBe(false);
  emit(other);
  const link = await screen.findByRole('link', { name: 'Netdive 관계 탐색 열기' });
  expect(new URL(link.getAttribute('href')!).searchParams.get('ndID')).toBe(other);
});

it('reports permission/connection failures without a link and unsubscribes on unmount', async () => {
  const { unmount } = setup();
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  act(() => request.error(new Error('403')));
  expect(await screen.findByRole('status')).toHaveTextContent('접근 권한');
  expect(screen.queryByRole('link', { name: 'Netdive 관계 탐색 열기' })).not.toBeInTheDocument();
  unmount();
  expect(request.observed).toBe(false);
});

it('does not add VM controls to name/IP/SQL dashboards', () => {
  setup('i-2-VM', 'SELECT instance_name FROM vm_instance');
  expect(screen.queryByRole('button', { name: 'Netdive 관계 탐색' })).not.toBeInTheDocument();
  expect(fetcher).not.toHaveBeenCalled();
});
