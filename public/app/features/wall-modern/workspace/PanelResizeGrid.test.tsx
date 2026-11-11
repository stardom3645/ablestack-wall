import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { validatePanelLayout } from './panelLayout';

const initial = [{ i: '501', x: 17, y: 123, w: 14, h: 60 }];
const panels = [{ id: 501, title: 'Resource', type: 'stat', width: 7, height: 4, model: {} }];
const validate = (value: unknown) => validatePanelLayout(value, ['501']);
const limits = () => ({ minW: 4, minH: 38, maxH: 100 });
let paint: FrameRequestCallback;
function setup(readOnly = false) {
  return render(
    <PanelLayoutGrid
      panels={panels}
      readOnly={readOnly}
      initialLayout={initial}
      validate={validate}
      bounds={limits}
      storageKey="resize-grid-regression"
      rowPitch={2}
      maxWidth={Infinity}
      original={null}
      renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
    />
  );
}
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
  jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement;
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 120,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 120,
    toJSON: () => ({}),
  });
});
afterEach(() => jest.restoreAllMocks());

it('keeps the handle DOM stable and persists the constrained preview without a release jump', async () => {
  const view = setup();
  await screen.findByRole('button', { name: 'Resource 이동 핸들' });
  const tile = view.container.querySelector<HTMLElement>('[data-wall-layout-item="501"]')!;
  const handle = tile.querySelector<HTMLElement>('.wall-kpi-resize')!;
  const grid = view.container.querySelector<HTMLElement>('.wall-kpi-layout')!;
  const guide = grid.querySelector('[data-wall-grid-guide]')!;
  const idleGuide = guide.outerHTML;
  fireEvent.mouseEnter(tile);
  fireEvent.mouseDown(handle, { button: 0, clientX: 660, clientY: 354 });
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  fireEvent.mouseMove(document, { buttons: 1, clientX: 640, clientY: 154 });
  act(() => paint(16));
  expect(grid.querySelector('[data-wall-grid-guide]')).toBe(guide);
  expect(guide.outerHTML).toBe(idleGuide);
  expect(guide.querySelector('[data-grid-fixed-corner]')).toBeNull();
  const resizingGuide = guide.outerHTML;
  fireEvent.mouseMove(document, { buttons: 1, clientX: 640, clientY: 154 });
  act(() => paint(20));
  expect(guide.outerHTML).toBe(resizingGuide);
  expect(tile.querySelector('.wall-kpi-resize')).toBe(handle);
  expect(tile.style.getPropertyValue('--wall-snap-height')).toBe('78px');
  expect(view.container.querySelector('[data-wall-footprint="destination"]')).toHaveStyle({ height: '66px' });
  fireEvent.mouseUp(document, { clientX: 640, clientY: 154 });
  expect(tile.querySelector('.wall-kpi-resize')).toBe(handle);
  expect(tile).toHaveStyle({ height: '78px', transform: 'translate(358px,246px)' });
  expect(document.querySelector('[data-wall-resize-cursor]')).toBeNull();
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '취소', exact: true }));
  expect(tile).toHaveStyle({ height: '120px' });
  fireEvent.mouseDown(handle, { button: 0, clientX: 660, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 640, clientY: 154 });
  act(() => paint(32));
  fireEvent.mouseUp(document, { clientX: 640, clientY: 154 });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(JSON.parse(localStorage.getItem('resize-grid-regression')!).items).toEqual([
    { i: '501', x: 17, y: 123, w: 13, h: 39 },
  ]);
  view.unmount();
  const restored = setup();
  await waitFor(() =>
    expect(restored.container.querySelector('[data-wall-layout-item="501"]')).toHaveStyle({ height: '78px' })
  );
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});

