import type { DashboardLink } from '@grafana/schema';

/** Netdive UI 3e4c9d4: explicit VM UUIDs only; no hostname/IP identity inference. */
export function vmUUID(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^(?:[a-f\d]{32}|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})$/i.test(value)) {
    return;
  }
  const compact = value.replace(/-/g, '').toLowerCase();
  return /^0+$/.test(compact) ? undefined : compact.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

export function netdiveBase(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return;
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      return;
    }
    if (url.pathname === '/') {
      url.pathname = '/ui_v2/';
    } else if (!/\/ui_v2\/?$/.test(url.pathname)) {
      return;
    }
    url.pathname = url.pathname.replace(/\/?$/, '/');
    return url.href;
  } catch {
    return;
  }
}

export const isNetdiveLink = (link: DashboardLink) =>
  link.type === 'link' && /netdive|skydive|넷다이브|스카이다이브|네트다이브/i.test(link.title);

/** Existing saved dashboard URLs remain authoritative when no central URL exists. */
export function dashboardNetdiveBase(links: DashboardLink[], configured?: string): string | undefined {
  // The installation setting is authoritative for both Rail and object links.
  if (configured) {
    return netdiveBase(configured);
  }
  const bases = new Set(
    links.filter(isNetdiveLink).flatMap((link) => {
      try {
        const url = new URL(link.url ?? '');
        // A saved v1 object link can also supply its UI base; no arbitrary endpoint/return is reused.
        if (
          url.search &&
          (url.searchParams.get('ndv') !== '1' ||
            !['vm', 'graph', 'kubernetes'].includes(url.searchParams.get('ndKind') ?? ''))
        ) {
          return [];
        }
        url.search = '';
        const base = netdiveBase(url.href);
        return base ? [base] : [];
      } catch {
        return [];
      }
    })
  );
  return bases.size === 1 ? [...bases][0] : undefined;
}

/** Only generic launchers duplicate the configured Rail entry. Contextual user links stay native. */
export function isNetdiveLauncher(link: DashboardLink): boolean {
  return isNetdiveLink(link) && Boolean(netdiveBase(link.url)) && !link.includeVars && !link.keepTime;
}

export interface VMVariable {
  type: string;
  name: string;
  query?: unknown;
  value?: unknown;
  loading?: boolean;
  error?: unknown;
  datasource?: { uid?: string; type?: string } | null;
}
export interface VMSelection {
  uuid?: string;
  selector?: string;
  datasource?: { uid?: string; type?: string } | null;
  domain?: string;
  reason?: string;
}
const queryText = (value: unknown): string =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'query' in value && typeof value.query === 'string'
      ? value.query
      : '';

export interface VMIdentityQuery {
  expr?: unknown;
  hide?: boolean;
  datasource?: { uid?: string; type?: string } | null;
}

/** A name is only a lookup key. The actual UUID must come from the same metric
 * and datasource already used by the dashboard's unaggregated identity panel. */
export function selectedVMQuery(variables: VMVariable[], queries: VMIdentityQuery[]): VMSelection | undefined {
  const byUUID = selectedVM(variables);
  if (byUUID) {
    return byUUID;
  }
  const candidates = queries.flatMap((query) => {
    const match =
      typeof query.expr === 'string' &&
      /^\s*libvirt_domain_info_meta\s*\{\s*domain\s*=\s*"\$([a-zA-Z_][a-zA-Z\d_]*)"\s*\}\s*$/.exec(query.expr);
    if (!match || query.hide) {
      return [];
    }
    const variable = variables.find((item) => item.type === 'query' && item.name === match[1]);
    return variable ? [{ variable, datasource: query.datasource }] : [];
  });
  if (!candidates.length) {
    return;
  }
  const identities = new Set(candidates.map(({ variable, datasource }) => JSON.stringify([variable.name, datasource])));
  if (identities.size !== 1) {
    return { reason: 'VM 식별 쿼리 또는 데이터소스가 여러 개여서 대상을 결정할 수 없습니다.' };
  }
  const { variable, datasource } = candidates[0];
  const domain = Array.isArray(variable.value) && variable.value.length === 1 ? variable.value[0] : variable.value;
  if (
    variable.loading ||
    variable.error ||
    typeof domain !== 'string' ||
    !domain ||
    domain.length > 200 ||
    ['$__all', 'All'].includes(domain)
  ) {
    return { reason: '조회가 완료된 단일 VM을 선택하세요. 전체·다중 선택은 연결하지 않습니다.' };
  }
  return { domain, datasource, selector: `libvirt_domain_info_meta{domain=${JSON.stringify(domain)}}` };
}

