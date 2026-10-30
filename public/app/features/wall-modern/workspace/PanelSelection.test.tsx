import { act, fireEvent, render, screen } from '@testing-library/react';

import { WallLayoutHistoryControls } from '../toolbar/WallLayoutHistoryControls';

import { WallLayoutHistoryProvider } from './LayoutHistoryContext';
import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { validatePanelLayout } from './panelLayout';

// JSDOM lacks the Canvas transform API used for pixel feedback; these tests
// exercise selection and stored coordinates, not browser matrix rendering.
const originalMatrix = Object.getOwnPropertyDescriptor(globalThis, 'DOMMatrixReadOnly');
beforeAll(() =>
  Object.defineProperty(globalThis, 'DOMMatrixReadOnly', {
    configurable: true,
    value: class {
      m41 = 0;
      m42 = 0;
    },
  })
);
afterAll(() => {
  if (originalMatrix) {
    Object.defineProperty(globalThis, 'DOMMatrixReadOnly', originalMatrix);
  } else {
    Reflect.deleteProperty(globalThis, 'DOMMatrixReadOnly');
  }
});

const initial = [
  { i: '28', x: 0, y: 0, w: 12, h: 54 },
  { i: '30', x: 12, y: 0, w: 12, h: 54 },
  { i: '32', x: 0, y: 150, w: 12, h: 54 },
];
const panels = initial.map((item) => ({
  id: Number(item.i),
  title: item.i,
  type: 'stat',
  width: 12,
  height: 6,
  model: {},
}));
const validate = (value: unknown) =>
  validatePanelLayout(
    value,
    initial.map((item) => item.i)
  );
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement;
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 96,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 96,
    toJSON: () => ({}),
  });
});
afterEach(() => jest.restoreAllMocks());
function setup(readOnly = false) {
  return render(
    <WallLayoutHistoryProvider>
      <WallLayoutHistoryControls />
      <PanelLayoutGrid
        panels={panels}
        initialLayout={initial}
        validate={validate}
        storageKey={readOnly ? undefined : 'selection-test'}
        readOnly={readOnly}
        original={null}
        renderPanel={(panel) => (
          <>
            <WallPanelHeader title={<h3>{panel.title}</h3>} />
            <div data-testid="data-testid panel content">
              <canvas aria-label={`${panel.title} 차트`} />
              <input aria-label={`${panel.title} 입력`} />
            </div>
          </>
        )}
        rowPitch={2}
        maxWidth={Infinity}
        bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
      />
    </WallLayoutHistoryProvider>
  );
}
const marked = () => document.querySelectorAll('[data-marked="true"]');
const root = () => screen.getByRole('group', { name: '핵심 자원 패널 작업 영역' });
const item = (id: string) => document.querySelector(`[data-wall-layout-item="${id}"]`)!;
async function selectTwo() {
  await screen.findByRole('button', { name: '28 이동 핸들' });
  fireEvent.click(screen.getByRole('heading', { name: '28' }), { ctrlKey: true });
  fireEvent.click(screen.getByRole('heading', { name: '30' }), { metaKey: true });
}

it('toggles multiple members without dirtying layout or showing a grid; selection disables ambiguous resizing', async () => {
  setup();
  await selectTwo();
  expect(marked()).toHaveLength(2);
  expect(item('28').querySelector('[data-wall-panel-header="hybrid"]')).toBeInTheDocument();
  expect(item('30').querySelector('[data-wall-panel-header="hybrid"]')).toBeInTheDocument();
  expect(document.querySelector('.wall-panel-context-toolbar')).not.toBeInTheDocument();
  expect(screen.getByRole('toolbar', { name: '선택 패널 도구' })).toHaveTextContent('2개 선택');
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(document.querySelector('[data-interacting="true"]')).not.toBeInTheDocument();
  expect(document.querySelectorAll('.wall-kpi-resize')).toHaveLength(0);
  fireEvent.click(screen.getByRole('heading', { name: '30' }), { shiftKey: true });
  expect(marked()).toHaveLength(1);
  expect(document.querySelectorAll('.wall-kpi-resize')).toHaveLength(3);
});

it('selects the current tab with Ctrl/Cmd+A, clears with Escape, and preserves text/chart input', async () => {
  setup();
  await selectTwo();
  expect(fireEvent.keyDown(screen.getByRole('textbox', { name: '28 입력' }), { key: 'a', ctrlKey: true })).toBe(true);
  expect(marked()).toHaveLength(2);
  fireEvent.click(screen.getByLabelText('32 차트'));
  expect(marked()).toHaveLength(2);
  expect(fireEvent.keyDown(root(), { key: 'a', metaKey: true })).toBe(false);
  expect(marked()).toHaveLength(3);
  fireEvent.keyDown(root(), { key: 'Escape' });
  expect(marked()).toHaveLength(0);
  fireEvent.keyDown(root(), { key: 'a', ctrlKey: true });
  expect(marked()).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: '패널 선택 해제' }));
  expect(marked()).toHaveLength(0);
});

