import { Menu } from '@base-ui/react/menu';
import { TriangleAlert } from 'lucide-react';
import { createContext, ReactNode, useContext, useState, useEffect, useLayoutEffect, useRef } from 'react';

import {
  FieldDisplay,
  Field,
  FieldConfig,
  FieldType,
  getFieldDisplayName,
  getFieldDisplayValues,
  LoadingState,
  PanelProps,
  ReduceDataOptions,
} from '@grafana/data';
import { getValueMappingResult } from '@grafana/data/src/utils/valueMappings';
import { DataLinksContextMenu, useTheme2 } from '@grafana/ui';
import { FormattedValueDisplay } from '@grafana/ui/src/components/FormattedValueDisplay/FormattedValueDisplay';
import { presentValueColor } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallSurfaceTokens } from '../surfaceTokens';
import { wallTypography, wallTypographyVariables } from '../typography';
import { Button } from '../ui';
import { wallVisualization } from '../visualization';
import { WallPanelHeader } from '../workspace/PanelActionDock';

import { WallDeviceCapacityView } from './WallDeviceCapacityView';
import { WallFilesystemInfo } from './WallFilesystemInfo';
import {
  capacityRelation,
  fieldText,
  metricField,
  rowIdentity,
  usageFraction,
  thresholdMarks,
  WallDisplayKind,
} from './model';
import './visualizations.css';

export const WallPanelContentContext = createContext<
  { kind: WallDisplayKind; onHeight?: (height: number) => void } | undefined
>(undefined);
export type WallDisplayProps = Pick<
  PanelProps,
  'id' | 'title' | 'data' | 'fieldConfig' | 'replaceVariables' | 'timeZone' | 'timeRange' | 'width' | 'height'
> & { options: unknown };

/** Native plugin props already contain transformations, overrides, display processors and link suppliers. */
export function WallPanelContent({ panel, children }: { panel: WallDisplayProps; children: ReactNode }) {
  const view = useContext(WallPanelContentContext);
  const options = panel.options as {
    graphMode?: string;
    showPercentChange?: boolean;
    textMode?: string;
    footer?: { show?: boolean };
  };
  const unsupported =
    (options.graphMode && options.graphMode !== 'none') ||
    options.showPercentChange ||
    ['name', 'none'].includes(options.textMode ?? '') ||
    options.footer?.show;
  return view && !unsupported ? (
    <WallDataDisplay kind={view.kind} panel={panel} onHeight={view.onHeight} />
  ) : (
    <>{children}</>
  );
}

function MetricLinks({ value, children }: { value: FieldDisplay; children: ReactNode }) {
  return value.hasLinks && value.getLinks ? (
    <DataLinksContextMenu links={value.getLinks}>
      {(api) => (
        <Button variant="ghost" onClick={api.openMenu} className={api.targetClassName}>
          {children}
        </Button>
      )}
    </DataLinksContextMenu>
  ) : (
    <>{children}</>
  );
}

function EntityValue({ field, row }: { field: Field; row: number }) {
  const theme = useTheme2();
  const text = fieldText(field, row, theme);
  const getLinks = field.getLinks ? () => field.getLinks!({ valueRowIndex: row }) : undefined;
  return getLinks && getLinks().length ? (
    <DataLinksContextMenu links={getLinks}>
      {(api) => (
        <Button variant="ghost" onClick={api.openMenu} className={api.targetClassName}>
          {text}
        </Button>
      )}
    </DataLinksContextMenu>
  ) : (
    <>{text}</>
  );
}

function MetricValue({
  value,
  size = 'body',
  colored = false,
}: {
  value: FieldDisplay;
  size?: 'body' | 'kpi' | 'usage';
  colored?: boolean;
}) {
  const theme = useTheme2();
  const content = (
    <FormattedValueDisplay
      value={value.display}
      className={`wall-data-value wall-data-value-${size === 'kpi' && !Number.isFinite(value.display.numeric) ? 'body' : size}`}
      unitStyle={{ fontSize: wallTypography.roles.unit.size, fontWeight: wallTypography.roles.unit.weight }}
    />
  );
  return (
    <MetricLinks value={value}>
      <span
        style={{
          color:
            size === 'kpi' || !colored
              ? undefined
              : presentValueColor(value.display.color, wallVisualization(theme, wallTypography.family)),
        }}
      >
        {content}
      </span>
    </MetricLinks>
  );
}

