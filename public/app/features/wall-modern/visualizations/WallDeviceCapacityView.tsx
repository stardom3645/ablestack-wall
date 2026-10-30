import { Menu } from '@base-ui/react/menu';
import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { Field, getFieldDisplayName, LoadingState } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypographyVariables } from '../typography';
import { Button } from '../ui';

import type { WallDisplayProps } from './WallPanelContent';
import { capacityRelation, metricField, usageFraction } from './model';

import './deviceCapacity.css';

/** Use only associations already established by Grafana transformations, never join frames by position/name. */
export function WallDeviceCapacityView({
  panel,
  onHeight,
  renderValue,
  renderBar,
}: {
  panel: WallDisplayProps;
  onHeight?: (height: number) => void;
  renderValue: (field: Field, row: number) => ReactNode;
  renderBar: (ratio: number, field: Field, row: number) => ReactNode;
}) {
  const theme = useTheme2();
  const content = useRef<HTMLDivElement>(null);
  const [sortField, setSortField] = useState('');
  const [descending, setDescending] = useState(false);
  const rows = panel.data.series.flatMap((frame, frameIndex) =>
    Array.from({ length: frame.length }, (_, row) => ({ frame, row, frameIndex }))
  );
  const sortFields = [
    ...new Map(
      panel.data.series.flatMap((frame) =>
        frame.fields.map((field) => [field.name, getFieldDisplayName(field, frame)] as const)
      )
    ).entries(),
  ];
  const ordered = sortField
    ? [...rows].sort((a, b) => {
        const av = a.frame.fields.find((field) => field.name === sortField)?.values[a.row];
        const bv = b.frame.fields.find((field) => field.name === sortField)?.values[b.row];
        const order =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'ko', { numeric: true });
        return descending ? -order : order;
      })
    : rows;

  useLayoutEffect(() => {
    const element = content.current;
    if (!element) {
      return;
    }
    const measure = () =>
      onHeight?.(
        Math.min(
          560,
          Math.max(112, element.scrollHeight + wallSurfaceTokens.headerHeight + wallSurfaceTokens.padding * 2 + 2)
        )
      );
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeight, rows.length]);

  return (
    <div className="wall-device-capacity" data-wall-display="devices">
      <div ref={content}>
        {rows.length > 1 && (
          <div className="wall-device-capacity-tools">
            <span>{rows.length}개 항목</span>
            <div>
              <Menu.Root>
                <Menu.Trigger render={<Button size="sm" variant="ghost" />} aria-label="정렬 필드 선택">
                  정렬: {sortFields.find(([name]) => name === sortField)?.[1] ?? '기본 순서'}
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner className="wall-toolbar-positioner">
                    <Menu.Popup
                      className="wall-modern wall-toolbar-popover wall-interval-menu"
                      data-wall-theme={theme.isDark ? 'dark' : 'light'}
                      data-wall-typography="storage-vm"
                      style={wallTypographyVariables}
                    >
                      <Menu.RadioGroup value={sortField} onValueChange={setSortField}>
                        {[['', '기본 순서'], ...sortFields].map(([key, label]) => (
                          <Menu.RadioItem className="wall-toolbar-menu-item" key={key} value={key} closeOnClick>
                            {label}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
              {sortField && (
                <Button size="sm" variant="ghost" onClick={() => setDescending(!descending)}>
                  {descending ? '내림차순' : '오름차순'}
                </Button>
              )}
            </div>
          </div>
        )}
        {!rows.length && (
          <div className="wall-data-note">
            {panel.data.state === LoadingState.Loading ? '조회 중…' : '표시할 데이터가 없습니다.'}
          </div>
        )}
        {ordered.map(({ frame, row, frameIndex }) => {
          const identity = frame.fields.find((field) => field.name === 'ceph_daemon');
          const total = metricField(frame, 'A');
          const used = metricField(frame, 'B');
          const usage = metricField(frame, 'C');
          const ratio = usage ? usageFraction(usage.values[row], usage.config.unit) : undefined;
          const relation = capacityRelation(total?.values[row], used?.values[row]);
          const inconsistent = relation && ratio !== undefined && Math.abs(relation.ratio - ratio) > 1e-6;
          const notice =
            usage && ratio === undefined
              ? `원본 사용률이 유효 범위를 벗어났거나 단위를 확인할 수 없습니다. 원본 ${String(usage.values[row])} · 단위 ${usage.config.unit ?? '없음'}`
              : total && used && !relation
                ? '전체 용량과 사용 용량의 원본 관계를 확인해야 합니다.'
                : inconsistent
                  ? '원본 사용률과 용량 관계가 일치하지 않습니다.'
                  : !total || !used || !usage
                    ? '이 데이터 행에 없는 용량·사용률은 다른 프레임과 임의로 결합하지 않았습니다.'
                    : undefined;
          const extras = frame.fields.filter((field) => ![identity, total, used, usage].includes(field));
          return (
            <article className="wall-device-capacity-row" key={`${frameIndex}-${row}`}>
              <div className="wall-device-capacity-identity">
                <span>{identity ? getFieldDisplayName(identity, frame) : '디바이스 식별 정보 없음'}</span>
                <strong>
                  {identity
                    ? renderValue(identity, row)
                    : `${frame.name ?? frame.refId ?? `데이터 ${frameIndex + 1}`} · 행 ${row + 1}`}
                </strong>
                {panel.data.series.length > 1 && identity && (
                  <small>{frame.name ?? frame.refId ?? `데이터 ${frameIndex + 1}`}</small>
                )}
              </div>
              <dl className="wall-device-capacity-values">
                <div>
                  <dt>{total ? getFieldDisplayName(total, frame) : '전체 용량'}</dt>
                  <dd>{total ? renderValue(total, row) : '—'}</dd>
                </div>
                <div>
                  <dt>{used ? getFieldDisplayName(used, frame) : '사용 용량'}</dt>
                  <dd>{used ? renderValue(used, row) : '—'}</dd>
                </div>
                <div className="wall-device-capacity-usage">
                  <dt>{usage ? getFieldDisplayName(usage, frame) : '사용률'}</dt>
                  <dd>{usage ? renderValue(usage, row) : '—'}</dd>
                  {usage && ratio !== undefined && !notice && renderBar(ratio, usage, row)}
                </div>
              </dl>
              {notice && <p className="wall-device-capacity-notice">{notice}</p>}
              {extras.length > 0 && (
                <dl className="wall-device-capacity-extra">
                  {extras.map((field, index) => (
                    <div key={index}>
                      <dt>{getFieldDisplayName(field, frame)}</dt>
                      <dd>{renderValue(field, row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
