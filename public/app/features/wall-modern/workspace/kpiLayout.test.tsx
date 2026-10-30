import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { KpiLayoutPilot } from './KpiLayoutPilot';
import { WallPanelHeader } from './PanelActionDock';
import { canAdjustKpiLayout, defaultKpiLayout, readKpiLayout, validateKpiLayout } from './kpiLayout';

const key = 'wall-kpi-layout-test';
const panels = [28, 30, 34, 36].map((id) => ({
  id,
  title: `KPI ${id}`,
  type: 'stat',
  width: 12,
  height: 6,
  model: {},
}));
function setup(storageKey?: string) {
  return render(
    <KpiLayoutPilot
      panels={panels}
      storageKey={storageKey}
      original={<div>원래 KPI</div>}
      renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
    />
  );
}
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement;
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1076,
    height: 96,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 96,
    right: 1076,
    toJSON: () => ({}),
  });
});
afterEach(() => jest.restoreAllMocks());

it('requires admin role and dashboard edit permission; an Editor is not an administrator', () => {
  expect(canAdjustKpiLayout({ orgRole: 'Admin', isGrafanaAdmin: false }, true)).toBe(true);
  expect(canAdjustKpiLayout({ orgRole: 'Viewer', isGrafanaAdmin: false }, true)).toBe(false);
  expect(canAdjustKpiLayout({ orgRole: 'Editor', isGrafanaAdmin: false }, true)).toBe(false);
  expect(canAdjustKpiLayout({ orgRole: 'Admin', isGrafanaAdmin: true }, false)).toBe(false);
});

it('keeps a handle click below the movement threshold free of layout guidance and changes', async () => {
  const { container } = setup(key);
  await ready();
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  const handle = screen.getByRole('button', { name: 'KPI 28 이동 핸들' });
  fireEvent.mouseDown(handle, { button: 0, clientX: 30, clientY: 10 });
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(container.querySelector('.react-grid-placeholder')).toBeNull();
  fireEvent.mouseMove(document, { buttons: 1, clientX: 33, clientY: 12 });
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  fireEvent.mouseUp(document, { clientX: 33, clientY: 12 });
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(localStorage.getItem(key)).toBeNull();
});

it('clears a held footprint when the pointer is cancelled or returns with its button released', async () => {
  const { container } = setup(key);
  await ready();
  const handle = screen.getByRole('button', { name: 'KPI 28 이동 핸들' });
  fireEvent.mouseDown(handle, { button: 0, clientX: 30, clientY: 10 });
  fireEvent.pointerCancel(document);
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  fireEvent.mouseDown(handle, { button: 0, clientX: 30, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 0, clientX: 30, clientY: 10 });
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(container.querySelector('[data-interacting="true"]')).toBeNull();
});
it('rejects corrupt, duplicate, out-of-bounds and overlapping stored geometry', () => {
  expect(validateKpiLayout(defaultKpiLayout())).toHaveLength(4);
  for (const change of [{ i: '999' }, { i: '30' }, { w: 49 }, { h: 1 }, { x: 0.5 }, { x: 12 }]) {
    const value = defaultKpiLayout();
    Object.assign(value[0], change);
    expect(validateKpiLayout(value)).toBeUndefined();
  }
  localStorage.setItem(key, 'broken');
  expect(readKpiLayout(key)).toBeUndefined();
});
it('does not expose controls or apply a stored administrator layout to normal viewers', () => {
  localStorage.setItem(key, JSON.stringify({ version: 1, items: defaultKpiLayout() }));
  setup();
  expect(screen.getByText('원래 KPI')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '배치 조정' })).not.toBeInTheDocument();
});

async function ready() {
  await waitFor(() => expect(document.querySelector('.wall-kpi-layout')).toBeInTheDocument());
}