/** Reuses the Gauge's reduced display value, unit, threshold color and original data links. */
function CompactUsageBar({ value, showLabel, title }: { value: FieldDisplay; showLabel: boolean; title?: string }) {
  const ratio = usageFraction(value.display.numeric, value.field.unit);
  return (
    <div className="wall-data-metric">
      {showLabel && <span className="wall-data-label">{value.display.title ?? value.name}</span>}
      {title ? (
        <WallPanelHeader
          title={<h3 className="wall-data-title">{title}</h3>}
          value={<MetricValue value={value} size="usage" colored />}
        />
      ) : (
        <MetricValue value={value} size="usage" colored />
      )}
      <CapacityTrack ratio={ratio} color={value.display.color} field={value.field} />
      {ratio === undefined && <span className="wall-data-note">비율 범위 밖 또는 데이터 없음</span>}
    </div>
  );
}

function EmptyMetric({ kind, panel }: { kind: WallDisplayKind; panel: WallDisplayProps }) {
  const text = panel.data.state === LoadingState.Loading ? '조회 중…' : '표시할 데이터가 없습니다.';
  return kind === 'service' || kind === 'usage' ? (
    <div className="wall-data-metrics wall-data-service">
      <WallPanelHeader
        title={<h3 className="wall-data-title">{panel.title}</h3>}
        value={<span className="wall-data-note">{text}</span>}
      />
    </div>
  ) : (
    <div className="wall-data-empty">{text}</div>
  );
}

