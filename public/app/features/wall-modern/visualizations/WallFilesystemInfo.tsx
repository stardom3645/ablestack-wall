import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

import { Field, getFieldDisplayName, LoadingState } from '@grafana/data';

import { wallSurfaceTokens } from '../surfaceTokens';
import { Button } from '../ui';

import type { WallDisplayProps } from './WallPanelContent';
import { capacityRelation, metricField, usageFraction } from './model';

import './filesystem.css';

const layout = {
  minHeight: 104,
  maxHeight: 360,
  chromeHeight: wallSurfaceTokens.headerHeight + wallSurfaceTokens.padding * 2 + 2,
};

/** One information record or a compact table of every transformed filesystem row; no frame selector. */
export function WallFilesystemInfo({
  panel,
  onHeight,
  renderValue,
}: {
  panel: WallDisplayProps;
  onHeight?: (height: number) => void;
  renderValue: (field: Field, row: number) => ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<{ key: string; descending: boolean }>();
  const frames = panel.data.series.map((frame) => {
    const occurrences = new Map<string, number>();
    return {
      frame,
      columns: frame.fields.map((field) => {
        const label = getFieldDisplayName(field, frame);
        const name = JSON.stringify([field.name, label]);
        const occurrence = occurrences.get(name) ?? 0;
        occurrences.set(name, occurrence + 1);
        return { key: `${name}:${occurrence}`, label, field };
      }),
    };
  });
  const rows = frames.flatMap(({ frame, columns }, frameIndex) =>
    Array.from({ length: frame.fields.length ? frame.length : 0 }, (_, row) => {
      const total = metricField(frame, 'A');
      const used = metricField(frame, 'B');
      const usage = metricField(frame, 'C');
      const relation = capacityRelation(total?.values[row], used?.values[row]);
      const ratio = usageFraction(usage?.values[row], usage?.config.unit);
      const notice =
        usage && ratio === undefined
          ? '원본 사용률이 유효 범위를 벗어났습니다.'
          : total && used && !relation
            ? '용량 합계 또는 사용량 관계 확인 필요'
            : ratio !== undefined && relation && Math.abs(ratio - relation.ratio) > 1e-6
              ? '원본 사용률과 용량 관계가 일치하지 않습니다.'
              : undefined;
      return { frame, columns, frameIndex, row, notice };
    })
  );
  const columns = [
    ...new Map(frames.flatMap(({ columns }) => columns.map((column) => [column.key, column] as const))).values(),
  ];
  const ordered = sort
    ? [...rows].sort((a, b) => {
        const av = a.columns.find(({ key }) => key === sort.key)?.field.values[a.row];
        const bv = b.columns.find(({ key }) => key === sort.key)?.field.values[b.row];
        const order =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'ko', { numeric: true });
        return sort.descending ? -order : order;
      })
    : rows;
  // Distinct one-value frames are key-value metrics, not multiple filesystem records.
  const scalarRecords =
    rows.length <= 6 &&
    rows.every(({ columns }) => columns.length === 1) &&
    new Set(rows.map(({ columns }) => columns[0].key)).size === rows.length;
  const multiple = rows.length > 1 && !scalarRecords;
  const multipleFrames = frames.filter(({ frame }) => frame.length > 0).length > 1;
  const hasNotices = rows.some(({ notice }) => notice);

  useLayoutEffect(() => {
    const element = content.current;
    if (!element) {
      return;
    }
    const measure = () =>
      onHeight?.(Math.min(layout.maxHeight, Math.max(layout.minHeight, element.scrollHeight + layout.chromeHeight)));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeight, multiple, rows.length, columns.length]);

  return (
    <div
      className="wall-filesystem-info"
      data-wall-display="filesystem"
      data-wall-filesystem-mode={multiple ? 'table' : 'information'}
      data-wall-filesystem-fields={columns.length}
    >
      <div ref={content}>
        {!rows.length ? (
          <div className="wall-data-note">
            {panel.data.state === LoadingState.Loading ? '조회 중…' : '표시할 데이터가 없습니다.'}
          </div>
        ) : multiple ? (
          <table className="wall-filesystem-table" aria-label={panel.title}>
            <thead>
              <tr>
                {multipleFrames && <th scope="col">데이터</th>}
                {columns.map(({ key, label }) => (
                  <th
                    scope="col"
                    key={key}
                    aria-sort={sort?.key === key ? (sort.descending ? 'descending' : 'ascending') : 'none'}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSort({ key, descending: sort?.key === key ? !sort.descending : false })}
                    >
                      {label}
                      {sort?.key === key ? (sort.descending ? ' ↓' : ' ↑') : ''}
                    </Button>
                  </th>
                ))}
                {hasNotices && <th scope="col">데이터 확인</th>}
              </tr>
            </thead>
            <tbody>
              {ordered.map(({ frame, frameIndex, row, columns: fields, notice }) => (
                <tr key={`${frameIndex}-${row}`}>
                  {multipleFrames && <td>{frame.name ?? frame.refId ?? `데이터 ${frameIndex + 1}`}</td>}
                  {columns.map(({ key }) => {
                    const field = fields.find((column) => column.key === key)?.field;
                    return <td key={key}>{field ? renderValue(field, row) : '—'}</td>;
                  })}
                  {hasNotices && <td className="wall-filesystem-notice">{notice ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <dl className="wall-filesystem-information">
              {rows.flatMap(({ columns, row, frameIndex }) =>
                columns.map(({ key, label, field }) => (
                  <div key={`${frameIndex}-${row}-${key}`}>
                    <dt>{label}</dt>
                    <dd>{renderValue(field, row)}</dd>
                  </div>
                ))
              )}
            </dl>
            {rows.map(
              ({ notice, frameIndex, row }) =>
                notice && (
                  <p key={`${frameIndex}-${row}`} className="wall-filesystem-notice">
                    {notice}
                  </p>
                )
            )}
          </>
        )}
      </div>
    </div>
  );
}
