import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';

import { WallLayoutHistoryControls } from '../toolbar/WallLayoutHistoryControls';

import { WallLayoutHistoryProvider } from './LayoutHistoryContext';
import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { KpiPosition } from './kpiLayout';
import { validatePanelLayout } from './panelLayout';

const initial: KpiPosition[] = [
  { i: '28', x: 0, y: 0, w: 12, h: 54 },
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
const validate = (value: unknown) => validatePanelLayout(value, ['28', '32']);
function Host({ remeasure = false }: { remeasure?: boolean }) {
  const [tab, setTab] = useState('overview');
  const [visits, setVisits] = useState(0);
  const cache = useRef(new Map<string, KpiPosition[]>());
  return (
    <>
      <WallLayoutHistoryControls />
      <input aria-label="텍스트 입력" />
      <button
        onClick={() => {
          setTab(tab === 'overview' ? 'network' : 'overview');
          setVisits((value) => value + 1);
        }}
      >
        탭 전환
      </button>
      <PanelLayoutGrid
        key={tab}
        panels={panels}
        initialLayout={remeasure && visits >= 2 ? initial.map((item) => ({ ...item, y: item.y + 2 })) : initial}
        validate={validate}
        storageKey={`history-${tab}`}
        draftCache={cache.current}
        original={null}
        renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
        rowPitch={2}
        maxWidth={Infinity}
        minimumWidth={760}
        bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
      />
    </>
  );
}
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
function setup(remeasure = false) {
  return render(
    <WallLayoutHistoryProvider>
      <Host remeasure={remeasure} />
    </WallLayoutHistoryProvider>
  );
}
async function move() {
  const handle = await screen.findByRole('button', { name: '28 이동 핸들' });
  fireEvent.mouseDown(handle, { button: 0, clientX: 20, clientY: 10 });
  for (const y of [160, 260, 310]) {
    fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: y });
  }
  fireEvent.mouseUp(document, { clientX: 20, clientY: 310 });
}
const item = () => document.querySelector('[data-wall-layout-item="28"]');

it('undoes the entire collision transaction once, redoes it, and keeps redo at the clean baseline', async () => {
  setup();
  expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument();
  await move();
  expect(item()).toHaveStyle({ transform: 'translate(0px,300px)' });
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(item()).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '실행 취소' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '다시 실행' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: '다시 실행' }));
  expect(item()).toHaveStyle({ transform: 'translate(0px,300px)' });
  expect(screen.getByRole('button', { name: '배치 저장' })).toBeInTheDocument();
});
it('replays resize separately from move, preserves input undo and supports Mac/Windows shortcuts', async () => {
  setup();
  await move();
  fireEvent.keyDown(screen.getByRole('textbox', { name: '텍스트 입력' }), { key: 'z', metaKey: true });
  expect(item()).toHaveStyle({ transform: 'translate(0px,300px)' });
  fireEvent.keyDown(document, { key: 'z', metaKey: true });
  expect(item()).toHaveStyle({ transform: 'translate(0px,0px)' });
  fireEvent.keyDown(document, { key: 'z', metaKey: true, shiftKey: true });
  expect(item()).toHaveStyle({ transform: 'translate(0px,300px)' });
  const resize = item()!.querySelector('.react-resizable-handle-se')!;
  fireEvent.mouseDown(resize, { button: 0, clientX: 240, clientY: 96 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 240, clientY: 132 });
  expect(screen.getByRole('button', { name: '실행 취소' })).toBeDisabled();
  fireEvent.mouseUp(document, { clientX: 240, clientY: 132 });
  const height = (item() as HTMLElement).style.height;
  expect(height).not.toBe('108px');
  fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
  expect(item()).toHaveStyle({ height: '108px', transform: 'translate(0px,300px)' });
  fireEvent.keyDown(document, { key: 'y', ctrlKey: true });
  expect(item()).toHaveStyle({ height });
});
it('keeps tab history, draft and saved baseline even when bootstrap geometry is remeasured', async () => {
  setup(true);
  await move();
  fireEvent.click(screen.getByRole('button', { name: '탭 전환' }));
  expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '탭 전환' }));
  await screen.findByRole('button', { name: '실행 취소' });
  expect(item()).toHaveStyle({ transform: 'translate(0px,300px)' });
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(item()).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
it('clears committed or cancelled histories and retains history on a storage failure', async () => {
  setup();
  await move();
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument();
  await move();
  const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(screen.getByRole('button', { name: '실행 취소' })).toBeEnabled();
  write.mockRestore();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  expect(screen.queryByRole('button', { name: '실행 취소' })).not.toBeInTheDocument();
});

it('keeps a last-in-array text tile anchored through full-width native Resize, release and undo/redo', async () => {
  const layout = [
    { i: '32', x: 32, y: 0, w: 16, h: 50 },
    { i: '-1001', x: 0, y: 0, w: 32, h: 30 },
  ];
  const validateResize = (value: unknown) => validatePanelLayout(value, ['32', '-1001']);
  const view = render(
    <WallLayoutHistoryProvider>
      <WallLayoutHistoryControls />
      <PanelLayoutGrid
        panels={layout.map((item) => ({ ...panels[0], id: Number(item.i), title: item.i }))}
        initialLayout={layout}
        validate={validateResize}
        storageKey="resize-priority"
        original={null}
        renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
        rowPitch={2}
        maxWidth={Infinity}
        bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
      />
    </WallLayoutHistoryProvider>
  );
  await screen.findByRole('button', { name: '-1001 이동 핸들' });
  const text = view.container.querySelector('[data-wall-layout-item="-1001"]')!;
  const usage = view.container.querySelector('[data-wall-layout-item="32"]')!;
  const handle = text.querySelector('.react-resizable-handle-se')!;
  fireEvent.mouseDown(handle, { button: 0, clientX: 600, clientY: 60 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 1100, clientY: 108 });
  expect(text).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(usage).not.toHaveStyle({ transform: 'translate(675px,0px)' });
  const preview = (text as HTMLElement).style.cssText;
  fireEvent.mouseUp(document, { clientX: 1100, clientY: 108 });
  expect((text as HTMLElement).style.cssText).toBe(preview);
  expect(text).toHaveStyle({ width: '1012px' });
  expect(view.container.querySelector('[data-interacting="true"]')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(text).toHaveStyle({ width: '675px', height: '60px', transform: 'translate(0px,0px)' });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다시 실행' }));
  expect((text as HTMLElement).style.cssText).toBe(preview);
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(text).toHaveStyle({ width: '675px', height: '60px', transform: 'translate(0px,0px)' });
});
