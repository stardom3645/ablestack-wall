import { Copy, Eye, EyeOff, ListRestart, Palette, Table, MoreHorizontal, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { usePanelContext, SeriesVisibilityChangeMode, useTheme2 } from '@grafana/ui';
import { SeriesColorPickerPopover } from '@grafana/ui/src/components/ColorPicker/SeriesColorPickerPopover';
import type { VizLegendItem } from '@grafana/ui/src/components/VizLegend/types';
import { Trans } from 'app/core/internationalization';
import { getDataLinks } from 'app/plugins/panel/status-history/utils';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import { Popover, PopoverContent } from '../components/ui/popover';
import { wallTypographyVariables } from '../typography';
import { Button } from '../ui';
import { useWallEditing } from '../workspace/WallEditContext';

export function WallSeriesMenu({
  item,
  items,
  readonly,
}: {
  item: VizLegendItem;
  items: VizLegendItem[];
  readonly?: boolean;
}) {
  const theme = useTheme2();
  const {
    onToggleSeriesVisibility: toggle,
    onSeriesVisibilityReset: reset,
    onSeriesColorChange: color,
    onInspectSeriesData: inspect,
    canEditSeriesColor,
  } = usePanelContext();
  const editing = useWallEditing();
  const [colorOpen, setColorOpen] = useState(false);
  const [message, setMessage] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const canColor = !readonly && color && item.color && !editing?.readOnly && (canEditSeriesColor?.() ?? true);
  useEffect(() => {
    if (!canColor) {
      setColorOpen(false);
    }
  }, [canColor]);
  const field = item.data?.field;
  const row = field ? field.values.length - 1 : -1;
  const links = field && row >= 0 ? getDataLinks(field, row) : [];
  const name = item.fieldName ?? item.label;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
          render={<Button variant="ghost" size="icon" className="wall-series-more" />}
          aria-label={`${item.label} 시리즈 작업`}
          title="시리즈 작업"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MoreHorizontal size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="wall-series-menu"
          align="start"
          style={wallTypographyVariables}
          aria-label={`${item.label} 작업`}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="wall-series-menu-title" title={item.label}>
            {item.label}
          </div>
          <DropdownMenuItem
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(item.label);
                setMessage('시리즈 이름을 복사했습니다.');
              } catch {
                setMessage('클립보드에 접근할 수 없습니다.');
              }
            }}
          >
            <Copy size={14} />
            <Trans i18nKey="wall.wall-series-menu.text-5c63c1d6">시리즈 이름 복사</Trans>
          </DropdownMenuItem>
          {toggle && !readonly && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  if (item.disabled || items.some((other) => other !== item && !other.disabled)) {
                    toggle(name, SeriesVisibilityChangeMode.ToggleSelection);
                  }
                }}
              >
                <Eye size={14} />
                <Trans i18nKey="wall.wall-series-menu.text-48958fc9">이 시리즈만 보기</Trans>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={item.disabled}
                onClick={() => toggle(name, SeriesVisibilityChangeMode.AppendToSelection)}
              >
                <EyeOff size={14} />
                <Trans i18nKey="wall.wall-series-menu.text-cd7fe2d1">이 시리즈 숨기기</Trans>
              </DropdownMenuItem>
              {reset && (
                <DropdownMenuItem onClick={reset}>
                  <ListRestart size={14} />
                  <Trans i18nKey="wall.wall-series-menu.text-cefbd5a0">전체 시리즈 다시 표시</Trans>
                </DropdownMenuItem>
              )}
            </>
          )}
          {canColor && (
            <DropdownMenuItem onClick={() => setColorOpen(true)}>
              <Palette size={14} />
              <Trans i18nKey="wall.wall-series-menu.text-4d02a2e2">시리즈 색상 변경</Trans>
            </DropdownMenuItem>
          )}
          {inspect && !editing?.kiosk && (
            <DropdownMenuItem onClick={inspect}>
              <Table size={14} />
              <Trans i18nKey="wall.wall-series-menu.text-085a6623">데이터 확인</Trans>
            </DropdownMenuItem>
          )}
          {links.length > 0 && <DropdownMenuSeparator />}
          {links.map((link, index) => (
            <DropdownMenuItem
              key={`${link.href}-${index}`}
              render={
                <a
                  href={link.href}
                  aria-label={link.title}
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
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover open={colorOpen} onOpenChange={setColorOpen}>
        <PopoverContent
          anchor={trigger}
          align="start"
          finalFocus={trigger}
          className="wall-series-color"
          style={wallTypographyVariables}
          aria-label={`${item.label} 색상`}
        >
          {canColor && (
            <SeriesColorPickerPopover
              theme={theme}
              color={item.color!}
              enableNamedColors
              onChange={(value) => {
                color!(name, value);
                setColorOpen(false);
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