function WallDataDisplay({
  kind,
  panel,
  onHeight,
}: {
  kind: WallDisplayKind;
  panel: WallDisplayProps;
  onHeight?: (height: number) => void;
}) {
  const theme = useTheme2();
  useEffect(() => {
    if (kind === 'records' && !panel.data.series.length) {
      onHeight?.(132);
    }
  }, [kind, panel.data.series.length, onHeight]);
  if (kind === 'devices') {
    return (
      <WallDeviceCapacityView
        panel={panel}
        onHeight={onHeight}
        renderValue={(field, row) => <EntityValue field={field} row={row} />}
        renderBar={(ratio, field, row) => (
          <CapacityTrack ratio={ratio} color={field.display?.(field.values[row]).color} field={field.config} />
        )}
      />
    );
  }
  if (kind === 'filesystem') {
    return (
      <WallFilesystemInfo
        panel={panel}
        onHeight={onHeight}
        renderValue={(field, row) => <EntityValue field={field} row={row} />}
      />
    );
  }
  if (!panel.data.series.length) {
    return <EmptyMetric kind={kind} panel={panel} />;
  }
  if (kind === 'records') {
    return <WallEntityList panel={panel} kind={kind} onHeight={onHeight} />;
  }
  const options = panel.options as { reduceOptions?: ReduceDataOptions; colorMode?: string };
  const values = getFieldDisplayValues({
    data: panel.data.series,
    fieldConfig: panel.fieldConfig,
    replaceVariables: panel.replaceVariables,
    reduceOptions: options.reduceOptions ?? { calcs: ['lastNotNull'], values: false },
    theme,
    timeZone: panel.timeZone,
  });
  if (!values.length) {
    return <EmptyMetric kind={kind} panel={panel} />;
  }
  if (kind === 'usage') {
    return (
      <div className="wall-data-metrics wall-data-usage" data-wall-display="usage">
        {values.length > 1 && <WallPanelHeader title={<h3 className="wall-data-title">{panel.title}</h3>} />}
        {values.map((value, i) => (
          <CompactUsageBar
            value={value}
            showLabel={values.length > 1}
            title={values.length === 1 ? panel.title : undefined}
            key={i}
          />
        ))}
      </div>
    );
  }
  if (kind === 'capacity') {
    const find = (ref: string) =>
      values.find(
        (value) =>
          value.name === { A: '전체', B: '사용중', C: '사용 가능' }[ref] ||
          value.display.title === { A: '전체', B: '사용중', C: '사용 가능' }[ref]
      );
    const total = find('A');
    const used = find('B');
    const available = find('C');
    const relation = capacityRelation(total?.display.numeric, used?.display.numeric, available?.display.numeric);
    return (
      <div className="wall-capacity-display">
        <CapacityTrack ratio={relation?.ratio} />
        <div className="wall-capacity-values">
          {values.map((value, i) => (
            <div key={i}>
              <span className="wall-data-label">{value.display.title ?? value.name}</span>
              <MetricValue value={value} />
            </div>
          ))}
        </div>
        {!relation && <DataNotice>용량 관계를 확인할 수 없습니다. 원본 값을 표시합니다.</DataNotice>}
      </div>
    );
  }
  const metrics = values.map((value, i) => {
    const mapping = getValueMappingResult(value.field.mappings ?? [], value.display.numeric);
    const status = mapping?.text ?? value.display.text;
    return (
      <div className="wall-data-metric" key={i}>
        {values.length > 1 && <span className="wall-data-label">{value.display.title ?? value.name}</span>}
        {kind === 'service' ? (
          <MetricLinks value={value}>
            <span
              className="wall-service-state"
              data-wall-state-known={Boolean(mapping)}
              style={{
                color: mapping
                  ? presentValueColor(value.display.color, wallVisualization(theme, wallTypography.family))
                  : theme.colors.text.secondary,
              }}
              title={`원본 값: ${value.display.numeric}`}
            >
              <span className="wall-state-dot" />
              {status}
            </span>
          </MetricLinks>
        ) : (
          <MetricValue value={value} size={kind === 'kpi' ? 'kpi' : 'body'} colored={options.colorMode === 'value'} />
        )}
      </div>
    );
  });
  return (
    <div className={`wall-data-metrics wall-data-${kind}`} data-wall-display={kind}>
      {kind === 'service' ? (
        <WallPanelHeader title={<h3 className="wall-data-title">{panel.title}</h3>} value={metrics} />
      ) : (
        metrics
      )}
    </div>
  );
}

