import { ContextMenu } from '@base-ui/react/context-menu';
import { Copy, ExternalLink, Focus, RotateCcw, Table, Palette, EyeOff } from 'lucide-react';
import { RefObject, useMemo, useState } from 'react';

import { formattedValueToString } from '@grafana/data';
import { SeriesVisibilityChangeMode, usePanelContext, useTheme2 } from '@grafana/ui';
import { SeriesColorPickerPopover } from '@grafana/ui/src/components/ColorPicker/SeriesColorPickerPopover';
import { Trans } from 'app/core/internationalization';

import { DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Popover, PopoverContent } from '../components/ui/popover';
import { wallCommandVariables, wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables } from '../typography';
import { useWallEditing } from '../workspace/WallEditContext';

import { formatPiePercent, PieEntry, pieComposition, piePercent } from './pieModel';
import './seriesLegend.css';

export interface PieActionTarget {
  id: string;
  x: number;
  y: number;
}
export function WallPieActions({
  entries,
  composition,
  target,
  open,
  onOpenChange,
  onClosed,
  select,
  returnFocus,
}: {
  entries: PieEntry[];
  composition: ReturnType<typeof pieComposition>;
  target: PieActionTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  select: (id?: string) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const theme = useTheme2();
  const editing = useWallEditing();
  const {
    onInspectSeriesData: inspect,
    onSeriesColorChange: color,
    canEditSeriesColor,
    onToggleSeriesVisibility: hide,
    onSeriesVisibilityReset: reset,
  } = usePanelContext();
  const entry = entries.find((entry) => entry.id === target?.id);
  const name = entry?.value.display.title ?? '';
  const links = entry?.value.hasLinks ? (entry.value.getLinks?.() ?? []) : [];
  const unique = entries.filter((item) => item.value.display.title === name).length === 1;
  const canColor = Boolean(color && name && unique && !editing?.readOnly && (canEditSeriesColor?.() ?? true));
  const [colorId, setColorId] = useState<string>();
  const [colorPoint, setColorPoint] = useState<PieActionTarget | null>(null);
  const colorEntry = entries.find((entry) => entry.id === colorId);
  const [message, setMessage] = useState('');
  const anchor = useMemo(
    () =>
      target
        ? { getBoundingClientRect: () => DOMRect.fromRect({ x: target.x, y: target.y, width: 0, height: 0 }) }
        : undefined,
    [target]
  );
  const colorAnchor = useMemo(
    () =>
      colorPoint
        ? { getBoundingClientRect: () => DOMRect.fromRect({ x: colorPoint.x, y: colorPoint.y, width: 0, height: 0 }) }
        : undefined,
    [colorPoint]
  );
  return (
    <>
      <ContextMenu.Root
        open={open && Boolean(entry)}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={(next) => {
          if (!next) {
            onClosed();
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
              className="wall-modern wall-panel-actions-menu wall-series-menu wall-pie-menu"
              aria-label="조각 작업"
              finalFocus={returnFocus}
              data-wall-theme={theme.isDark ? 'dark' : 'light'}
              style={{
                ...wallSurfaceVariables(theme.isDark, true),
                ...wallCommandVariables(theme.isDark),
                ...wallTypographyVariables,
              }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="wall-series-menu-title" title={name}>
                {name}
              </div>
              {entry && (
                <div className="wall-pie-menu-value">
                  <strong>{formattedValueToString(entry.value.display)}</strong>
                  <span>{formatPiePercent(piePercent(entry, composition), entry.value.field.decimals)}</span>
                </div>
              )}
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(name);
                    setMessage('이름을 복사했습니다.');
                  } catch {
                    setMessage('클립보드에 접근할 수 없습니다.');
                  }
                }}
              >
                <Copy size={14} />
                <Trans i18nKey="wall.wall-pie-actions.text-8c3d72f8">이름 복사</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => select(entry?.id)}>
                <Focus size={14} />
                <Trans i18nKey="wall.wall-pie-actions.text-f09669dc">이 항목 강조</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => select(undefined)}>
                <RotateCcw size={14} />
                <Trans i18nKey="wall.wall-pie-actions.text-14bcb090">강조 해제</Trans>
              </DropdownMenuItem>
              {hide && unique && !entry?.value.field.custom?.hideFrom?.viz && (
                <DropdownMenuItem onClick={() => hide(name, SeriesVisibilityChangeMode.AppendToSelection)}>
                  <EyeOff size={14} />
                  <Trans i18nKey="wall.wall-pie-actions.text-7c9a1f81">이 항목 숨기기</Trans>
                </DropdownMenuItem>
              )}
              {reset && entries.some((item) => item.value.field.custom?.hideFrom?.viz) && (
                <DropdownMenuItem onClick={reset}>
                  <RotateCcw size={14} />
                  <Trans i18nKey="wall.wall-pie-actions.text-a0b2576d">숨김 선택 초기화</Trans>
                </DropdownMenuItem>
              )}
              {canColor && (
                <DropdownMenuItem
                  onClick={() => {
                    setColorId(entry?.id);
                    setColorPoint(target);
                  }}
                >
                  <Palette size={14} />
                  <Trans i18nKey="wall.wall-pie-actions.text-09606f2a">색상 변경</Trans>
                </DropdownMenuItem>
              )}
              {inspect && !editing?.kiosk && (
                <DropdownMenuItem onClick={inspect}>
                  <Table size={14} />
                  <Trans i18nKey="wall.wall-pie-actions.text-32ad474d">패널 데이터 확인</Trans>
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
      <Popover
        open={Boolean(colorEntry && !editing?.readOnly && (canEditSeriesColor?.() ?? true))}
        onOpenChange={(next) => {
          if (!next) {
            setColorId(undefined);
          }
        }}
      >
        <PopoverContent
          anchor={colorAnchor}
          align="start"
          finalFocus={returnFocus}
          className="wall-series-color"
          aria-label="조각 색상"
          style={wallTypographyVariables}
        >
          {colorEntry && (
            <SeriesColorPickerPopover
              theme={theme}
              color={colorEntry.value.display.color ?? ''}
              enableNamedColors
              onChange={(next) => {
                if (editing?.readOnly || !(canEditSeriesColor?.() ?? true)) {
                  return;
                }
                editing?.begin();
                color?.(colorEntry.value.display.title ?? '', next);
                setColorId(undefined);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      <span className="wall-legend-sr" role="status">
        {message}
      </span>
    </>
  );
}
