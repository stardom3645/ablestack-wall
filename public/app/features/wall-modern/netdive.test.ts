import type { DashboardLink } from '@grafana/schema';

import {
  dashboardNetdiveBase,
  metricIdentity,
  netdiveBase,
  selectedVM,
  selectedVMQuery,
  metricVMIdentity,
  objectRelationshipLink,
  isNetdiveLauncher,
  vmRelationshipLink,
  vmUUID,
  type VMVariable,
} from './netdive';

const uuid = '12345678-1234-1234-1234-123456789abc';
const variable: VMVariable = {
  type: 'query',
  name: 'actual_uuid',
  value: uuid,
  datasource: { uid: 'prom', type: 'prometheus' },
  query: 'label_values(libvirt_domain_info_meta{domain!~"ccvm|scvm"},uuid)',
};
const response = (metrics: Array<Record<string, string>>) => ({
  status: 'success',
  data: { resultType: 'vector', result: metrics.map((metric) => ({ metric, value: [1, '1'] })) },
});
const metric = { uuid, domain: 'i-2-VM', instance: 'agent-a' };

it('uses explicit canonical UUIDs and refuses names, IPs, zero, All and multi values', () => {
  expect(vmUUID(uuid.toUpperCase().replace(/-/g, ''))).toBe(uuid);
  for (const value of ['i-2-VM', '10.0.0.1', '$__all', '', '00000000-0000-0000-0000-000000000000', [uuid, uuid]]) {
    expect(vmUUID(value)).toBeUndefined();
  }
});

it('accepts only configured HTTP UI bases and never invents a host or accepts secrets/return URLs', () => {
  expect(netdiveBase('http://netdive.test:8082')).toBe('http://netdive.test:8082/ui_v2/');
  expect(netdiveBase('https://netdive.test/prefix/ui_v2')).toBe('https://netdive.test/prefix/ui_v2/');
  for (const value of [
    'javascript:alert(1)',
    '//evil.test',
    'https://token@netdive.test/',
    'https://netdive.test/?token=x',
    'https://netdive.test/#x',
    'http://netdive.test/not-ui/',
  ]) {
    expect(netdiveBase(value)).toBeUndefined();
  }
});

it('reuses saved Netdive destinations without changing user links and blocks conflicting environments', () => {
  const links = [
    { title: 'Netdive', type: 'link', url: 'http://netdive.test:8082' },
    { title: 'Runbook', type: 'link', url: 'https://docs.test' },
  ] as DashboardLink[];
  const original = JSON.stringify(links);
  expect(dashboardNetdiveBase(links)).toBe('http://netdive.test:8082/ui_v2/');
  expect(dashboardNetdiveBase(links, 'http://other.test/ui_v2/')).toBe('http://other.test/ui_v2/');
  expect(JSON.stringify(links)).toBe(original);
  expect(dashboardNetdiveBase([], 'http://configured.test/ui_v2/')).toBe('http://configured.test/ui_v2/');
});

it('removes only duplicate generic launchers, retaining contextual and user links', () => {
  const link = { title: 'Netdive', type: 'link', url: 'https://old.test/' } as DashboardLink;
  expect(isNetdiveLauncher(link)).toBe(true);
  expect(isNetdiveLauncher({ ...link, url: 'https://old.test/ui_v2/?ndv=1&ndKind=vm&ndID=uuid' })).toBe(false);
  expect(isNetdiveLauncher({ ...link, includeVars: true })).toBe(false);
  expect(isNetdiveLauncher({ ...link, title: 'Runbook' })).toBe(false);
  expect(dashboardNetdiveBase([link, { ...link, url: 'https://other.test/' }])).toBeUndefined();
});

it('derives the UUID lookup only from an existing unaggregated identity query, never a display name', () => {
  const selected = { type: 'query', name: 'machine', query: 'SELECT instance_name FROM vm_instance', value: 'i-2-VM' };
  const query = { expr: 'libvirt_domain_info_meta{domain="$machine"}', datasource: { uid: 'prom' } };
  expect(selectedVMQuery([selected], [query])).toEqual({
    domain: 'i-2-VM',
    selector: 'libvirt_domain_info_meta{domain="i-2-VM"}',
    datasource: { uid: 'prom' },
  });
  expect(selectedVMQuery([selected], [{ ...query, expr: `count(${query.expr})` }])).toBeUndefined();
  expect(
    selectedVMQuery([selected], [{ ...query, expr: 'libvirt_domain_info_meta{domain=~"$machine"}' }])
  ).toBeUndefined();
  expect(selectedVMQuery([selected], [{ ...query, hide: true }])).toBeUndefined();
  for (const value of ['$__all', 'All', '', ['i-2-VM', 'i-3-VM']]) {
    expect(selectedVMQuery([{ ...selected, value }], [query])?.reason).toBeTruthy();
  }
  expect(selectedVMQuery([selected], [query, { ...query, datasource: { uid: 'other-site' } }])?.reason).toBeTruthy();
  expect(selectedVMQuery([{ ...selected, value: 'quoted"\\name' }], [query])?.selector).toBe(
    'libvirt_domain_info_meta{domain="quoted\\"\\\\name"}'
  );
  expect(metricVMIdentity(response([metric]), { domain: 'i-2-VM' })).toEqual({ uuid });
  expect(
    metricVMIdentity(response([metric, { ...metric, uuid: '22345678-1234-1234-1234-123456789abc' }]), {
      domain: 'i-2-VM',
    }).reason
  ).toBeTruthy();
  expect(metricVMIdentity(response([metric]), { domain: 'another-vm' }).reason).toBeTruthy();
  // An invalid UUID selection must never fall back to the name path.
  expect(selectedVMQuery([{ ...variable, value: '$__all' }, selected], [query])?.reason).toBeTruthy();
});

