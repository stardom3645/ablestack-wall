import type { DashboardLink } from '@grafana/schema';

import {
  dashboardNetdiveBase,
  metricIdentity,
  netdiveBase,
  selectedVM,
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
  expect(dashboardNetdiveBase(links, 'http://other.test/ui_v2/')).toBeUndefined();
  expect(JSON.stringify(links)).toBe(original);
  expect(dashboardNetdiveBase([], 'http://configured.test/ui_v2/')).toBe('http://configured.test/ui_v2/');
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