it('removes the temporary cursor and guide on interrupted Resize without saving it', async () => {
  const view = setup();
  await screen.findByRole('button', { name: 'Resource 이동 핸들' });
  const handle = view.container.querySelector('.wall-kpi-resize')!;
  fireEvent.mouseDown(handle, { button: 0, clientX: 660, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 640, clientY: 154 });
  act(() => paint(16));
  expect(document.querySelector('[data-wall-resize-cursor]')).not.toBeNull();
  fireEvent.blur(window);
  expect(document.querySelector('[data-wall-resize-cursor]')).toBeNull();
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});

it('offers both bottom corners and keeps the opposite horizontal edge while resizing from the left', async () => {
  const view = setup();
  await screen.findByRole('button', { name: 'Resource 이동 핸들' });
  const west = screen.getByRole('img', { name: '왼쪽 아래 크기 조절 핸들' });
  const east = screen.getByRole('img', { name: '오른쪽 아래 크기 조절 핸들' });
  // Horizontal shrink: only x/w change; the existing top and right-hand grid corner stay fixed.
  fireEvent.mouseDown(west, { button: 0, clientX: 360, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 402, clientY: 354 });
  act(() => paint(16));
  const preview = view.container.querySelector('[data-wall-footprint="destination"]')!;
  expect(preview).not.toBeNull();
  fireEvent.mouseUp(document, { clientX: 402, clientY: 354 });
  expect(screen.getByRole('img', { name: '왼쪽 아래 크기 조절 핸들' })).toBe(west);
  expect(screen.getByRole('img', { name: '오른쪽 아래 크기 조절 핸들' })).toBe(east);
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  const shrunk = JSON.parse(localStorage.getItem('resize-grid-regression')!).items[0];
  expect(shrunk).toMatchObject({ x: 19, w: 12, y: 123, h: 60 });
  expect(shrunk.x + shrunk.w).toBe(initial[0].x + initial[0].w);
  // Resize in the other direction via the same native handle, retaining the pinned right edge.
  fireEvent.mouseDown(west, { button: 0, clientX: 402, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 360, clientY: 354 });
  act(() => paint(32));
  fireEvent.mouseUp(document, { clientX: 360, clientY: 354 });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(JSON.parse(localStorage.getItem('resize-grid-regression')!).items).toEqual(initial);
  view.unmount();
  setup();
  await screen.findByRole('button', { name: 'Resource 이동 핸들' });
  expect(screen.getByRole('img', { name: '왼쪽 아래 크기 조절 핸들' })).toBeInTheDocument();
});

it('does not expose either resize direction in read-only mode', async () => {
  const view = setup(true);
  await waitFor(() => expect(view.container.querySelector('[data-wall-layout-item="501"]')).not.toBeNull());
  expect(screen.queryByRole('img', { name: '왼쪽 아래 크기 조절 핸들' })).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: '오른쪽 아래 크기 조절 핸들' })).not.toBeInTheDocument();
});

it('keeps the current left edge when switching from a left resize to a right resize', async () => {
  const view = setup();
  await screen.findByRole('button', { name: 'Resource 이동 핸들' });
  const west = screen.getByRole('img', { name: '왼쪽 아래 크기 조절 핸들' });
  const east = screen.getByRole('img', { name: '오른쪽 아래 크기 조절 핸들' });
  const guide = view.container.querySelector('[data-wall-grid-guide]')!;
  const sharedGuide = guide.outerHTML;
  fireEvent.mouseDown(west, { button: 0, clientX: 360, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 402, clientY: 354 });
  act(() => paint(16));
  expect(guide.outerHTML).toBe(sharedGuide);
  fireEvent.mouseUp(document, { clientX: 402, clientY: 354 });
  fireEvent.mouseDown(east, { button: 0, clientX: 660, clientY: 354 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 618, clientY: 354 });
  act(() => paint(32));
  expect(guide.outerHTML).toBe(sharedGuide);
  fireEvent.mouseUp(document, { clientX: 618, clientY: 354 });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(JSON.parse(localStorage.getItem('resize-grid-regression')!).items).toEqual([
    { i: '501', x: 19, y: 123, w: 10, h: 60 },
  ]);
});
