import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { projectOverviewFlow } from './OverviewFlowLayout';
import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { KpiPosition } from './kpiLayout';
import { validatePanelLayout } from './panelLayout';

const key = 'overview-flow-test';
const panels = [
  { id: -1001, title: '성능 추이', type: 'wall-text', width: 32, height: 30, model: {} },
  { id: -1004, title: '자원 사용률', type: 'wall-usage-group', width: 16, height: 144, model: {} },
  { id: 140, title: 'CPU 그래프', type: 'timeseries', width: 16, height: 146, model: {} },
];
const initial: KpiPosition[] = [
  { i: '-1001', x: 0, y: 0, w: 32, h: 30 },
  { i: '-1004', x: 32, y: 0, w: 16, h: 144 },
  { i: '140', x: 0, y: 30, w: 16, h: 146 },
];
const validate = (value: unknown) =>
  validatePanelLayout(
    value,
    panels.map((panel) => String(panel.id))
  );
function setup(nested = false) {
  return render(
    <PanelLayoutGrid
      panels={panels}
      storageKey={key}
      initialLayout={initial}
      validate={validate}
      rowPitch={2}
      gapX={12}
      gapY={12}
      maxWidth={Infinity}
      minimumWidth={760}
      bounds={() => ({ minW: 8, minH: 30, maxH: 2000 })}
      original={null}
      renderPanel={(panel) =>
        nested && panel.id === -1004 ? (
          <div>
            <WallPanelHeader title={panel.title} />
            <div className="wall-kpi-no-drag">
              <PanelLayoutGrid
                panels={[{ ...panels[0], id: 32, title: '내부 사용률' }]}
                storageKey="inner-usage"
                initialLayout={[{ i: '32', x: 0, y: 0, w: 48, h: 36 }]}
                validate={(value) => validatePanelLayout(value, ['32'])}
                original={null}
                renderPanel={() => <WallPanelHeader title="내부 사용률" value="24%" />}
                minimumWidth={200}
                maxWidth={Infinity}
                rowPitch={2}
                bounds={() => ({ minW: 8, minH: 30, maxH: 2000 })}
              />
            </div>
          </div>
        ) : (
          <WallPanelHeader title={panel.title} />
        )
      }
    />
  );
}
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function (this: HTMLElement) {
    return this.parentElement;
  });
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 48,
    left: 0,
    top: 0,
    right: 1000,
    bottom: 48,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});
afterEach(() => jest.restoreAllMocks());

it('preserves unequal column rows when projecting a legacy browser arrangement into the shared Grid', () => {
  const projected = projectOverviewFlow(
    [
      { id: '-1001', x: 0, y: 0, width: 663, height: 48 },
      { id: '-1004', x: 675, y: 0, width: 325, height: 276 },
      { id: '140', x: 0, y: 60, width: 325, height: 280 },
    ],
    1000
  );
  expect(projected).toEqual([
    { i: '-1001', x: 0, y: 0, w: 32, h: 30 },
    { i: '-1004', x: 32, y: 0, w: 16, h: 144 },
    { i: '140', x: 0, y: 30, w: 16, h: 146 },
  ]);
  expect(validate(projected)).toEqual(projected);
});

it('uses native resize collision handling to push the neighbour down, cancel, save and restore', async () => {
  const view = setup();
  const move = await screen.findByRole('button', { name: '성능 추이 이동 핸들' });
  const handle = move.closest('.wall-kpi-layout-item')!.querySelector('.react-resizable-handle-se')!;
  const resize = () => {
    fireEvent.mouseDown(handle, { button: 0, clientX: 663, clientY: 48 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 983, clientY: 48 });
    fireEvent.mouseUp(document, { clientX: 983, clientY: 48 });
  };
  resize();
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  expect(screen.getByRole('button', { name: '자원 사용률 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(675px,60px)',
  });
  expect(screen.getByRole('button', { name: 'CPU 그래프 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(0px,60px)',
  });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.getByRole('button', { name: '자원 사용률 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(675px,0px)',
  });
  resize();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  const stored = JSON.parse(localStorage.getItem(key)!);
  expect(stored.items.find((item: KpiPosition) => item.i === '-1004').y).toBe(30);
  view.unmount();
  setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '자원 사용률 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
      transform: 'translate(675px,60px)',
    })
  );
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});

it('keeps nested usage gestures owned by the child Grid', async () => {
  setup(true);
  const inner = await screen.findByRole('button', { name: '내부 사용률 이동 핸들' });
  fireEvent.mouseDown(inner, { button: 0, clientX: 30, clientY: 10 });
  fireEvent.mouseMove(document, { buttons: 1, clientX: 30, clientY: 30 });
  fireEvent.mouseUp(document, { clientX: 30, clientY: 30 });
  expect(screen.getByRole('button', { name: '자원 사용률 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(675px,0px)',
  });
  expect(screen.getAllByRole('button', { name: '배치 저장' })).toHaveLength(1);
  expect(screen.getByRole('button', { name: '배치 저장' }).closest('.wall-kpi-pilot')).toBe(
    inner.closest('.wall-kpi-pilot')
  );
});
