import { Menu } from '@base-ui/react/menu';
import { Select } from '@base-ui/react/select';
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, Columns3, EyeOff, MoreHorizontal, RotateCcw } from 'lucide-react';

import { DataFrame, getFrameDisplayName } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import type { TableColumnAction, TableToolbarProps } from '@grafana/ui/src/components/Table/TablePresentation';
import { Trans } from 'app/core/internationalization';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { wallTypographyVariables } from '../typography';
import { Button } from '../ui';

import { wallTableVariables } from './tablePresentation';

export function WallTableControls({
  columns,
  totalRows,
  filteredRows,
  frames,
  index,
  onFrameChange,
}: TableToolbarProps & {
  frames: DataFrame[];
  index: number;
  onFrameChange: (index: number) => void;
}) {
  const theme = useTheme2();
  const visible = columns.filter((column) => column.visible);
  return (
    <div
      className="wall-table-toolbar"
      style={wallTableVariables(theme)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {frames.length > 1 && (
        <Select.Root<number> value={index} onValueChange={(next) => next !== null && onFrameChange(next)}>
          <Select.Trigger
            render={<Button variant="ghost" />}
            className="wall-table-frame"
            aria-label="테이블 데이터 선택"
          >
            <span title={getFrameDisplayName(frames[index])}>{getFrameDisplayName(frames[index])}</span>
            <ChevronDown size={14} />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className="wall-toolbar-positioner" sideOffset={4} align="start">
              <Select.Popup
                className="wall-modern wall-toolbar-select-popup wall-table-frame-popup"
                style={{ ...wallTableVariables(theme), ...wallTypographyVariables }}
                data-wall-theme={theme.isDark ? 'dark' : 'light'}
              >
                {frames.map((frame, i) => (
                  <Select.Item key={i} value={i} className="wall-table-frame-option">
                    <Select.ItemText>{getFrameDisplayName(frame)}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      )}
      <span className="wall-table-summary">
        {filteredRows.toLocaleString()}
        <Trans i18nKey="wall.wall-table-controls.text-91c4aeab">행</Trans>
        {filteredRows !== totalRows ? ` / ${totalRows.toLocaleString()}` : ''}
        <span>
          {' '}
          <Trans i18nKey="wall.wall-table-controls.text-1fdf0d90">· </Trans>
          {visible.length}
          <Trans i18nKey="wall.wall-table-controls.text-42099b4a">/</Trans>
          {columns.length}
          <Trans i18nKey="wall.wall-table-controls.text-cfc1e124">열</Trans>
        </span>
      </span>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="wall-table-columns" />}
          aria-label="표시 컬럼 선택"
          title="표시 컬럼 선택"
        >
          <Columns3 size={15} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="wall-table-menu"
          style={wallTableVariables(theme)}
          aria-label="표시 컬럼"
          align="end"
        >
          <div className="wall-table-menu-title">
            <Trans i18nKey="wall.wall-table-controls.text-b1bb188b">표시 컬럼</Trans>
          </div>
          <div className="wall-table-column-list">
            {columns.map((column) => (
              <Menu.CheckboxItem
                key={column.id}
                checked={column.visible}
                disabled={column.visible && !column.canHide}
                onCheckedChange={(checked) => column.setVisible(checked)}
                className="wall-table-column-choice"
              >
                <span className="wall-table-check">
                  <Menu.CheckboxItemIndicator>
                    <Check size={14} />
                  </Menu.CheckboxItemIndicator>
                </span>
                <span title={column.label}>{column.label}</span>
              </Menu.CheckboxItem>
            ))}
          </div>
          {visible.length < columns.length && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => columns.forEach((column) => column.setVisible(true))}>
                <RotateCcw size={14} />
                <Trans i18nKey="wall.wall-table-controls.text-f9241bd9">전체 컬럼 표시</Trans>
              </DropdownMenuItem>
            </>
          )}
          <small className="wall-table-menu-note">
            <Trans i18nKey="wall.wall-table-controls.text-e5439596">표시 선택은 현재 조회에만 적용됩니다.</Trans>
          </small>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function WallTableColumnMenu({ column }: { column: TableColumnAction }) {
  const theme = useTheme2();
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="wall-table-column-more" />}
        aria-label={`${column.label} 컬럼 작업`}
        title="컬럼 작업"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <MoreHorizontal size={14} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="wall-table-menu"
        style={wallTableVariables(theme)}
        aria-label={`${column.label} 컬럼 작업`}
      >
        <div className="wall-table-menu-title" title={column.label}>
          {column.label}
        </div>
        {column.canSort && (
          <>
            <DropdownMenuItem onClick={() => column.setSort('asc')}>
              <ArrowUpAZ size={14} />
              <Trans i18nKey="wall.wall-table-controls.text-54fde842">오름차순</Trans>
              {column.sort === 'asc' && <Check size={14} className="wall-table-menu-end" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.setSort('desc')}>
              <ArrowDownAZ size={14} />
              <Trans i18nKey="wall.wall-table-controls.text-27a02828">내림차순</Trans>
              {column.sort === 'desc' && <Check size={14} className="wall-table-menu-end" />}
            </DropdownMenuItem>
            {column.sort && (
              <DropdownMenuItem onClick={() => column.setSort()}>
                <RotateCcw size={14} />
                <Trans i18nKey="wall.wall-table-controls.text-99b5854d">정렬 해제</Trans>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem disabled={!column.canHide} onClick={() => column.setVisible(false)}>
          <EyeOff size={14} />
          <Trans i18nKey="wall.wall-table-controls.text-98031069">현재 보기에서 숨기기</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