it('matches the actual graph/Kubernetes contract without inventing host or pod selectors', () => {
  const context = { orgID: 7, dashboardUID: 'source', from: 1000, to: 2000 };
  const graph = objectRelationshipLink('http://netdive.test/', { kind: 'graph', id: 'collected-node-id' }, context)!;
  expect(new URL(graph.url!).searchParams.get('ndKind')).toBe('graph');
  const pod = objectRelationshipLink(
    'http://netdive.test/',
    { kind: 'kubernetes', id: 'pod-uid', clusterUID: 'kube-system-uid' },
    context
  )!;
  expect(new URL(pod.url!).searchParams.get('ndClusterUID')).toBe('kube-system-uid');
  expect(
    objectRelationshipLink('http://netdive.test/', { kind: 'kubernetes', id: 'pod-uid', clusterUID: '' }, context)
  ).toBeUndefined();
  expect(
    objectRelationshipLink('http://netdive.test/', { kind: 'graph', id: '../unsafe?url' }, context)
  ).toBeUndefined();
});

it('recognizes collected UUID queries without hardcoding variable names, preserving static selectors', () => {
  expect(selectedVM([variable])).toMatchObject({
    uuid,
    selector: `libvirt_domain_info_meta{domain!~"ccvm|scvm",uuid="${uuid}"}`,
  });
  expect(
    selectedVM([{ ...variable, query: { query: 'label_values(libvirt_domain_info_meta,uuid)' }, value: [uuid] }])
  ).toMatchObject({ uuid });
  expect(selectedVM([{ ...variable, query: 'SELECT uuid FROM vm_instance' }])).toBeUndefined();
  expect(
    selectedVM([{ ...variable, query: 'label_values(libvirt_domain_info_meta{instance="$host"},uuid)' }])
  ).toBeUndefined();
  expect(selectedVM([{ ...variable, type: 'custom' }])).toBeUndefined();
});

it('blocks ambiguous UUID variables, pending/error values, All/multi selection and inconsistent domain evidence', () => {
  expect(selectedVM([variable, { ...variable, name: 'other' }])?.reason).toBeTruthy();
  for (const value of ['$__all', '', 'not-a-uuid', [uuid, uuid]]) {
    expect(selectedVM([{ ...variable, value }])?.reason).toBeTruthy();
  }
  expect(selectedVM([{ ...variable, loading: true }])?.reason).toBeTruthy();
  expect(selectedVM([{ ...variable, error: 'denied' }])?.reason).toBeTruthy();
  expect(
    selectedVM([
      variable,
      {
        type: 'query',
        name: 'domain',
        query: 'label_values(libvirt_domain_info_meta{uuid="$actual_uuid"},domain)',
        value: ['vm-a', 'vm-b'],
      },
    ])?.reason
  ).toBeTruthy();
});

it.each([
  ['{}', `{uuid="${uuid}"}`],
  ['{ }', `{ uuid="${uuid}"}`],
  ['{\t}', `{\tuuid="${uuid}"}`],
  ['{domain="vm-a" }', `{domain="vm-a" ,uuid="${uuid}"}`],
  ['{domain="vm-a", }', `{domain="vm-a", uuid="${uuid}"}`],
  ['{domain=~"vm-a,vm-b"}', `{domain=~"vm-a,vm-b",uuid="${uuid}"}`],
])('preserves valid selector %s when adding the UUID matcher', (selector, expected) => {
  expect(selectedVM([{ ...variable, query: `label_values(libvirt_domain_info_meta${selector},uuid)` }])?.selector).toBe(
    `libvirt_domain_info_meta${expected}`
  );
});

it('checks actual current metric UUID/domain/exporter identity and refuses missing, duplicates and mismatches', () => {
  expect(metricIdentity(response([metric]), uuid, metric.domain)).toEqual({});
  expect(metricIdentity(response([metric, { ...metric, instance: 'agent-b' }]), uuid).reason).toBeTruthy();
  expect(metricIdentity(response([metric, { ...metric, domain: 'another-vm' }]), uuid).reason).toBeTruthy();
  expect(metricIdentity(response([metric]), uuid, 'different-selected-domain').reason).toBeTruthy();
  expect(metricIdentity(response([{ ...metric, uuid: 'another-uuid' }]), uuid).reason).toBeTruthy();
  expect(metricIdentity(response([]), uuid).reason).toBeTruthy();
  expect(metricIdentity({ status: 'error' }, uuid).reason).toBeTruthy();
});

it('builds exactly the supported Netdive v1 contract with actual organization/time/dashboard and no credentials', () => {
  const link = vmRelationshipLink('http://netdive.test:8082/ui_v2/', uuid, {
    orgID: 7,
    dashboardUID: 'actual-dashboard',
    from: 1000,
    to: 2000,
  })!;
  const url = new URL(link.url!);
  expect(Object.fromEntries(url.searchParams)).toEqual({
    ndv: '1',
    ndKind: 'vm',
    ndID: uuid,
    from: '1000',
    to: '2000',
    wallDashboard: 'actual-dashboard',
    wallOrg: '7',
  });
  expect(link).toMatchObject({ targetBlank: true, includeVars: false, keepTime: false });
  expect(
    vmRelationshipLink('http://netdive.test', uuid, { orgID: 0, dashboardUID: 'valid', from: 1000, to: 2000 })
  ).toBeUndefined();
  expect(
    vmRelationshipLink('http://netdive.test', uuid, { orgID: 1, dashboardUID: '../other', from: 1000, to: 2000 })
  ).toBeUndefined();
  expect(
    vmRelationshipLink('http://netdive.test', uuid, { orgID: 1, dashboardUID: 'valid', from: 2000, to: 1000 })
  ).toBeUndefined();
});