it('moves members together in native Grid and replays the entire transaction with Undo/Redo', async () => {
  setup();
  await selectTwo();
  fireEvent.mouseDown(screen.getByRole('button', { name: '28 이동 핸들' }), { button: 0, clientX: 20, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 310 });
  fireEvent.keyDown(root(), { key: 'a', ctrlKey: true });
  expect(marked()).toHaveLength(2);
  fireEvent.mouseUp(document, { clientX: 20, clientY: 310 });
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,300px)' });
  expect(item('30')).toHaveStyle({ transform: 'translate(253px,300px)' });
  expect(item('32')).toHaveStyle({ transform: 'translate(0px,408px)' });
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(item('30')).toHaveStyle({ transform: 'translate(253px,0px)' });
  expect(item('32')).toHaveStyle({ transform: 'translate(0px,300px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다시 실행' }));
  expect(item('30')).toHaveStyle({ transform: 'translate(253px,300px)' });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(marked()).toHaveLength(0);
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,0px)' });
});

it('cancels an in-flight group gesture with Escape without recording a layout change', async () => {
  setup();
  await selectTwo();
  fireEvent.mouseDown(screen.getByRole('button', { name: '28 이동 핸들' }), { button: 0, clientX: 20, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 310 });
  fireEvent.keyDown(root(), { key: 'Escape' });
  expect(marked()).toHaveLength(0);
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(item('30')).toHaveStyle({ transform: 'translate(253px,0px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument();
});

it('does not expose selection or intercept select-all for viewers', async () => {
  setup(true);
  await screen.findByRole('heading', { name: '28' });
  fireEvent.click(screen.getByRole('heading', { name: '28' }), { ctrlKey: true });
  expect(fireEvent.keyDown(root(), { key: 'a', ctrlKey: true })).toBe(true);
  expect(marked()).toHaveLength(0);
  expect(screen.queryByRole('toolbar', { name: '선택 패널 도구' })).not.toBeInTheDocument();
});

it('handles workspace Escape before a native document shortcut while leaving outside shortcuts alone', async () => {
  const nativeShortcut = jest.fn((event: KeyboardEvent) => event.preventDefault());
  document.addEventListener('keydown', nativeShortcut);
  try {
    setup();
    await selectTwo();
    fireEvent.keyDown(root(), { key: 'Escape' });
    expect(marked()).toHaveLength(0);
    expect(nativeShortcut).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(nativeShortcut).toHaveBeenCalledTimes(1);
  } finally {
    document.removeEventListener('keydown', nativeShortcut);
  }
});

it('does not pass a removed panel to bounds during the first render of native cancel', () => {
  const layout = (remaining: typeof panels, positions: typeof initial) => (
    <PanelLayoutGrid
      panels={remaining}
      initialLayout={positions}
      validate={(value) =>
        validatePanelLayout(
          value,
          remaining.map((panel) => String(panel.id))
        )
      }
      storageKey="removed-panel-regression"
      original={null}
      renderPanel={(panel) => <span>{panel.title}</span>}
      bounds={(panel) => ({ minW: panel.width, minH: 1, maxH: 2000 })}
    />
  );
  const view = render(layout(panels, initial));
  expect(() => view.rerender(layout(panels.slice(0, 2), initial.slice(0, 2)))).not.toThrow();
  expect(view.container.querySelector('[data-wall-layout-item="32"]')).not.toBeInTheDocument();
});

it('pins the held card to grid stops even when the pointer is between dots', async () => {
  setup();
  await screen.findByRole('button', { name: '28 이동 핸들' });
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  fireEvent.mouseDown(screen.getByRole('button', { name: '28 이동 핸들' }), { button: 0, clientX: 20, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 31, clientY: 10 });
  act(() => paint(16));
  expect(item('28').getAttribute('data-wall-magnet')).toBe('move');
  expect((item('28') as HTMLElement).style.getPropertyValue('--wall-snap-left')).toBe('0px');
  expect((item('28') as HTMLElement).style.getPropertyValue('--wall-snap-top')).toBe('0px');
  fireEvent.mouseMove(document, { buttons: 1, clientX: 44, clientY: 10 });
  act(() => paint(32));
  expect((item('28') as HTMLElement).style.getPropertyValue('--wall-snap-left')).toBe('21px');
  fireEvent.mouseUp(document, { clientX: 44, clientY: 10 });
  expect(document.querySelector('[data-interacting="true"]')).not.toBeInTheDocument();
  expect(document.querySelector('[data-wall-magnet]')).not.toBeInTheDocument();
});

it('pins live Resize dimensions to the same grid as its footprint', async () => {
  setup();
  await screen.findByRole('button', { name: '28 이동 핸들' });
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  fireEvent.mouseDown(item('28').querySelector('.wall-kpi-resize')!, { button: 0, clientX: 240, clientY: 95 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 250, clientY: 99 });
  act(() => paint(16));
  const tile = item('28') as HTMLElement;
  expect(tile.getAttribute('data-wall-magnet')).toBe('resize');
  expect(tile.style.getPropertyValue('--wall-snap-width')).toBe('253px');
  expect(tile.style.getPropertyValue('--wall-snap-height')).toBe('108px');
  const sameFrame: string[] = [];
  const observe = () => {
    const marker = document.querySelector<HTMLElement>('[data-wall-footprint="destination"]');
    sameFrame.push(
      `${tile.style.getPropertyValue('--wall-snap-width')}/${marker?.style.width}/${marker?.style.height}`
    );
  };
  // Read before act() can flush deferred React work: the preview must already
  // match the native resize in this event's paint, not on the next input.
  document.addEventListener('mousemove', observe);
  fireEvent.mouseMove(document, { buttons: 1, clientX: 264, clientY: 108 });
  act(() => paint(32));
  document.removeEventListener('mousemove', observe);
  expect(sameFrame).toEqual(['274px/262px/108px']);
  expect(tile.style.getPropertyValue('--wall-snap-width')).toBe('274px');
  expect(tile.style.getPropertyValue('--wall-snap-height')).toBe('120px');
  expect(document.querySelector('[data-wall-footprint="destination"]')).toHaveStyle({
    width: '262px',
    height: '108px',
  });
  expect(document.querySelector('[data-wall-footprint="destination"]')).toHaveTextContent('262 × 108 px');
  fireEvent.mouseUp(document, { clientX: 264, clientY: 108 });
  expect(document.querySelector('[data-interacting="true"]')).not.toBeInTheDocument();
});

it('commits the last displayed Resize prediction even if mouseup has another pointer sample', async () => {
  setup();
  await screen.findByRole('button', { name: '28 이동 핸들' });
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  fireEvent.mouseDown(item('28').querySelector('.wall-kpi-resize')!, { button: 0, clientX: 240, clientY: 95 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 264, clientY: 108 });
  act(() => paint(16));
  expect(document.querySelector('[data-wall-footprint="destination"]')).toHaveStyle({
    width: '262px',
    height: '108px',
    transform: 'translate(0px, 0px)',
  });
  fireEvent.mouseUp(document, { clientX: 330, clientY: 180 });
  // The native item includes its 12px trailing padding; the visible card is
  // exactly the 262x108 border box advertised above, not the mouseup's size.
  expect(item('28')).toHaveStyle({ width: '274px', height: '120px', transform: 'translate(0px,0px)' });
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(item('28')).toHaveStyle({ width: '253px', height: '108px' });
});

it('commits the last predicted drop and neighbour positions instead of recomputing on mouseup', async () => {
  setup();
  await screen.findByRole('button', { name: '28 이동 핸들' });
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  fireEvent.mouseDown(screen.getByRole('button', { name: '28 이동 핸들' }), { button: 0, clientX: 20, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 310 });
  act(() => paint(16));
  expect(document.querySelector('[data-wall-footprint="destination"]')).toHaveStyle({
    width: '241px',
    height: '96px',
    transform: 'translate(0px, 300px)',
  });
  fireEvent.mouseUp(document, { clientX: 20, clientY: 610 });
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,300px)' });
  expect(item('32')).toHaveStyle({ transform: 'translate(0px,0px)' });
});

it('aborts live Resize when switching to read-only while preserving earlier edits and Undo', async () => {
  const content = (readOnly: boolean) => (
    <WallLayoutHistoryProvider>
      <WallLayoutHistoryControls />
      <PanelLayoutGrid
        panels={panels}
        initialLayout={initial}
        validate={validate}
        storageKey="read-only-transition"
        readOnly={readOnly}
        original={null}
        renderPanel={(panel) => <WallPanelHeader title={<h3>{panel.title}</h3>} />}
        rowPitch={2}
        maxWidth={Infinity}
        bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
      />
    </WallLayoutHistoryProvider>
  );
  const view = render(content(false));
  await screen.findByRole('button', { name: '28 이동 핸들' });
  fireEvent.mouseDown(screen.getByRole('button', { name: '28 이동 핸들' }), { button: 0, clientX: 20, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 310 });
  fireEvent.mouseUp(document, { clientX: 20, clientY: 310 });
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,300px)' });
  let paint: FrameRequestCallback = () => {};
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    paint = callback;
    return 1;
  });
  fireEvent.mouseDown(item('28').querySelector('.wall-kpi-resize')!, { button: 0, clientX: 240, clientY: 395 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 264, clientY: 408 });
  act(() => paint(16));
  expect(document.querySelector('[data-interacting="true"]')).toBeInTheDocument();
  view.rerender(content(true));
  expect(document.querySelector('[data-interacting="true"]')).not.toBeInTheDocument();
  expect(document.querySelector('[data-wall-magnet]')).not.toBeInTheDocument();
  expect(document.querySelector('.wall-layout-footprint')).not.toBeInTheDocument();
  expect(document.querySelector('.wall-kpi-resize')).not.toBeInTheDocument();
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,300px)', width: '253px', height: '108px' });
  fireEvent.mouseUp(document, { clientX: 264, clientY: 408 });
  view.rerender(content(false));
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,300px)', width: '253px', height: '108px' });
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(item('28')).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
