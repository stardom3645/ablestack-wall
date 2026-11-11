import { GripHorizontal } from 'lucide-react';
import {
  ComponentType,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import GridLayout, { ItemCallback, ReactGridLayoutProps } from 'react-grid-layout';

import { locationService } from '@grafana/runtime';
import { Trans } from 'app/core/internationalization';

import { wallSurfaceTokens } from '../surfaceTokens';
import { Button } from '../ui';

import { LayoutFootprint, LayoutFootprintHandle } from './LayoutFootprint';
import { LayoutGridGuide } from './LayoutGridGuide';
import { useLayoutHistory } from './LayoutHistoryContext';
import { PanelActionsProvider } from './PanelActionDock';
import { usePanelClipboard } from './PanelClipboardContext';
import { PanelSelectionControls, usePanelSelection } from './PanelSelection';
import { useWallEditing } from './WallEditContext';
import { cancelPanelSettle, frameMouseInput, GestureRects, settlePanels } from './gestureMotion';
import { kpiGrid, KpiPosition, sameKpiLayout } from './kpiLayout';
import {
  panelGroupMovePreview,
  panelMovePreview,
  panelResizePreview,
  snapPanelPosition,
  snapPanelResize,
  selectionBounds,
  interactionRowStep,
  panelAlignmentGuides,
  resizeReflowOrigin,
  ResizeReflow,
} from './layoutMovement';
import { WorkspacePanel, selectedWorkspaceTab } from './model';
import { panelColumnPitch, panelPixelRect, panelRowAnchors } from './panelGeometry';
import { captureResizePointer, holdResizeCursor } from './resizePointer';
import { reconcileWallLayout } from './wallDocument';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './kpiLayout.css';

// The installed Grid typings use a legacy React class declaration. Keep its engine/props,
// adapting only the React-facing declaration to this app's React types.
type SharedGridProps = Omit<ReactGridLayoutProps, 'children' | 'resizeHandle'> & {
  children: ReactNode;
  resizeHandle: ReactNode | ((axis: string, ref: Ref<HTMLSpanElement>) => ReactNode);
};
function isGridComponent(value: unknown): value is ComponentType<SharedGridProps> {
  return typeof value === 'function';
}
// Check the CommonJS boundary once without changing the constructor or native engine.
if (!isGridComponent(GridLayout)) {
  throw new Error('Expected the native grid component');
}
const SharedGridLayout: ComponentType<SharedGridProps> = GridLayout;

function pointerPosition(event: MouseEvent | TouchEvent) {
  return 'touches' in event ? (event.touches[0] ?? event.changedTouches[0]) : event;
}

export function PanelLayoutGrid<T>({
  panels,
  storageKey,
  original,
  renderPanel,
  renderActions,
  requested,
  onModeChange,
  initialLayout,
  validate,
  rowPitch = 18,
  gapX = wallSurfaceTokens.cardGap,
  gapY = wallSurfaceTokens.cardGap,
  maxWidth = 1076,
  minimumWidth = 760,
  bounds,
  draftCache,
  label = '핵심 자원',
  readOnly = false,
}: {
  initialLayout: KpiPosition[];
  validate: (value: unknown) => KpiPosition[] | undefined;
  rowPitch?: number;
  gapX?: number;
  gapY?: number;
  maxWidth?: number;
  minimumWidth?: number;
  bounds?: (panel: WorkspacePanel<T>, width: number) => { minW: number; minH: number; maxH: number };
  draftCache?: Map<string, KpiPosition[]>;
  label?: string;
  panels: Array<WorkspacePanel<T>>;
  storageKey?: string;
  original: ReactNode;
  requested?: boolean;
  onModeChange?: (editing: boolean) => void;
  renderPanel: (panel: WorkspacePanel<T>) => ReactNode;
  renderActions?: (panel: WorkspacePanel<T>) => ReactNode;
  readOnly?: boolean;
}) {
  const persistence = useWallEditing();
  readOnly = readOnly || Boolean(persistence?.layoutReadOnly);
  const container = useRef<HTMLDivElement>(null);
  const history = useLayoutHistory();
  const historyController = useRef<{
    apply: (items: KpiPosition[]) => boolean;
    validate: typeof validate;
  }>();
  const pendingGesture = useRef<() => void>();
  const frameInput = useRef<() => void>();
  const resizePointer = useRef<() => void>();
  const resizeCursor = useRef<() => void>();
  const footprint = useRef<LayoutFootprintHandle>(null);
  const replaying = useRef(false);
  const resizeReflow = useRef<ResizeReflow>();
  useEffect(() => {
    resizeReflow.current = undefined;
  }, [storageKey]);
  const suppressSelectionClick = useRef(false);
  const abortGesture = useRef<() => void>();
  const gesture = useRef<{
    x: number;
    y: number;
    active: boolean;
    touch: boolean;
    kind: 'move' | 'resize';
    origin: KpiPosition[];
    reflowOrigin?: KpiPosition[];
    rowAnchors: number[];
    members: string[];
    footprint?: KpiPosition;
    resized?: KpiPosition;
    node?: HTMLElement;
    nodes: Map<string, HTMLElement>;
    releaseRects?: GestureRects;
    preview?: KpiPosition[];
    feedbackPreview?: KpiPosition[];
    target?: string;
    position?: { x: number; y: number };
    west?: boolean;
    left: number;
    top: number;
  }>();
  const [width, setWidth] = useState(0);
  const [saved, setSaved] = useState(initialLayout);
  const [draft, setDraft] = useState(initialLayout);
  const baseline = useRef(initialLayout);
  const previousKey = useRef(storageKey);
  const [engineReset, setEngineReset] = useState(0);
  const readSaved = () => {
    try {
      const data = JSON.parse((storageKey && localStorage.getItem(storageKey)) || 'null');
      return data?.version === 1 ? validate(data.items) : undefined;
    } catch {
      return undefined;
    }
  };
  const [active, setActive] = useState<string>();
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const compatible = (value: KpiPosition[] | undefined) =>
      validate(reconcileWallLayout(value ?? initialLayout, panels, rowPitch, gapY));
    const next =
      (persistence && storageKey ? compatible(persistence.saved(storageKey, initialLayout)) : readSaved()) ??
      (storageKey ? validate(history?.getBaseline(storageKey)) : undefined) ??
      initialLayout;
    const previous = baseline.current;
    const changedKey = previousKey.current !== storageKey;
    setSaved(next);
    setDraft((current) => {
      if (persistence && storageKey) {
        return compatible(persistence.draft(storageKey) ?? next) ?? next;
      }
      const cached = storageKey ? validate(draftCache?.get(storageKey)) : undefined;
      return changedKey ? (cached ?? next) : (cached ?? (sameKpiLayout(current, previous) ? next : current));
    });
    baseline.current = next;
    previousKey.current = storageKey;
    if (changedKey) {
      setActive(undefined);
      footprint.current?.hide();
    }
    // Defaults are a geometry projection; queries and source models are never stored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, initialLayout, validate, draftCache, history, persistence?.revision]);
  useEffect(
    () => () => {
      pendingGesture.current?.();
      frameInput.current?.();
      resizePointer.current?.();
      resizeCursor.current?.();
    },
    []
  );
  useEffect(() => {
    const doc = container.current?.ownerDocument;
    if (!doc) {
      return;
    }
    // An interrupted gesture must not leave the engine or its visual overlay active.
    // Roll back only the in-flight operation; preserve earlier unsaved edits.
    const abort = () => {
      pendingGesture.current?.();
      frameInput.current?.();
      resizePointer.current?.();
      resizeCursor.current?.();
      frameInput.current = undefined;
      if (!gesture.current) {
        return;
      }
      gesture.current.nodes.forEach((node) => node.removeAttribute('data-wall-magnet'));
      gesture.current = undefined;
      history?.refresh();
      footprint.current?.hide();
      setActive(undefined);
      setEngineReset((value) => value + 1);
    };
    const released = (event: MouseEvent) => {
      if (event.buttons === 0) {
        pendingGesture.current?.();
      }
      if (gesture.current && !gesture.current.touch && event.buttons === 0) {
        abort();
      }
    };
    abortGesture.current = abort;
    const hidden = () => {
      if (doc.visibilityState === 'hidden') {
        abort();
      }
    };
    doc.defaultView?.addEventListener('blur', abort);
    doc.addEventListener('visibilitychange', hidden);
    doc.addEventListener('pointercancel', abort);
    doc.addEventListener('touchcancel', abort);
    doc.addEventListener('mousemove', released, true);
    return () => {
      abortGesture.current = undefined;
      doc.defaultView?.removeEventListener('blur', abort);
      doc.removeEventListener('visibilitychange', hidden);
      doc.removeEventListener('pointercancel', abort);
      doc.removeEventListener('touchcancel', abort);
      doc.removeEventListener('mousemove', released, true);
    };
  }, [history]);
  useEffect(() => {
    // Kiosk/permission changes are UI policy changes, not a drop operation.
    // Cancel only the live gesture; retain earlier drafts and their Undo history.
    if (readOnly) {
      abortGesture.current?.();
    }
  }, [readOnly]);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element || (!storageKey && !readOnly)) {
      return;
    }
    const measure = () => setWidth(Math.min(maxWidth, element.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [storageKey, maxWidth, readOnly]);

  // The former edit URL now only reveals/focuses a handle; it never starts a gesture.
  useEffect(() => {
    if (requested && storageKey && width >= minimumWidth) {
      container.current?.querySelector<HTMLButtonElement>('.wall-kpi-move')?.focus({ preventScroll: true });
      onModeChange?.(false);
    }
  }, [requested, storageKey, width, minimumWidth, onModeChange]);

  const usingGrid = Boolean((storageKey || readOnly) && width >= minimumWidth);
  const selectionEnabled = usingGrid && !readOnly && Boolean(storageKey);
  const selection = usePanelSelection({
    enabled: selectionEnabled,
    root: container,
    ids: panels.map((panel) => String(panel.id)),
    scope: storageKey,
    busy: () => Boolean(gesture.current || pendingGesture.current),
    abort: () => abortGesture.current?.(),
  });
  const clipboard = usePanelClipboard();
  const clipboardSnapshot = useRef({ draft, selection });
  clipboardSnapshot.current = { draft, selection };
  useEffect(() => {
    if (!clipboard || !storageKey || !usingGrid) {
      return;
    }
    return clipboard.register({
      key: storageKey,
      tab: selectedWorkspaceTab(locationService.getLocation().search),
      positions: () => clipboardSnapshot.current.draft,
      selected: () => clipboardSnapshot.current.selection.selected,
      busy: () => Boolean(gesture.current || pendingGesture.current),
      root: () => container.current,
    });
  }, [clipboard, storageKey, usingGrid]);
  const dirty = !sameKpiLayout(draft, saved);
  const historyIds = panels.map((panel) => String(panel.id)).join(',');
  useEffect(() => {
    if (!history || !storageKey || !usingGrid || readOnly) {
      return;
    }
    return history.connect(storageKey, {
      apply: (items) => historyController.current!.apply(items),
      validate: (items) => historyController.current!.validate(items),
      blocked: () => Boolean(gesture.current || pendingGesture.current),
    });
  }, [history, storageKey, usingGrid, readOnly, historyIds]);

  const updateDraft = (items: KpiPosition[]) => {
    setDraft(items);
    if (persistence && storageKey && !sameKpiLayout(items, draft)) {
      persistence.update(storageKey, items);
    }
    if (storageKey && draftCache) {
      if (sameKpiLayout(items, saved)) {
        draftCache.delete(storageKey);
      } else {
        draftCache.set(storageKey, items);
      }
    }
  };

  // RGL/Resizable start on mousedown. Defer that event until intent is clear,
  // then hand the original origin and accumulated movement to the same engine.
  const deferMouseGesture = (event: ReactMouseEvent<HTMLDivElement>) => {
    suppressSelectionClick.current = false;
    if (selection.protectMouseDown(event)) {
      return;
    }
    if (readOnly || replaying.current || event.button !== 0) {
      return;
    }
    const handle =
      event.target instanceof Element ? event.target.closest<HTMLElement>('.wall-kpi-move,.wall-kpi-resize') : null;
    if (!handle || handle.closest('.wall-kpi-pilot') !== container.current) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    pendingGesture.current?.();
    const { clientX, clientY } = event;
    const doc = handle.ownerDocument;
    const clear = () => {
      doc.removeEventListener('mousemove', move, true);
      doc.removeEventListener('mouseup', clear, true);
      doc.defaultView?.removeEventListener('blur', clear);
      pendingGesture.current = undefined;
      footprint.current?.hide();
    };
    const move = (next: MouseEvent) => {
      if (Math.hypot(next.clientX - clientX, next.clientY - clientY) < kpiGrid.dragThreshold) {
        return;
      }
      clear();
      replaying.current = true;
      try {
        handle.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX, clientY })
        );
      } finally {
        replaying.current = false;
      }
      // The native engine's document listener was installed during this move.
      // Deliver exactly one movement, regardless of listener ordering.
      next.stopImmediatePropagation();
      doc.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          buttons: 1,
          clientX: next.clientX,
          clientY: next.clientY,
        })
      );
    };
    pendingGesture.current = clear;
    doc.addEventListener('mousemove', move, true);
    doc.addEventListener('mouseup', clear, true);
    doc.defaultView?.addEventListener('blur', clear);
  };
  const start =
    (kind: 'move' | 'resize'): ItemCallback =>
    (items, __, item, ____, event) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest('.wall-kpi-move,.wall-kpi-resize') ||
        !container.current?.contains(target)
      ) {
        return;
      }
      const point = pointerPosition(event);
      const members = selection.begin(item.i);
      const rect = container.current.getBoundingClientRect();
      const nodes = new Map<string, HTMLElement>();
      if (kind === 'resize') {
        resizeCursor.current?.();
        resizeCursor.current = holdResizeCursor(target.closest<HTMLElement>('.wall-kpi-resize')!);
      }
      for (const id of kind === 'resize' ? [item.i] : members) {
        const node = container.current.querySelector<HTMLElement>(`[data-wall-layout-item="${id}"]`);
        if (node) {
          cancelPanelSettle(node);
          delete node.dataset.wallDropPreview;
          nodes.set(id, node);
        }
      }
      gesture.current = {
        x: point.clientX,
        y: point.clientY,
        active: false,
        touch: 'touches' in event,
        kind,
        members,
        nodes,
        west: Boolean(target.closest('.react-resizable-handle-sw')),
        left: rect.left,
        top: rect.top,
        origin: items.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
        reflowOrigin: kind === 'resize' ? resizeReflowOrigin(items, item.i, resizeReflow.current) : undefined,
        rowAnchors: panelRowAnchors(items, saved, initialLayout),
      };
      frameInput.current?.();
      if (!('touches' in event)) {
        frameInput.current = frameMouseInput(container.current.ownerDocument, () => {
          if (gesture.current) {
            gesture.current.releaseRects = [...gesture.current.nodes.values()].map((node) => ({
              node,
              rect: node.getBoundingClientRect(),
            }));
          }
        });
      }
      history?.refresh();
    };
  const applyMove: ItemCallback = (items, __, item, placeholder, event, node) => {
    const current = gesture.current;
    if (!current || current.kind !== 'move') {
      return;
    }
    const point = pointerPosition(event);
    const rect = container.current!.getBoundingClientRect();
    const delta = {
      x: point.clientX - current.x + current.left - rect.left,
      y: point.clientY - current.y + current.top - rect.top,
    };
    const geometry = { width, gap: gapX, rowPitch, rowAnchors: current.rowAnchors };
    const source = current.origin.find((entry) => entry.i === item.i)!;
    const snapSource =
      current.members.length > 1
        ? selectionBounds(current.origin.filter((entry) => current.members.includes(entry.i)))
        : source;
    const snapped = snapPanelPosition(current.origin, snapSource, delta, geometry, current.position);
    const result =
      current.preview && snapped.x === current.position?.x && snapped.y === current.position.y
        ? { layout: current.preview, target: current.target, bounds: current.footprint }
        : current.members.length > 1
          ? panelGroupMovePreview(current.origin, current.members, delta, geometry, current.position)
          : panelMovePreview(current.origin, item.i, delta, geometry, current.target, current.position);
    current.footprint = 'bounds' in result ? result.bounds : undefined;
    current.preview = result.layout;
    current.target = result.target;
    for (const entry of items) {
      const next = result.layout.find((candidate) => candidate.i === entry.i)!;
      Object.assign(entry, { x: next.x, y: next.y, moved: false });
    }
    const moving = items.find((entry) => entry.i === item.i)!;
    if (placeholder) {
      Object.assign(placeholder, { x: moving.x, y: moving.y });
    }
    Object.assign(item, { x: moving.x, y: moving.y });
    current.node = node;
    for (const [id, member] of current.nodes) {
      const origin = current.origin.find((entry) => entry.i === id)!;
      const rect = panelPixelRect(
        { ...origin, x: origin.x + snapped.x - snapSource.x, y: origin.y + snapped.y - snapSource.y },
        { width, gapX, gapY, rowPitch }
      );
      member.dataset.wallMagnet = 'move';
      member.style.setProperty('--wall-snap-left', `${rect.left}px`);
      member.style.setProperty('--wall-snap-top', `${rect.top}px`);
    }
    current.position = snapped;
  };
  const applyResize: ItemCallback = (items, __, item, placeholder, event, node) => {
    const current = gesture.current;
    if (!current || current.kind !== 'resize') {
      return;
    }
    const source = current.origin.find((entry) => entry.i === item.i)!;
    const point = pointerPosition(event);
    const rect = container.current!.getBoundingClientRect();
    const delta = {
      x: point.clientX - current.x + current.left - rect.left,
      y: point.clientY - current.y + current.top - rect.top,
    };
    const snapped = snapPanelResize(
      current.origin,
      source,
      delta,
      { width, gap: gapX, gapY, rowPitch, rowAnchors: current.rowAnchors },
      Boolean(current.west),
      item,
      current.resized
    );
    const preview =
      current.preview && current.resized && sameKpiLayout([current.resized], [snapped])
        ? current.preview
        : panelResizePreview(current.reflowOrigin ?? current.origin, snapped, Boolean(current.west));
    current.resized = snapped;
    current.preview = preview;
    // react-resizable reports the handle node, unlike native Drag's tile node.
    node = node.closest<HTMLElement>('.wall-kpi-layout-item') ?? node;
    current.node = node;
    node.dataset.wallMagnet = 'resize';
    const panelRect = panelPixelRect(snapped, { width, gapX, gapY, rowPitch });
    node.style.setProperty('--wall-snap-width', `${panelRect.width + gapX}px`);
    node.style.setProperty('--wall-snap-height', `${panelRect.height + gapY}px`);
    node.style.setProperty('--wall-snap-left', `${panelRect.left}px`);
    node.style.setProperty('--wall-snap-top', `${panelRect.top}px`);
    for (const entry of items) {
      const next = preview.find((candidate) => candidate.i === entry.i)!;
      Object.assign(entry, next, { moved: false });
    }
    const resizing = preview.find((entry) => entry.i === item.i)!;
    Object.assign(item, resizing);
    if (placeholder) {
      Object.assign(placeholder, resizing);
    }
  };
  const changed: ItemCallback = (items, __, item, ___, event) => {
    const point = pointerPosition(event);
    const current = gesture.current;
    if (
      !current ||
      (!current.active && Math.hypot(point.clientX - current.x, point.clientY - current.y) < kpiGrid.dragThreshold)
    ) {
      return;
    }
    if (!current.active) {
      current.active = true;
      suppressSelectionClick.current = true;
      // Keep bootstrap geometry measurement still; animate neighbours after real intent only.
      setMotionEnabled(true);
      setActive(item.i);
      setError('');
      setMessage('');
    }
    if (current.feedbackPreview === current.preview) {
      return;
    }
    current.feedbackPreview = current.preview;
    const position = current.footprint ?? item;
    // Commit this small overlay in the same paint as the imperative Grid size.
    // A deferred React update otherwise leaves the footprint one stop behind.
    flushSync(() =>
      footprint.current?.show(
        position,
        'destination',
        panelAlignmentGuides(
          position,
          items.filter((entry) => !current.members.includes(entry.i)),
          panelColumnPitch(width, gapX),
          rowPitch,
          gapX,
          gapY
        )
      )
    );
  };
  const dragged: ItemCallback = (...args) => {
    applyMove(...args);
    changed(...args);
  };
  const resized: ItemCallback = (...args) => {
    applyResize(...args);
    changed(...args);
  };
  const stop: ItemCallback = (items, _old, item, placeholder, _event, node) => {
    frameInput.current?.();
    frameInput.current = undefined;
    resizePointer.current?.();
    resizeCursor.current?.();
    const released =
      gesture.current?.releaseRects ??
      [...(gesture.current?.nodes.values() ?? [])].map((node) => ({ node, rect: node.getBoundingClientRect() }));
    if (gesture.current?.active && gesture.current.preview) {
      // Commit the last preview the user actually saw. Native mouseup/layout
      // state may contain a different size, pointer sample or collision result.
      const valid = validate(gesture.current.preview);
      if (valid) {
        for (const entry of items) {
          const target = valid.find((next) => next.i === entry.i);
          if (target) {
            Object.assign(entry, target, { moved: false });
          }
        }
        const target = valid.find((next) => next.i === item.i);
        if (target) {
          Object.assign(item, target);
          if (placeholder) {
            Object.assign(placeholder, target);
          }
        }
        // Bounded DOM-only evidence of the rendered prediction for browser QA.
        // It is cleared on the next gesture and is never part of a save model.
        const marker = container.current?.querySelector<HTMLElement>('.wall-layout-footprint');
        const tile = node.closest<HTMLElement>('.wall-kpi-layout-item');
        if (marker && tile && gesture.current.members.length === 1) {
          const rect = marker.getBoundingClientRect();
          tile.dataset.wallDropPreview = JSON.stringify({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          });
        }
        updateDraft(valid);
        if (gesture.current.kind === 'resize') {
          resizeReflow.current = {
            id: item.i,
            origin: gesture.current.reflowOrigin ?? gesture.current.origin,
            result: valid,
          };
        } else {
          resizeReflow.current = undefined;
        }
        if (storageKey) {
          history?.record(storageKey, gesture.current.origin, valid, saved);
        }
      } else {
        setError('적용할 수 없는 배치입니다. 이전 배치를 유지합니다.');
        setEngineReset((value) => value + 1);
      }
    }
    gesture.current?.nodes.forEach((node) => node.removeAttribute('data-wall-magnet'));
    if (gesture.current?.active && container.current) {
      settlePanels(released, container.current);
    }
    gesture.current = undefined;
    history?.refresh();
    footprint.current?.hide();
    setActive(undefined);
  };
  const cancel = () => {
    selection.clear();
    setDraft(saved);
    if (storageKey) {
      draftCache?.delete(storageKey);
      history?.clear(storageKey);
    }
    setError('');
    setMessage('배치 변경을 취소했습니다.');
    onModeChange?.(false);
  };
  const save = () => {
    if (!storageKey) {
      return;
    }
    const valid = validate(draft);
    if (!valid) {
      setError('패널 배치를 확인해 주세요.');
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, items: valid }));
      selection.clear();
      setSaved(valid);
      baseline.current = valid;
      draftCache?.delete(storageKey);
      history?.clear(storageKey);
      setError('');
      setMessage('이 브라우저에 배치를 저장했습니다.');
      onModeChange?.(false);
    } catch {
      setError('브라우저에 저장하지 못했습니다. 변경 내용은 유지됩니다.');
    }
  };

  historyController.current = {
    validate,
    apply(items) {
      const valid = validate(items);
      if (!valid || readOnly || !usingGrid || !storageKey) {
        return false;
      }
      updateDraft(valid);
      setMotionEnabled(true);
      setError('');
      setMessage('패널 배치를 되돌렸습니다.');
      return true;
    },
  };

  // Preserve the native panel/query subtree while live geometry feedback updates independently.
  const contents = useMemo(
    () =>
      usingGrid
        ? panels.map((panel) => ({
            panel,
            content: renderPanel(panel),
            actions: renderActions?.(panel),
          }))
        : [],
    [usingGrid, panels, renderPanel, renderActions]
  );
  const gridChildren = useMemo(
    () =>
      contents.map(({ panel, content, actions }) => (
        <div
          key={panel.id}
          className="wall-kpi-layout-item"
          data-wall-layout-item={panel.id}
          data-selected={active === String(panel.id)}
          data-marked={selectionEnabled && selection.selected.includes(String(panel.id))}
          role="group"
          aria-label={`${panel.title}${selectionEnabled && selection.selected.includes(String(panel.id)) ? ' 선택됨' : ''}`}
        >
          <PanelActionsProvider
            move={
              !readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="wall-kpi-move"
                  aria-label={`${panel.title} 이동 핸들`}
                  title={
                    selection.selected.length > 1 && selection.selected.includes(String(panel.id))
                      ? `선택한 ${selection.selected.length}개 패널 함께 이동`
                      : '드래그하여 이동'
                  }
                >
                  <GripHorizontal size={wallSurfaceTokens.moveGripSize} />
                </Button>
              )
            }
            actions={actions}
          >
            {content}
          </PanelActionsProvider>
        </div>
      )),
    [contents, active, readOnly, selection.selected, selectionEnabled]
  );
  const gridLayout = useMemo(
    () =>
      draft
        .filter((item) => panels.some((panel) => String(panel.id) === item.i))
        .map((item) => ({
          ...item,
          ...(bounds?.(panels.find((panel) => String(panel.id) === item.i)!, width) ?? {
            minW: 8,
            minH: kpiGrid.minHeight,
            maxH: kpiGrid.maxHeight,
          }),
          isResizable: !readOnly && selection.selected.length < 2,
          resizeHandles: readOnly || selection.selected.length > 1 ? [] : ['se' as const, 'sw' as const],
          isDraggable: !readOnly,
        })),
    [draft, bounds, panels, width, readOnly, selection.selected.length]
  );
  return (
    <div
      className="wall-kpi-pilot"
      data-wall-layout-group={label}
      data-has-selection={selection.selected.length > 0}
      ref={container}
      role="group"
      aria-label={`${label} 패널 작업 영역`}
      tabIndex={selectionEnabled ? 0 : undefined} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex -- Focus scopes panel-selection shortcuts without stealing input/browser shortcuts.
      onMouseDownCapture={deferMouseGesture}
      onPointerDownCapture={(event) => {
        if (readOnly || event.button !== 0 || event.pointerType === 'touch') {
          return;
        }
        const handle = event.target instanceof Element ? event.target.closest<HTMLElement>('.wall-kpi-resize') : null;
        if (handle?.closest('.wall-kpi-pilot') === container.current) {
          resizePointer.current?.();
          resizePointer.current = captureResizePointer(handle, event.pointerId, () => abortGesture.current?.());
        }
      }}
      onClickCapture={(event) => {
        if (suppressSelectionClick.current) {
          suppressSelectionClick.current = false;
          const target = event.target;
          if (target instanceof Element && !target.closest('button,a,input,textarea,select')) {
            event.stopPropagation();
            return;
          }
        }
        selection.click(event);
      }}
    >
      {selectionEnabled && (
        <PanelSelectionControls
          count={selection.selected.length}
          all={selection.all}
          clear={selection.clear}
          disabled={Boolean(active)}
        />
      )}
      {!persistence && storageKey && dirty && !active && (
        <div className="wall-kpi-layout-toolbar" role="group" aria-label={`${label} 배치 변경 저장`}>
          <span>
            {label}
            <Trans i18nKey="wall.panel-layout-grid.text-44847c8c"> 배치 변경 · 이 브라우저에만 저장</Trans>
          </span>
          <Button size="sm" variant="ghost" onClick={cancel}>
            <Trans i18nKey="wall.panel-layout-grid.text-19b2d19b">취소</Trans>
          </Button>
          <Button size="sm" onClick={save}>
            <Trans i18nKey="wall.panel-layout-grid.text-c7e13fab">배치 저장</Trans>
          </Button>
        </div>
      )}
      {error && (
        <p className="wall-kpi-layout-feedback" role="alert">
          {error}
        </p>
      )}
      <span className="wall-kpi-layout-announcement" role="status">
        {message}
      </span>
      {usingGrid ? (
        <div
          className="wall-kpi-layout"
          data-interacting={Boolean(active)}
          style={{
            width,
            '--wall-kpi-gutter': `${gapX}px`,
            '--wall-kpi-gutter-y': `${gapY}px`,
            '--wall-kpi-grid-step': `${panelColumnPitch(width, gapX)}px`,
            '--wall-layout-grid-row': `${interactionRowStep(rowPitch) * rowPitch}px`,
          }}
        >
          <LayoutGridGuide
            width={width}
            rowPitch={rowPitch}
            rowStep={interactionRowStep(rowPitch)}
            rowAnchors={gesture.current?.rowAnchors ?? panelRowAnchors(draft, saved, initialLayout)}
            gapX={gapX}
            gapY={gapY}
          />
          {/* Use zero engine margin and inset gutters: installed Grid calcXY subtracts margin
              even with containerPadding=0, which otherwise shifts a drag by one cell. */}
          <SharedGridLayout
            key={engineReset}
            className={motionEnabled ? 'react-grid-layout--enable-move-animations' : undefined}
            width={width + gapX}
            cols={kpiGrid.columns}
            rowHeight={rowPitch}
            margin={[0, 0]}
            containerPadding={[0, 0]}
            layout={gridLayout}
            isDraggable={!readOnly}
            isResizable={!readOnly}
            draggableHandle=".wall-kpi-move"
            draggableCancel=".wall-kpi-no-drag"
            useCSSTransforms
            compactType={null}
            onDragStart={start('move')}
            onDrag={dragged}
            onDragStop={stop}
            onResizeStart={start('resize')}
            onResize={resized}
            onResizeStop={stop}
            resizeHandle={(axis, ref) => (
              <span
                ref={ref}
                className={`react-resizable-handle react-resizable-handle-${axis} wall-kpi-resize`}
                role="img"
                aria-label={axis === 'sw' ? '왼쪽 아래 크기 조절 핸들' : '오른쪽 아래 크기 조절 핸들'}
              >
                <span className="wall-kpi-corner-grip" aria-hidden="true" />
              </span>
            )}
          >
            {gridChildren}
          </SharedGridLayout>
          <LayoutFootprint ref={footprint} width={width} gapX={gapX} gapY={gapY} rowPitch={rowPitch} />
        </div>
      ) : (
        original
      )}
    </div>
  );
}
