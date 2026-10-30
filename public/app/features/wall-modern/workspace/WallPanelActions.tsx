import {
  ArrowLeft,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  FileJson,
  Info,
  List,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { MouseEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { PanelMenuItem } from '@grafana/data';
import { sanitizeUrl } from '@grafana/data/src/text/sanitize';
import { locationService } from '@grafana/runtime';
import { VizPanel, VizPanelMenu } from '@grafana/scenes';
import { useTheme2 } from '@grafana/ui';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { wallCommandTokens, wallCommandVariables } from '../surfaceTokens';
import { Button } from '../ui';

import { usePanelClipboard } from './PanelClipboardContext';
import { useWallEditing } from './WallEditContext';
import { commandItems, isDangerAction, splitCommandItems } from './panelCommandModel';

function runAction(item: PanelMenuItem, event: MouseEvent<HTMLElement>, synchronize?: (href: string) => void) {
  item.onClick?.(event);
  // Keep Scenes alive for local links; preserve native callbacks, hrefs and modified clicks.
  if (
    item.href?.startsWith('/') &&
    !item.href.startsWith('//') &&
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  ) {
    event.preventDefault();
    synchronize?.(item.href);
    locationService.push(sanitizeUrl(item.href));
  }
}

const commandIcons: Record<string, typeof Pencil> = {
  eye: ExternalLink,
  edit: Pencil,
  compass: Compass,
  'info-circle': Info,
  'share-alt': Share2,
  copy: Copy,
  'file-copy-alt': Copy,
};
const quickLabels: Record<string, string> = { eye: '보기', edit: '편집', 'file-copy-alt': '복제' };

function ActionLabel({ item, quick = false }: { item: PanelMenuItem; quick?: boolean }) {
  const Icon = isDangerAction(item)
    ? Trash2
    : (commandIcons[item.iconClassName ?? ''] ?? (/json/i.test(item.text) ? FileJson : List));
  const text = quick
    ? (quickLabels[item.iconClassName ?? ''] ?? item.text)
    : item.iconClassName === 'cube'
      ? '추가 작업'
      : item.text;
  return (
    <>
      <Icon size={wallCommandTokens.icon} aria-hidden="true" />
      <span>{text}</span>
    </>
  );
}

function BoundPanelActions({
  menu,
  title,
  panel,
  synchronize,
}: {
  menu: VizPanelMenu;
  panel: VizPanel;
  title: string;
  synchronize?: (href: string) => void;
}) {
  const theme = useTheme2();
  const { items: nativeItems = [] } = menu.useState();
  const editing = useWallEditing();
  const clipboard = usePanelClipboard();
  const localCopy: PanelMenuItem = {
    text: '패널 복사',
    iconClassName: 'copy',
    shortcut: 'Ctrl+C / ⌘C',
    onClick: () => {
      clipboard?.copy(panel);
    },
  };
  const withCopy = (entries: PanelMenuItem[], inMore = false): PanelMenuItem[] =>
    entries.map((item) => {
      if (inMore && item.iconClassName === 'file-copy-alt' && clipboard?.enabled) {
        return { ...item, onClick: () => clipboard.duplicate(panel) };
      }
      if (inMore && item.iconClassName === 'copy' && clipboard?.enabled) {
        return localCopy;
      }
      if (item.subMenu) {
        const subMenu = withCopy(item.subMenu, inMore || item.iconClassName === 'cube');
        return {
          ...item,
          subMenu:
            item.iconClassName === 'cube' && clipboard?.enabled && !subMenu.some((child) => child === localCopy)
              ? [localCopy, ...subMenu]
              : subMenu,
        };
      }
      return item;
    });
  const items = commandItems(withCopy(nativeItems), editing?.readOnly, editing?.kiosk);
  const { quick, regular, danger } = splitCommandItems(items);
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const stop = useRef<() => void>();
  const focus = useRef<string>();
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<PanelMenuItem[]>([]);
  useEffect(() => {
    setOpen(false);
    setPath([]);
    return () => stop.current?.();
  }, [menu, title, editing?.kiosk]);
  const prepare = useCallback(() => {
    stop.current?.();
    stop.current = menu.activate();
  }, [menu]);
  useEffect(() => {
    const host = root.current?.closest('.wall-kpi-layout-item, .wall-workspace-panel');
    host?.addEventListener('mouseenter', prepare);
    return () => host?.removeEventListener('mouseenter', prepare);
  }, [prepare]);
  useLayoutEffect(() => {
    if (focus.current) {
      const key = focus.current;
      focus.current = undefined;
      Array.from(body.current?.querySelectorAll<HTMLElement>('[data-command-key]') ?? [])
        .find((element) => element.dataset.commandKey === key)
        ?.focus({ preventScroll: true });
    }
  }, [path]);
  const back = () => {
    focus.current = path[path.length - 1].text;
    setPath((current) => current.slice(0, -1));
  };
  const drill = (item: PanelMenuItem) => {
    focus.current = '@back';
    setPath((current) => [...current, item]);
  };
  const renderItem = (item: PanelMenuItem, index: number, quick = false) => (
    <DropdownMenuItem
      key={`${item.text}:${index}`}
      data-command-key={item.text}
      className={`wall-panel-actions-item ${quick ? 'wall-command-quick-item' : ''}`}
      data-danger={isDangerAction(item) || undefined}
      label={item.text}
      closeOnClick={!item.subMenu?.length}
      render={
        !item.subMenu?.length && item.href ? <a href={sanitizeUrl(item.href)} aria-label={item.text} /> : undefined
      }
      onClickCapture={!item.subMenu?.length && item.href ? (event) => runAction(item, event, synchronize) : undefined}
      onClick={item.subMenu?.length ? () => drill(item) : item.href ? undefined : item.onClick}
    >
      <ActionLabel item={item} quick={quick} />
      {!quick && item.iconClassName === 'copy' && item.shortcut === localCopy.shortcut && (
        <kbd className="wall-command-shortcut">{navigator.platform.includes('Mac') ? '⌘C' : 'Ctrl+C'}</kbd>
      )}
      {!quick && !!item.subMenu?.length && <ChevronRight size={14} aria-hidden="true" />}
    </DropdownMenuItem>
  );
  const branch = path[path.length - 1];
  return (
    <div
      ref={root}
      className="wall-panel-native-actions wall-kpi-no-drag"
      onMouseEnter={prepare}
      onFocusCapture={() => {
        if (!stop.current) {
          prepare();
        }
      }}
    >
      <DropdownMenu
        open={open}
        onOpenChange={(next, details) => {
          if (!next && details.reason === 'escape-key' && path.length) {
            details.cancel();
            back();
            return;
          }
          setOpen(next);
          setPath([]);
          if (next) {
            editing?.begin();
            prepare();
          }
        }}
      >
        <DropdownMenuTrigger
          render={<Button size="icon" variant="ghost" className="wall-panel-more" />}
          aria-label={`${title} 추가 작업`}
          title="추가 작업"
        >
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          style={wallCommandVariables(
            theme.isDark,
            Math.max(
              wallCommandTokens.height,
              ...items.flatMap(function heights(item): number[] {
                return item.subMenu
                  ? [88 + item.subMenu.length * wallCommandTokens.itemHeight, ...item.subMenu.flatMap(heights)]
                  : [];
              })
            )
          )}
          className="wall-panel-command wall-kpi-no-drag"
          aria-label={`${title} 패널 작업`}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDownCapture={(event) => {
            if (
              (event.metaKey || event.ctrlKey) &&
              !event.shiftKey &&
              !event.altKey &&
              event.key.toLowerCase() === 'c' &&
              !window.getSelection()?.toString() &&
              clipboard?.enabled
            ) {
              if (clipboard.copy(panel)) {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                setPath([]);
              }
              return;
            }
            if (event.key === 'Escape') {
              // Keep one Escape from also exiting kiosk or clearing panel selection.
              event.stopPropagation();
              if (path.length) {
                event.preventDefault();
                back();
              } else {
                event.preventDefault();
                setOpen(false);
                setPath([]);
              }
            }
          }}
        >
          <div ref={body} className="wall-command-body">
            <div className="wall-command-title" title={title}>
              {title}
            </div>
            {branch ? (
              <>
                <DropdownMenuItem
                  className="wall-panel-actions-item wall-command-back"
                  data-command-key="@back"
                  label="기본 메뉴로 돌아가기"
                  aria-label="기본 메뉴로 돌아가기"
                  closeOnClick={false}
                  onClick={back}
                >
                  <ArrowLeft size={wallCommandTokens.icon} />
                  <span>
                    {branch.iconClassName === 'info-circle'
                      ? '패널 검사'
                      : branch.iconClassName === 'cube'
                        ? '추가 작업'
                        : branch.text}
                  </span>
                </DropdownMenuItem>
                <div className="wall-command-list">{branch.subMenu?.map((item, index) => renderItem(item, index))}</div>
              </>
            ) : (
              <>
                {!!quick.length && (
                  <div className="wall-command-quick">{quick.map((item, index) => renderItem(item, index, true))}</div>
                )}
                <div className="wall-command-list">
                  {!items.length && <div className="wall-panel-actions-empty">작업을 불러오는 중…</div>}
                  {regular.map((item, index) => renderItem(item, index))}
                </div>
                {!!danger.length && (
                  <div className="wall-command-danger">
                    <DropdownMenuSeparator className="wall-panel-actions-separator" />
                    {danger.map((item, index) => renderItem(item, index))}
                  </div>
                )}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function WallPanelActions({ panel, synchronize }: { panel: VizPanel; synchronize?: (href: string) => void }) {
  const { menu, title } = panel.useState();
  return menu ? (
    <BoundPanelActions key={panel.state.key} menu={menu} panel={panel} title={title} synchronize={synchronize} />
  ) : null;
}
