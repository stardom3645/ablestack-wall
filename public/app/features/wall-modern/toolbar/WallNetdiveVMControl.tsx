import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { timeout } from 'rxjs/operators';

import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { QueryVariable, sceneGraph } from '@grafana/scenes';
import { Trans } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import type { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { getLinkSrv } from 'app/features/panel/panellinks/link_srv';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { dashboardNetdiveBase, metricIdentity, selectedVM, vmRelationshipLink } from '../netdive';
import { Button } from '../ui';
import { useNetdiveURL } from '../useNetdiveURL';

/** One dashboard context action. Native panel/data/user links and models stay untouched. */
export function WallNetdiveVMControl({ dashboard }: { dashboard: DashboardScene }) {
  const configuredURL = useNetdiveURL();
  const { links, uid } = dashboard.useState();
  const { variables } = sceneGraph.getVariables(dashboard).useState();
  const time = sceneGraph.getTimeRange(dashboard).useState().value;
  const [, revise] = useState(0);
  useEffect(() => {
    const subscriptions = variables.map((variable) =>
      variable.subscribeToState(() => revise((revision) => revision + 1))
    );
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [variables]);
  const selection = selectedVM(
    variables
      .filter((variable): variable is QueryVariable => variable instanceof QueryVariable)
      .map((variable) => variable.state)
  );
  const base = dashboardNetdiveBase(links ?? [], configuredURL);
  const [open, setOpen] = useState(false),
    [retry, setRetry] = useState(0);
  const [verified, setVerified] = useState<string>(),
    [reason, setReason] = useState('');
  const [checking, setChecking] = useState(false);
  const source = selection?.datasource ? getDataSourceSrv().getInstanceSettings(selection.datasource) : undefined;
  const uuid = selection?.uuid,
    selector = selection?.selector,
    domain = selection?.domain;
  const sourceUID = source?.type === 'prometheus' ? source.uid : undefined;
  const orgID = contextSrv.user.orgId;
  const identityKey = JSON.stringify([base, uuid, sourceUID, selector, domain, selection?.reason, orgID, uid]);
  useEffect(() => {
    setVerified(undefined);
    setReason('');
    setChecking(false);
    if (!open || !base || !uuid || !selector || selection?.reason) {
      return;
    }
    if (!Number.isSafeInteger(orgID) || orgID <= 0) {
      setReason('현재 Wall 조직을 확인할 수 없습니다.');
      return;
    }
    if (!sourceUID) {
      setReason('UUID 변수의 Prometheus 데이터소스를 확인할 수 없습니다.');
      return;
    }
    let active = true;
    setChecking(true);
    const subscription = getBackendSrv()
      .fetch<unknown>({
        url: `/api/datasources/proxy/uid/${encodeURIComponent(sourceUID)}/api/v1/query`,
        method: 'GET',
        params: { query: selector },
        showErrorAlert: false,
        headers: { 'X-Grafana-Org-Id': String(orgID) },
      })
      .pipe(timeout(12000))
      .subscribe({
        next: (response) => {
          if (!active) {
            return;
          }
          const result = metricIdentity(response.data, uuid, domain);
          setReason(result.reason ?? '');
          setVerified(result.reason ? undefined : identityKey);
          setChecking(false);
        },
        error: () => {
          if (active) {
            setReason('메트릭 접근 권한 또는 연결을 확인하세요. 검증 없이 객체를 연결하지 않습니다.');
            setChecking(false);
          }
        },
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [open, retry, identityKey, base, uuid, selector, sourceUID, domain, selection?.reason, orgID]);
  if (!selection) {
    return null;
  }
  const link =
    verified === identityKey && base && uuid && uid
      ? vmRelationshipLink(base, uuid, {
          orgID,
          dashboardUID: uid,
          from: time.from.valueOf(),
          to: time.to.valueOf(),
        })
      : undefined;
  const anchor = link ? getLinkSrv().getAnchorInfo(link) : undefined;
  const message = !base
    ? 'Netdive URL이 없거나 기존 링크와 설정이 일치하지 않습니다. 관리자에게 설정을 확인하세요.'
    : selection.reason || reason || (!checking && !link ? 'Wall 조직·대시보드·시간 범위를 확인하세요.' : undefined);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" />} aria-label="Netdive 관계 탐색">
        <ExternalLink size={16} />
        <Trans i18nKey="wall.netdive.vm-relationship">관계 탐색</Trans>
      </PopoverTrigger>
      <PopoverContent title="Netdive 관계 탐색" aria-label="Netdive VM 관계 탐색" className="wall-scope-popover">
        {checking ? (
          <p role="status">
            <Trans i18nKey="wall.netdive.checking">VM UUID와 실제 메트릭을 확인하고 있습니다.</Trans>
          </p>
        ) : message ? (
          <p role="status">{message}</p>
        ) : (
          anchor && (
            <Button
              render={
                <a href={anchor.href} target="_blank" rel="noopener noreferrer" aria-label="Netdive 관계 탐색 열기" />
              }
              nativeButton={false}
              role="link"
            >
              <ExternalLink size={16} />
              <Trans i18nKey="wall.netdive.open-relationship">Netdive 관계 탐색 열기</Trans>
            </Button>
          )
        )}
        <p className="wall-toolbar-help">
          <Trans i18nKey="wall.netdive.current-graph">
            시간 범위는 Wall 복귀에 유지됩니다. 관계는 Netdive의 현재 수집·권한·중복 확인을 따릅니다.
          </Trans>
        </p>
        {!checking && reason && (
          <Button variant="ghost" onClick={() => setRetry((value) => value + 1)}>
            <Trans i18nKey="wall.netdive.retry">다시 확인</Trans>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