it('keeps data/action subtrees stable during continuous pixel movement and updates only geometry feedback', async () => {
  const renderPanel = jest.fn((panel: (typeof panels)[number]) => <WallPanelHeader title={panel.title} />);
  const renderActions = jest.fn(() => <button>panel action</button>);
  const { container } = render(
    <KpiLayoutPilot
      panels={panels}
      storageKey={key}
      original={<div>original</div>}
      renderPanel={renderPanel}
      renderActions={renderActions}
    />
  );
  await ready();
  expect(renderPanel).toHaveBeenCalledTimes(4);
  expect(renderActions).toHaveBeenCalledTimes(4);
  expect(container.querySelector('.react-grid-layout')).not.toHaveClass('react-grid-layout--enable-move-animations');
  fireEvent.mouseDown(screen.getByRole('button', { name: 'KPI 28 이동 핸들' }), {
    button: 0,
    clientX: 30,
    clientY: 10,
  });
  for (let x = 36; x <= 45; x++) {
    fireEvent.mouseMove(document, { clientX: x, clientY: 10, buttons: 1 });
    expect(container.querySelector('.react-draggable-dragging')).toHaveStyle({
      transform: `translate(${x - 30}px,0px)`,
    });
  }
  expect(container.querySelector('[data-wall-footprint="destination"]')).toBeInTheDocument();
  expect(container.querySelector('.react-grid-layout')).toHaveClass('react-grid-layout--enable-move-animations');
  expect(renderPanel).toHaveBeenCalledTimes(4);
  expect(renderActions).toHaveBeenCalledTimes(4);
  fireEvent.mouseUp(document, { clientX: 45, clientY: 10 });
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(renderPanel).toHaveBeenCalledTimes(4);
  // A small overlap is not a committed swap and must leave the original slots unchanged.
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
function moveFirst() {
  fireEvent.mouseDown(screen.getByRole('button', { name: 'KPI 28 이동 핸들' }), {
    button: 0,
    clientX: 30,
    clientY: 10,
  });
  fireEvent.mouseMove(document, { clientX: 60, clientY: 154, buttons: 1 });
}
function finishMove() {
  fireEvent.mouseUp(document, { clientX: 60, clientY: 154 });
}
it('keeps card, menu and handle clicks separate from actual gestures, including small pointer jitter', async () => {
  const { container } = setup(key);
  await ready();
  fireEvent.mouseDown(screen.getByText('KPI 28'));
  fireEvent.mouseUp(screen.getByText('KPI 28'));
  const handle = screen.getByRole('button', { name: 'KPI 28 이동 핸들' });
  fireEvent.mouseDown(handle, { button: 0, clientX: 30, clientY: 10 });
  fireEvent.mouseMove(document, { clientX: 33, clientY: 12, buttons: 1 });
  expect(container.querySelector('.react-draggable-dragging')).toBeNull();
  expect(container.querySelector('.react-grid-placeholder')).toBeNull();
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  fireEvent.mouseUp(document, { clientX: 33, clientY: 12 });
  expect(container.querySelector('[data-selected="true"]')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(localStorage.getItem(key)).toBeNull();
});
it('shows grid/preview/size only after the movement threshold and clears them immediately on release', async () => {
  const { container } = setup(key);
  await ready();
  moveFirst();
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'true');
  expect(container.querySelector('.react-grid-placeholder')).toBeInTheDocument();
  expect(container.querySelector('[data-wall-footprint="destination"]')).toHaveTextContent('px');
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  finishMove();
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(container.querySelector('.react-grid-placeholder')).toBeNull();
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(container.querySelector('[data-selected="true"]')).toBeNull();
  expect(screen.getByRole('button', { name: '배치 저장' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(localStorage.getItem(key)).toBeNull();
});
it('keeps resize clicks idle and uses the same threshold and completion states for actual resize', async () => {
  const { container } = setup(key);
  await ready();
  const resize = screen.getAllByRole('img', { name: '오른쪽 아래 크기 조절 핸들' })[0];
  fireEvent.mouseDown(resize, { button: 0, clientX: 260, clientY: 96 });
  fireEvent.mouseUp(document, { clientX: 260, clientY: 96 });
  expect(container.querySelector('.resizing')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  fireEvent.mouseDown(resize, { button: 0, clientX: 260, clientY: 96 });
  fireEvent.mouseMove(document, { clientX: 286, clientY: 114, buttons: 1 });
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'true');
  expect(container.querySelector('.wall-layout-footprint')).toHaveTextContent('283 × 114 px');
  fireEvent.mouseUp(document, { clientX: 286, clientY: 114 });
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(screen.getByRole('button', { name: '배치 저장' })).toBeInTheDocument();
});
it('separates save and cancel, restores saved geometry on reload, and shows no controls for an unchanged gesture', async () => {
  const view = setup(key);
  await ready();
  moveFirst();
  finishMove();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  const stored = readKpiLayout(key)!;
  expect(stored[0].y).toBeGreaterThan(0);
  expect(localStorage.getItem(key)).not.toMatch(/query|fieldConfig|gridPos/);
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  view.unmount();
  const reloaded = setup(key);
  await ready();
  expect(reloaded.container.querySelector('.wall-kpi-layout-item')).toHaveStyle({
    transform: `translate(${Math.round((stored[0].x * 1088) / 48)}px,${stored[0].y * 18}px)`,
  });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
it('does not create an unsaved change when a real drag returns to its original position', async () => {
  const { container } = setup(key);
  await ready();
  fireEvent.mouseDown(screen.getByRole('button', { name: 'KPI 28 이동 핸들' }), {
    button: 0,
    clientX: 30,
    clientY: 10,
  });
  fireEvent.mouseMove(document, { clientX: 30, clientY: 28, buttons: 1 });
  fireEvent.mouseMove(document, { clientX: 30, clientY: 10, buttons: 1 });
  fireEvent.mouseUp(document, { clientX: 30, clientY: 10 });
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
it('keeps the draft and controls when browser storage fails', async () => {
  setup(key);
  await ready();
  moveFirst();
  finishMove();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다');
  expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
});
it('treats the old edit URL as a handle focus request without exposing an edit mode', async () => {
  const mode = jest.fn();
  const { container } = render(
    <KpiLayoutPilot
      panels={panels}
      storageKey={key}
      requested
      onModeChange={mode}
      original={<div>original</div>}
      renderPanel={(p) => <WallPanelHeader title={p.title} />}
    />
  );
  await ready();
  expect(mode).toHaveBeenCalledWith(false);
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '기본 배치' })).not.toBeInTheDocument();
});

it('keeps a vertical-only move in its original column without displacing adjacent KPIs', async () => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const x = this.classList.contains('wall-kpi-layout-item') && this.textContent?.includes('KPI 34') ? 544 : 0;
    return { x, y: 0, left: x, top: 0, width: 1076, height: 96, right: x + 1076, bottom: 96, toJSON: () => ({}) };
  });
  const { container } = setup(key);
  await ready();
  fireEvent.mouseDown(screen.getByRole('button', { name: 'KPI 34 이동 핸들' }), {
    button: 0,
    clientX: 574,
    clientY: 10,
  });
  fireEvent.mouseMove(document, { clientX: 574, clientY: 118, buttons: 1 });
  fireEvent.mouseUp(document, { clientX: 574, clientY: 118 });
  expect(container.querySelectorAll('.wall-kpi-layout-item')[2]).toHaveStyle({ transform: 'translate(544px,108px)' });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  const expected = defaultKpiLayout();
  expected[2].y = 6;
  expect(readKpiLayout(key)).toEqual(expected);
});

it('clears an interrupted drag on blur and retains earlier unsaved geometry', async () => {
  const { container } = setup(key);
  await ready();
  moveFirst();
  finishMove();
  const before = container.querySelector('.wall-kpi-layout-item')!.getAttribute('style');
  fireEvent.mouseDown(screen.getByRole('button', { name: 'KPI 28 이동 핸들' }), {
    button: 0,
    clientX: 30,
    clientY: 10,
  });
  fireEvent.mouseMove(document, { clientX: 100, clientY: 280, buttons: 1 });
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'true');
  fireEvent.blur(window);
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(container.querySelector('.wall-layout-footprint')).toBeNull();
  expect(container.querySelector('.react-grid-placeholder')).toBeNull();
  expect(container.querySelector('.wall-kpi-layout-item')).toHaveAttribute('style', before!);
  expect(screen.getByRole('button', { name: '배치 저장' })).toBeInTheDocument();
});
it('recovers after a lost mouse release and never starts layout editing from a panel-body drag', async () => {
  const { container } = setup(key);
  await ready();
  fireEvent.mouseDown(screen.getByText('KPI 28'), { button: 0, clientX: 30, clientY: 10 });
  fireEvent.mouseMove(document, { clientX: 80, clientY: 100, buttons: 1 });
  fireEvent.mouseUp(document);
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  moveFirst();
  fireEvent.mouseMove(document, { clientX: 80, clientY: 100, buttons: 0 });
  expect(container.querySelector('.wall-kpi-layout')).toHaveAttribute('data-interacting', 'false');
  expect(container.querySelector('.react-grid-placeholder')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