export function selectedVM(variables: VMVariable[]): VMSelection | undefined {
  const candidates = variables.flatMap((variable) => {
    const match = /^label_values\((libvirt_domain_info_meta(?:\{[^{}\r\n$]*\})?)\s*,\s*uuid\s*\)$/.exec(
      queryText(variable.query).trim()
    );
    return variable.type === 'query' && match ? [{ variable, selector: match[1] }] : [];
  });
  if (!candidates.length) {
    return;
  }
  if (candidates.length !== 1) {
    return { reason: 'UUID 변수가 여러 개여서 대상 VM을 결정할 수 없습니다.' };
  }
  const { variable, selector } = candidates[0];
  if (variable.loading || variable.error) {
    return { reason: 'VM 변수의 조회가 완료된 뒤 다시 확인하세요.' };
  }
  const value = Array.isArray(variable.value) && variable.value.length === 1 ? variable.value[0] : variable.value;
  const uuid = vmUUID(value);
  if (!uuid) {
    return { reason: '유효한 UUID를 가진 단일 VM을 선택하세요. 전체·다중 선택은 연결하지 않습니다.' };
  }
  const domains = variables.filter(
    (item) =>
      item.type === 'query' &&
      queryText(item.query).replace(/\s/g, '') ===
        `label_values(libvirt_domain_info_meta{uuid="$${variable.name}"},domain)`
  );
  if (domains.some((item) => item.loading || item.error) || domains.length > 1) {
    return { reason: 'VM 이름 변수의 조회 또는 식별 근거를 확인하세요.' };
  }
  const domainValue = domains[0]?.value;
  const domain = Array.isArray(domainValue) && domainValue.length === 1 ? domainValue[0] : domainValue;
  if (domains.length && (typeof domain !== 'string' || !domain || domain === '$__all')) {
    return { reason: '선택 UUID에 대응하는 VM 이름을 유일하게 확인할 수 없습니다.' };
  }
  const matcher = `uuid="${uuid}"`;
  const query = selector.endsWith('}')
    ? `${selector.slice(0, -1)}${/[{,]\s*}$/.test(selector) ? '' : ','}${matcher}}`
    : `${selector}{${matcher}}`;
  return {
    uuid,
    selector: query,
    datasource: variable.datasource,
    domain: typeof domain === 'string' ? domain : undefined,
  };
}

export function metricIdentity(result: unknown, uuid: string, expectedDomain?: string): { reason?: string } {
  const { reason } = metricVMIdentity(result, { uuid, domain: expectedDomain });
  return reason ? { reason } : {};
}

export function metricVMIdentity(
  result: unknown,
  expected: Pick<VMSelection, 'uuid' | 'domain'>
): { uuid?: string; reason?: string } {
  if (
    (!expected.uuid && !expected.domain) ||
    !result ||
    typeof result !== 'object' ||
    !('status' in result) ||
    result.status !== 'success' ||
    !('data' in result) ||
    !result.data ||
    typeof result.data !== 'object' ||
    !('result' in result.data) ||
    !Array.isArray(result.data.result)
  ) {
    return { reason: 'Wall 메트릭 조회 결과를 확인할 수 없습니다.' };
  }
  const identities = new Set<string>();
  const uuids = new Set<string>();
  for (const item of result.data.result) {
    const metric = item?.metric;
    const canonical = vmUUID(metric?.uuid);
    if (
      !canonical ||
      (expected.uuid && canonical !== expected.uuid) ||
      typeof metric.domain !== 'string' ||
      !metric.domain ||
      typeof metric.instance !== 'string' ||
      !metric.instance ||
      (expected.domain && metric.domain !== expected.domain)
    ) {
      return { reason: '선택 UUID와 실제 메트릭의 VM 식별 정보가 일치하지 않습니다.' };
    }
    identities.add(JSON.stringify([metric.domain, metric.instance]));
    uuids.add(canonical);
  }
  return identities.size === 1 && uuids.size === 1
    ? { uuid: [...uuids][0] }
    : {
        reason: identities.size
          ? '동일 UUID가 여러 VM 또는 exporter에 있습니다. 자동 연결하지 않습니다.'
          : '현재 메트릭에 해당 VM UUID가 없습니다.',
      };
}

export function vmRelationshipLink(
  base: string,
  uuid: string,
  context: { orgID: number; dashboardUID: string; from: number; to: number }
): DashboardLink | undefined {
  return objectRelationshipLink(base, { kind: 'vm', id: uuid }, context);
}

// Exactly the selectors accepted by Netdive UI 3e4c9d4. Graph IDs must be actual
// collected node IDs; a Mold Host ID/IP/name is not a graph ID. Kubernetes scope
// is the collected kube-system namespace UID, not a cluster display name.
export type NetdiveObject =
  | { kind: 'vm' | 'graph'; id: string }
  | { kind: 'kubernetes'; id: string; clusterUID: string };
export function objectRelationshipLink(
  base: string,
  object: NetdiveObject,
  context: { orgID: number; dashboardUID: string; from: number; to: number }
): DashboardLink | undefined {
  const urlBase = netdiveBase(base),
    canonical = object.kind === 'vm' ? vmUUID(object.id) : object.id;
  const opaqueID = (value: string) => Boolean(value) && value.length <= 200 && !/[\s\x00-\x1f\x7f/?#&]/.test(value);
  if (
    !urlBase ||
    !canonical ||
    !['vm', 'graph', 'kubernetes'].includes(object.kind) ||
    !opaqueID(canonical) ||
    (object.kind === 'kubernetes' && !opaqueID(object.clusterUID)) ||
    !Number.isSafeInteger(context.orgID) ||
    context.orgID <= 0 ||
    context.orgID > 9999999999 ||
    !/^[a-zA-Z\d_-]{1,40}$/.test(context.dashboardUID) ||
    !Number.isSafeInteger(context.from) ||
    !Number.isSafeInteger(context.to) ||
    context.from < 0 ||
    context.to > 8640000000000000 ||
    context.from >= context.to
  ) {
    return;
  }
  const url = new URL(urlBase);
  for (const [key, value] of Object.entries({
    ndv: '1',
    ndKind: object.kind,
    ndID: canonical,
    from: String(context.from),
    to: String(context.to),
    wallDashboard: context.dashboardUID,
    wallOrg: String(context.orgID),
  })) {
    url.searchParams.set(key, value);
  }
  if (object.kind === 'kubernetes') {
    url.searchParams.set('ndClusterUID', object.clusterUID);
  }
  return {
    title: 'Netdive 관계 탐색',
    type: 'link',
    url: url.href,
    targetBlank: true,
    includeVars: false,
    keepTime: false,
    tags: [],
    asDropdown: false,
    icon: 'external link',
    tooltip: '현재 수집된 VM 주변 관계를 새 탭에서 확인합니다.',
  };
}
