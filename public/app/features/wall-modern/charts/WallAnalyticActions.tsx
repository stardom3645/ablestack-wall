import { ContextMenu } from '@base-ui/react/context-menu';
import { css } from '@emotion/css';
import { Copy, Table } from 'lucide-react';
import { RefObject, useMemo, useState } from 'react';

import { LinkModel } from '@grafana/data';
import { usePanelContext, useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

import { DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { wallCommandVariables, wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, wallTypography } from '../typography';
import { useWallEditing } from '../workspace/WallEditContext';

import './seriesLegend.css';

export interface AnalyticActionData {
  title: string;
  rows: Array<{ label: string; value: string }>;
  links: LinkModel[];
}
export function WallAnalyticActions({
  data,
  point,
  onClose,
  returnFocus,
}: {
  data?: AnalyticActionData;
  point: { x: number; y: number } | null;
  onClose: () => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const theme = useTheme2(),
    editing = useWallEditing();
  const { onInspectSeriesData: inspect } = usePanelContext();
  const [open, setOpen] = useState(true),
    [message, setMessage] = useState('');
  const anchor = useMemo(
    () =>
      point
        ? { getBoundingClientRect: () => DOMRect.fromRect({ x: point.x, y: point.y, width: 0, height: 0 }) }
        : undefined,
    [point]
  );
  // Parent mounts this menu for a new native hit, retains its anchor through the exit transition.
  if (!data || !point) {
    return null;
  }
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
        onOpenChange={setOpen}
        onOpenChangeComplete={(next) => {
          if (!next) {
            onClose();
          }
        }}
      >
        <ContextMenu.Portal>
          <ContextMenu.Positioner
            className="wall-toolbar-positioner"
            anchor={anchor}
            align="start"
            sideOffset={4}
            collisionPadding={8}
          >
            <ContextMenu.Popup
              className="wall-modern wall-panel-actions-menu wall-series-menu"
              aria-label="분석 데이터 작업"
              finalFocus={returnFocus}
              data-wall-theme={theme.isDark ? 'dark' : 'light'}
              style={{
                ...wallSurfaceVariables(theme.isDark, true),
                ...wallCommandVariables(theme.isDark),
                ...wallTypographyVariables,
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="wall-series-menu-title" title={data.title}>
                {data.title}
              </div>
              <div
                className={css({
                  padding: '0 8px 8px',
                  display: 'grid',
                  gap: 4,
                  fontSize: wallTypography.roles.caption.size,
                  '& > div': { display: 'flex', justifyContent: 'space-between', gap: 8 },
                  '& span': {
                    color: 'var(--wall-muted)',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                  '& strong': {
                    fontWeight: wallTypography.roles.control.weight,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  },
                })}
              >
                {data.rows.slice(0, 4).map((row, i) => (
                  <div key={i}>
                    <span title={row.label}>{row.label}</span>
                    <strong title={row.value}>{row.value}</strong>
                  </div>
                ))}
                {data.rows.length > 4 && (
                  <span>
                    <Trans i18nKey="wall.wall-analytic-actions.text-7eec6190">외 </Trans>
                    {data.rows.length - 4}
                    <Trans i18nKey="wall.wall-analytic-actions.text-ce2210fc">
                      개 필드 · 표시값 복사에서 전체 확인
                    </Trans>
                  </span>
                )}
              </div>
              <DropdownMenuItem onClick={() => copy(data.title)}>
                <Copy size={14} />
                <Trans i18nKey="wall.wall-analytic-actions.text-b4512332">이름·구간 복사</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => copy(data.rows.map((row) => `${row.label}\t${row.value}`).join('\n'))}>
                <Copy size={14} />
                <Trans i18nKey="wall.wall-analytic-actions.text-29cf39b6">표시값 복사</Trans>
              </DropdownMenuItem>
              {inspect && !editing?.kiosk && (
                <DropdownMenuItem onClick={inspect}>
                  <Table size={14} />
                  <Trans i18nKey="wall.wall-analytic-actions.text-32ad474d">패널 데이터 확인</Trans>
                </DropdownMenuItem>
              )}
              {data.links.length > 0 && <DropdownMenuSeparator />}
              {data.links.map((link, i) => (
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
                  onClick={(e) => link.onClick?.(e, link.origin)}
                >
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
    </>
  );
}
