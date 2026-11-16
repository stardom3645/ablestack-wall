import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Subject } from 'rxjs';

import { getBackendSrv, getDataSourceSrv, type FetchResponse } from '@grafana/runtime';
import {
  QueryVariable,
  SceneTimeRange,
  SceneVariableSet,
  SceneGridLayout,
  SceneGridItem,
  SceneQueryRunner,
  VizPanel,
} from '@grafana/scenes';
import { contextSrv } from 'app/core/services/context_srv';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { DefaultGridLayoutManager } from 'app/features/dashboard-scene/scene/layout-default/DefaultGridLayoutManager';

import { useNetdiveConfiguration } from '../useNetdiveURL';

import { WallNetdiveVMControl } from './WallNetdiveVMControl';

jest.mock('../useNetdiveURL', () => ({ useNetdiveConfiguration: jest.fn() }));
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
  jest.mocked(useNetdiveConfiguration).mockReturnValue({ url: 'http://netdive.test:8082/ui_v2/', loaded: true });
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

it('waits for installation configuration and uses it over a legacy dashboard destination', async () => {
  jest.mocked(useNetdiveConfiguration).mockReturnValue({ loaded: false });
  const { dashboard, rerender } = setup();
  act(() =>
    dashboard.setState({
      links: [
        {
          title: 'Netdive',
          type: 'link',
          url: 'https://legacy.test/',
          targetBlank: true,
          includeVars: false,
          keepTime: false,
          tags: [],
          asDropdown: false,
          icon: 'external link',
          tooltip: '',
        },
      ],
    })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  expect(fetcher).not.toHaveBeenCalled();
  jest.mocked(useNetdiveConfiguration).mockReturnValue({ loaded: true, url: 'https://installed.test/ui_v2/' });
  rerender(<WallNetdiveVMControl dashboard={dashboard} />);
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  emit();
  const link = await screen.findByRole('link', { name: 'Netdive 관계 탐색 열기' });
  expect(new URL(link.getAttribute('href')!).origin).toBe('https://installed.test');
  expect(dashboard.state.links?.[0].url).toBe('https://legacy.test/');
});

it('never falls back to a legacy site when the configured destination could not be validated', async () => {
  jest.mocked(useNetdiveConfiguration).mockReturnValue({ loaded: true, allowDashboardFallback: false });
  const { dashboard } = setup();
  act(() =>
    dashboard.setState({
      links: [
        {
          title: 'Netdive',
          type: 'link',
          url: 'https://legacy.test/',
          targetBlank: true,
          includeVars: false,
          keepTime: false,
          tags: [],
          asDropdown: false,
          icon: 'external link',
          tooltip: '',
        },
      ],
    })
  );
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  expect(fetcher).not.toHaveBeenCalled();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
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

it('verifies a SQL-selected domain through the dashboard identity metric before exposing a UUID link', async () => {
  const variable = new QueryVariable({
    name: 'machine',
    query: 'SELECT instance_name FROM vm_instance',
    value: 'i-2-VM',
  });
  const dashboard = new DashboardScene({
    uid: 'sql-vm-dashboard',
    title: 'VM',
    $variables: new SceneVariableSet({ variables: [variable] }),
    $timeRange: new SceneTimeRange({ from: 'now-1h', to: 'now' }),
    body: new DefaultGridLayoutManager({
      grid: new SceneGridLayout({
        children: [
          new SceneGridItem({
            body: new VizPanel({
              pluginId: 'stat',
              title: 'Identity',
              $data: new SceneQueryRunner({
                datasource: { uid: 'actual-prom', type: 'prometheus' },
                queries: [{ refId: 'A', expr: 'libvirt_domain_info_meta{domain="$machine"}' }],
              }),
            }),
          }),
        ],
      }),
    }),
  });
  render(<WallNetdiveVMControl dashboard={dashboard} />);
  await userEvent.click(screen.getByRole('button', { name: 'Netdive 관계 탐색' }));
  expect(fetcher).toHaveBeenCalledWith(
    expect.objectContaining({ params: { query: 'libvirt_domain_info_meta{domain="i-2-VM"}' } })
  );
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  emit();
  const link = await screen.findByRole('link', { name: 'Netdive 관계 탐색 열기' });
  expect(new URL(link.getAttribute('href')!).searchParams.get('ndID')).toBe(uuid);
  expect(new URL(link.getAttribute('href')!).searchParams.get('wallDashboard')).toBe('sql-vm-dashboard');
});
