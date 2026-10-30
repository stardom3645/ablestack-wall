import { X } from 'lucide-react';
import { MouseEvent, RefObject, useEffect, useRef, useState } from 'react';

import { Button } from '../ui';

const inputTarget =
  'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="dialog"],[role="menu"]';
const controlTarget = `${inputTarget},button,a,[role="button"],.wall-kpi-resize`;

/** Selection is transient presentation state, never part of the saved dashboard/layout. */
export function usePanelSelection({
  enabled,
  root,
  ids,
  scope,
  busy,
  abort,
}: {
  enabled: boolean;
  root: RefObject<HTMLDivElement>;
  ids: string[];
  scope?: string;
  busy: () => boolean;
  abort: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const latest = useRef({ selected, ids, busy, abort });
  latest.current = { selected, ids, busy, abort };
  const idsKey = ids.join(',');
  useEffect(() => setSelected([]), [enabled, scope, idsKey]);
  useEffect(() => {
    const element = root.current;
    if (!enabled || !element) {
      return;
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element) || target.closest(inputTarget) || !element.contains(target)) {
        return;
      }
      if (event.key === 'Escape') {
        latest.current.abort();
        setSelected([]);
        element.blur();
        event.preventDefault();
        event.stopPropagation();
      } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'a') {
        if (!latest.current.busy()) {
          setSelected([...latest.current.ids]);
        }
        event.preventDefault();
        event.stopPropagation();
      }
    };
    // Native Grafana binds Escape on document too. Only this focused workspace's
    // selection keys take capture priority; text/menu/dialog shortcuts stay native.
    element.ownerDocument.addEventListener('keydown', keydown, true);
    return () => element.ownerDocument.removeEventListener('keydown', keydown, true);
  }, [enabled, root]);

  const itemTarget = (event: MouseEvent) => {
    const target = event.target;
    if (!enabled || !(target instanceof Element) || target.closest(controlTarget)) {
      return;
    }
    const item = target.closest<HTMLElement>('[data-wall-layout-item]');
    return item?.closest('.wall-kpi-pilot') === root.current ? item : undefined;
  };
  return {
    selected,
    clear: () => {
      setSelected([]);
      root.current?.blur();
    },
    all: () => {
      setSelected([...ids]);
      root.current?.focus({ preventScroll: true });
    },
    begin(id: string) {
      const members = latest.current.selected.includes(id) ? latest.current.selected : [id];
      setSelected(members);
      root.current?.focus({ preventScroll: true });
      return members;
    },
    protectMouseDown(event: MouseEvent) {
      if (itemTarget(event) && (event.ctrlKey || event.metaKey || event.shiftKey)) {
        // Modified selection clicks must not begin a native chart zoom gesture.
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    },
    click(event: MouseEvent) {
      if (latest.current.busy()) {
        return;
      }
      const item = itemTarget(event);
      if (!item) {
        const target = event.target;
        if (
          enabled &&
          target instanceof Element &&
          target.closest('.wall-kpi-pilot') === root.current &&
          target.matches('.wall-kpi-pilot,.wall-kpi-layout,.react-grid-layout')
        ) {
          setSelected([]);
          root.current?.blur();
        }
        return;
      }
      const id = item.dataset.wallLayoutItem!;
      const modified = event.ctrlKey || event.metaKey || event.shiftKey;
      // Plain clicks inside data renderers retain tooltip, links and chart behaviour.
      if (!modified && (event.target as Element).closest('[data-testid="data-testid panel content"]')) {
        return;
      }
      setSelected((current) =>
        modified ? (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]) : [id]
      );
      root.current?.focus({ preventScroll: true });
      if (modified) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}

export function PanelSelectionControls({
  count,
  all,
  clear,
  disabled,
}: {
  count: number;
  all: () => void;
  clear: () => void;
  disabled: boolean;
}) {
  if (!count) {
    return null;
  }
  return (
    <div className="wall-panel-selection-controls" role="toolbar" aria-label="선택 패널 도구">
      <strong role="status">{count}개 선택</strong>
      <span className="wall-panel-selection-hint">이동 핸들로 함께 이동 · Ctrl/⌘+클릭</span>
      <Button size="sm" variant="outline" onClick={all} disabled={disabled} aria-keyshortcuts="Control+a Meta+a">
        현재 탭 전체 선택
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={clear}
        disabled={disabled}
        aria-label="패널 선택 해제"
        aria-keyshortcuts="Escape"
        title="선택 해제 (Esc)"
      >
        <X size={16} />
      </Button>
    </div>
  );
}
