import { ContextMenu } from '@base-ui/react/context-menu';
import { Select } from '@base-ui/react/select';
import { Check, ChevronDown, Copy, ExternalLink, Focus, MoreHorizontal, RotateCcw, Table } from 'lucide-react';
import { RefObject, useMemo, useRef, useState } from 'react';

import { DataFrame, formattedValueToString } from '@grafana/data';
import { usePanelContext, useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { getDataLinks } from 'app/plugins/panel/status-history/utils';

import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { wallCommandVariables, wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables } from '../typography';
import { Button } from '../ui';
import { useWallEditing } from '../workspace/WallEditContext';

import { barFieldKey, CategoryOrder, findBarField } from './categorical';
import './categorical.css';
import './timeSeries.css';
import './seriesLegend.css';

export interface BarSelection {
  row: number;
  field: string;
}
export interface BarMenuPoint {
  x: number;
  y: number;
}
const display = (frame: DataFrame, row: number) => {
  const field = frame.fields[0];
  return field.display ? formattedValueToString(field.display(field.values[row])) : String(field.values[row] ?? '');
};
function BarSelect({
  value,
  label,
  choices,
  onChange,
}: {
  value: string;
  label: string;
  choices: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  const theme = useTheme2();
  return (
    <Select.Root value={value} items={choices} onValueChange={(next) => next !== null && onChange(next)}>
      <Select.Trigger
        render={<Button variant="ghost" className="wall-bar-select" />}
        aria-label={label}
        title={choices.find((item) => item.value === value)?.label}
      >
        <Select.Value />
        <ChevronDown size={14} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="wall-toolbar-positioner"
          alignItemWithTrigger={false}
          align="start"
          sideOffset={4}
        >
          <Select.Popup
            className="wall-modern wall-metric-popup wall-bar-select-popup"
            data-wall-theme={theme.isDark ? 'dark' : 'light'}
            style={{ ...wallSurfaceVariables(theme.isDark, true), ...wallTypographyVariables }}
          >
            <Select.List>
              {choices.map((item) => (
                <Select.Item className="wall-metric-option" key={item.value} value={item.value}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={14} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export function WallBarControls({
  frame,
  indices,
  order,
  onOrder,
  selection,
  onSelect,
  menuPoint,
  onCloseMenu,
  returnFocus,
}: {
  frame: DataFrame;
  indices: number[];
  order: CategoryOrder;
  onOrder: (order: CategoryOrder) => void;
  selection?: BarSelection;
  onSelect: (selection?: BarSelection) => void;
  menuPoint: BarMenuPoint | null;
  onCloseMenu: () => void;
  returnFocus: RefObject<HTMLDivElement>;
}) {
  const theme = useTheme2();
  const editing = useWallEditing();
  const { onInspectSeriesData } = usePanelContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const category = selection ? display(frame, selection.row) : '';
  const field = selection && findBarField(frame, selection.field);
  const value = field && selection ? formattedValueToString(field.display!(field.values[selection.row])) : '';
  const links = field && selection ? getDataLinks(field, selection.row) : [];
  const anchor = useMemo(
    () =>
      menuPoint
        ? { getBoundingClientRect: () => DOMRect.fromRect({ x: menuPoint.x, y: menuPoint.y, width: 0, height: 0 }) }
        : undefined,
    [menuPoint]
  );
  const menuAnchor = useRef(anchor);
  if (anchor) {
    menuAnchor.current = anchor;
  }
  const sortValue =
    order.direction === 'source'
      ? 'source'
      : `${frame.fields.findIndex((field, index) => barFieldKey(field, index) === order.field)}:${order.direction}`;
  const sorts = [
    { value: 'source', label: '기존 순서' },
    ...frame.fields.slice(1).flatMap((field, index) => [
      { value: `${index + 1}:desc`, label: `${field.state?.displayName ?? field.name} · 높은 순` },
      { value: `${index + 1}:asc`, label: `${field.state?.displayName ?? field.name} · 낮은 순` },
    ]),
  ];
  return (
    <div className="wall-bar-controls" onPointerDown={(event) => event.stopPropagation()}>
      <span className="wall-bar-count" title="현재 표시 항목 / 전체 항목">
        {indices.length.toLocaleString()}
        {indices.length !== frame.length ? ` / ${frame.length.toLocaleString()}` : ''}
        <Trans i18nKey="wall.wall-bar-controls.text-11600c9a">개</Trans>
      </span>
      <BarSelect
        label="비교 항목 선택"
        value={selection && indices.includes(selection.row) ? String(selection.row) : ''}
        choices={[
          { value: '', label: '항목 선택' },
          ...indices.map((row) => ({ value: String(row), label: display(frame, row) })),
        ]}
        onChange={(next) =>
          onSelect(next === '' ? undefined : { row: Number(next), field: barFieldKey(frame.fields[1], 1) })
        }
      />
      <BarSelect
        label="항목 표시 정렬"
        value={sortValue}
        choices={sorts}
        onChange={(next) => {
          if (next === 'source') {
            onOrder({ ...order, direction: 'source' });
            return;
          }
          const [index, direction] = next.split(':');
          onOrder({
            ...order,
            field: barFieldKey(frame.fields[Number(index)], Number(index)),
            direction: direction === 'desc' ? 'desc' : 'asc',
          });
        }}
      />
      <BarSelect
        label="항목 표시 범위"
        value={String(order.limit)}
        choices={[
          { value: '0', label: '전체' },
          ...[5, 10, 20, 50].map((n) => ({ value: String(n), label: `Top ${n}` })),
        ]}
        onChange={(next) =>
          onOrder({
            ...order,
            limit: Number(next),
            ...(Number(next) > 0 && order.direction === 'source'
              ? { field: barFieldKey(frame.fields[1], 1), direction: 'desc' }
              : {}),
          })
        }
      />
      <ContextMenu.Root
        open={Boolean(selection) && (menuPoint !== null || menuOpen)}
        onOpenChange={(open) => {
          if (open && !menuPoint) {
            menuAnchor.current = undefined;
          }
          setMenuOpen(open);
          if (!open) {
            onCloseMenu();
          }
        }}
        onOpenChangeComplete={(open) => {
          if (!open) {
            menuAnchor.current = undefined;
          }
        }}
      >
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="wall-bar-more" />}
          aria-label="선택 항목 작업"
          disabled={!selection}
        >
          <MoreHorizontal size={14} />
        </DropdownMenuTrigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner
            className="wall-toolbar-positioner"
            anchor={menuAnchor.current}
            align="start"
            sideOffset={4}
            collisionPadding={8}
          >
            <ContextMenu.Popup
              className="wall-modern wall-panel-actions-menu wall-series-menu wall-bar-menu"
              aria-label="항목 작업"
              finalFocus={returnFocus}
              data-wall-theme={theme.isDark ? 'dark' : 'light'}
              style={{
                ...wallSurfaceVariables(theme.isDark, true),
                ...wallCommandVariables(theme.isDark),
                ...wallTypographyVariables,
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="wall-series-menu-title" title={category}>
                {category}
              </div>
              <div className="wall-bar-menu-value">
                <span>{field && (field.state?.displayName ?? field.name)}</span>
                <strong>{value}</strong>
              </div>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(category);
                    setMessage('항목 이름을 복사했습니다.');
                  } catch {
                    setMessage('클립보드에 접근할 수 없습니다.');
                  }
                }}
              >
                <Copy size={14} />
                <Trans i18nKey="wall.wall-bar-controls.text-770713ff">항목 이름 복사</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(selection)}>
                <Focus size={14} />
                <Trans i18nKey="wall.wall-bar-controls.text-f09669dc">이 항목 강조</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSelect(undefined)}>
                <RotateCcw size={14} />
                <Trans i18nKey="wall.wall-bar-controls.text-14bcb090">강조 해제</Trans>
              </DropdownMenuItem>
              {onInspectSeriesData && !editing?.kiosk && (
                <DropdownMenuItem onClick={onInspectSeriesData}>
                  <Table size={14} />
                  <Trans i18nKey="wall.wall-bar-controls.text-32ad474d">패널 데이터 확인</Trans>
                </DropdownMenuItem>
              )}
              {links.length > 0 && <DropdownMenuSeparator />}
              {links.map((link, i) => (
                <DropdownMenuItem
                  key={`${link.href}-${i}`}
                  render={
                    <a
                      aria-label={link.title}
                      href={link.href}
                      target={link.target}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                    />
                  }
                  onClick={(event) => link.onClick?.(event, link.origin)}
                >
                  <ExternalLink size={14} />
                  {link.title}
                </DropdownMenuItem>
              ))}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <span className="wall-legend-sr" role="status">
        {message}
      </span>
    </div>
  );
}
