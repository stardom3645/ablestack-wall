import { ContextMenu } from '@base-ui/react/context-menu';
import { Copy, ExternalLink, Filter, FilterX, ScanText } from 'lucide-react';
import { HTMLAttributes, ReactElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useTheme2 } from '@grafana/ui';
import { TableCellInspector, TableCellInspectorMode } from '@grafana/ui/src/components/Table/TableCellInspector';
import type { TableCellInteractionProps } from '@grafana/ui/src/components/Table/TablePresentation';
import { getCellLinks } from '@grafana/ui/src/utils';
import { Trans } from 'app/core/internationalization';

import { wallTypographyVariables } from '../typography';

import { formatTableCellValue, tableRowText, wallTableVariables } from './tablePresentation';

/** The Trigger renders the existing cell's DOM; no extra layout wrapper or cell renderer. */
export function WallTableCell({
  native,
  ...props
}: TableCellInteractionProps & {
  native: (extra?: HTMLAttributes<HTMLDivElement>) => ReactElement;
}) {
  const { field, frame, row, cell, onCellFilterAdded } = props;
  const theme = useTheme2();
  const [open, setOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [message, setMessage] = useState('');
  const trigger = useRef<HTMLDivElement>(null);
  const text = formatTableCellValue(field, cell.value);
  const links = getCellLinks(field, row) ?? [];
  const filterable = field.config.filterable && onCellFilterAdded && cell.value !== undefined;
  useEffect(() => {
    setOpen(false);
  }, [frame, field, row.index]);
  const copyRow = () => {
    const cells = row.cells.filter((item) => item.column.id !== 'expander' && item.column.field);
    return tableRowText(
      cells.flatMap((item) => (item.column.field ? [item.column.field] : [])),
      row.index,
      cells.map((item) => item.value)
    );
  };
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage('복사했습니다.');
    } catch {
      setMessage('클립보드에 접근할 수 없습니다.');
    }
  };
  return (
    <>
      <ContextMenu.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setMessage('');
          }
        }}
      >
        <ContextMenu.Trigger
          ref={trigger}
          tabIndex={0}
          title={text}
          onContextMenuCapture={() => setKeyboard(false)}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
              event.preventDefault();
              event.stopPropagation();
              setKeyboard(true);
              setOpen(true);
            }
          }}
          render={(triggerProps) => native(triggerProps)}
        />
        <ContextMenu.Portal>
          <ContextMenu.Positioner
            className="wall-toolbar-positioner"
            anchor={keyboard ? trigger : undefined}
            collisionPadding={8}
          >
            <ContextMenu.Popup
              finalFocus={trigger}
              aria-label={`${field.config.displayName ?? field.name} 셀 작업`}
              className="wall-modern wall-panel-actions-menu wall-table-menu"
              data-wall-theme={theme.isDark ? 'dark' : 'light'}
              style={{
                ...wallTableVariables(theme),
                ...wallTypographyVariables,
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="wall-table-menu-title" title={field.config.displayName ?? field.name}>
                {field.config.displayName ?? field.name}
              </div>
              <div className="wall-table-cell-preview" title={text}>
                {text || '빈 값'}
              </div>
              <ContextMenu.Item onClick={() => copy(text)}>
                <Copy size={14} />
                <Trans i18nKey="wall.wall-table-cell.text-0dd97d9b">셀 값 복사</Trans>
              </ContextMenu.Item>
              <ContextMenu.Item onClick={() => copy(copyRow())}>
                <Copy size={14} />
                <Trans i18nKey="wall.wall-table-cell.text-3e30e9e9">현재 행 복사</Trans>
              </ContextMenu.Item>
              {Boolean(field.config.custom?.inspect) && (
                <ContextMenu.Item onClick={() => setInspect(true)}>
                  <ScanText size={14} />
                  <Trans i18nKey="wall.wall-table-cell.text-bda84c67">전체 값 확인</Trans>
                </ContextMenu.Item>
              )}
              {filterable && (
                <>
                  <ContextMenu.Separator />
                  <ContextMenu.Item
                    onClick={() => onCellFilterAdded!({ key: field.name, operator: '=', value: cell.value })}
                  >
                    <Filter size={14} />
                    <Trans i18nKey="wall.wall-table-cell.text-a8221c1f">이 값으로 필터</Trans>
                  </ContextMenu.Item>
                  <ContextMenu.Item
                    onClick={() => onCellFilterAdded!({ key: field.name, operator: '!=', value: cell.value })}
                  >
                    <FilterX size={14} />
                    <Trans i18nKey="wall.wall-table-cell.text-ab936550">이 값 제외</Trans>
                  </ContextMenu.Item>
                </>
              )}
              {links.length > 0 && <ContextMenu.Separator />}
              {links.map((link, i) => (
                <ContextMenu.Item
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
                </ContextMenu.Item>
              ))}
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      {inspect && (
        <TableCellInspector value={cell.value} mode={TableCellInspectorMode.text} onDismiss={() => setInspect(false)} />
      )}
      {message &&
        createPortal(
          <span className="wall-table-announcement" role="status">
            {message}
          </span>,
          document.body
        )}
    </>
  );
}