function DataNotice({ children }: { children: ReactNode }) {
  const theme = useTheme2();
  return (
    <p className="wall-data-note wall-data-warning" role="status" style={{ color: theme.colors.warning.text }}>
      <TriangleAlert size={12} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function CapacityTrack({ ratio, color, field }: { ratio?: number; color?: string; field?: FieldConfig }) {
  const theme = useTheme2();
  return (
    <div
      className="wall-capacity-track"
      role={ratio === undefined ? undefined : 'meter'}
      aria-label="사용 비율"
      aria-valuenow={ratio === undefined ? undefined : ratio * 100}
      aria-valuemin={ratio === undefined ? undefined : 0}
      aria-valuemax={ratio === undefined ? undefined : 100}
    >
      {ratio !== undefined && (
        <>
          <span style={{ width: `${ratio * 100}%`, background: color }} />
          {field &&
            thresholdMarks(field).map((mark, i) => (
              <i
                key={i}
                className="wall-capacity-threshold"
                title={`임계치 ${mark.ratio * 100}%`}
                style={{ left: `${mark.ratio * 100}%`, background: theme.visualization.getColorByName(mark.color) }}
              />
            ))}
        </>
      )}
    </div>
  );
}

/** Every transformed frame, row and field is retained, including unknown/new fields. */
function WallEntityList({
  panel,
  kind,
  onHeight,
}: {
  panel: WallDisplayProps;
  kind: WallDisplayKind;
  onHeight?: (height: number) => void;
}) {
  const theme = useTheme2();
  const [sortDescending, setSortDescending] = useState(false);
  const [sortField, setSortField] = useState('');
  const rows = panel.data.series.flatMap((frame, frameIndex) =>
    Array.from({ length: frame.length }, (_, row) => ({ frame, row, frameIndex }))
  );
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) {
      return;
    }
    const chrome = wallSurfaceTokens.headerHeight + wallSurfaceTokens.padding * 2 + 2;
    const measure = () => onHeight?.(Math.min(560, Math.max(150, element.scrollHeight + chrome)));
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [rows.length, kind, onHeight]);
  const ordered = sortField
    ? [...rows].sort((a, b) => {
        const av = a.frame.fields.find((f) => f.name === sortField)?.values[a.row];
        const bv = b.frame.fields.find((f) => f.name === sortField)?.values[b.row];
        const order =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av ?? '').localeCompare(String(bv ?? ''), 'ko', { numeric: true });
        return sortDescending ? -order : order;
      })
    : rows;
  const sortFields = [
    ...new Map(
      panel.data.series.flatMap((frame) =>
        frame.fields.map((field) => [field.name, getFieldDisplayName(field, frame)] as const)
      )
    ).entries(),
  ];
  return (
    <div className="wall-entity-list" data-wall-display={kind}>
      <div ref={content} className="wall-entity-content">
        <div className="wall-entity-list-heading">
          <span>{rows.length}개 항목</span>
          <div className="wall-entity-sort">
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
              <Button size="sm" variant="ghost" onClick={() => setSortDescending(!sortDescending)}>
                {sortDescending ? '내림차순' : '오름차순'}
              </Button>
            )}
          </div>
        </div>
        {ordered.map(({ frame, row, frameIndex }) => {
          const a = metricField(frame, 'A');
          const b = metricField(frame, 'B');
          const c = metricField(frame, 'C');
          const relation = capacityRelation(a?.values[row], b?.values[row]);
          const ratio = c ? usageFraction(c.values[row], c.config.unit) : undefined;
          const inconsistent = ratio !== undefined && relation !== undefined && Math.abs(ratio - relation.ratio) > 1e-6;
          const identityField =
            frame.fields.find((field) => field.name === 'ceph_daemon' || field.name === 'mountpoint') ??
            frame.fields.find((field) => field.type === FieldType.string);
          return (
            <article
              className={`wall-entity-row ${kind === 'records' ? 'wall-entity-record' : ''}`}
              key={`${frameIndex}-${row}`}
            >
              <div className="wall-entity-identity">
                {panel.data.series.length > 1 && (
                  <div className="wall-data-label">{frame.name ?? frame.refId ?? `데이터 ${frameIndex + 1}`}</div>
                )}
                {identityField && <div className="wall-data-label">{getFieldDisplayName(identityField, frame)}</div>}
                <div className="wall-entity-title">
                  {identityField ? <EntityValue field={identityField} row={row} /> : rowIdentity(frame, row)}
                </div>
              </div>
              {(kind === 'devices' || kind === 'filesystem') && (
                <CapacityTrack
                  ratio={inconsistent ? undefined : c ? ratio : relation?.ratio}
                  color={c?.display?.(c.values[row]).color}
                  field={c?.config}
                />
              )}
              {c && ratio === undefined && <DataNotice>원본 사용률이 유효 범위를 벗어났습니다.</DataNotice>}
              {inconsistent && <DataNotice>원본 사용률과 용량 관계가 일치하지 않습니다.</DataNotice>}
              <dl>
                {frame.fields
                  .filter((field) => field !== identityField)
                  .map((field, index) => {
                    return (
                      <div
                        className={field.type === FieldType.number ? 'wall-entity-metric' : 'wall-entity-detail'}
                        key={index}
                      >
                        <dt>{getFieldDisplayName(field, frame)}</dt>
                        <dd>
                          <EntityValue field={field} row={row} />
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              {(kind === 'devices' || kind === 'filesystem') && !relation && (
                <DataNotice>용량 합계 또는 사용량 관계 확인 필요</DataNotice>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
