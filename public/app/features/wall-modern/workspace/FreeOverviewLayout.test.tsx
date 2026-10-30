import { fireEvent, render, screen } from '@testing-library/react';

import { projectFreeOverview } from './FreeOverviewLayout';
import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { KpiPosition } from './kpiLayout';
import { validatePanelLayout } from './panelLayout';

it('projects KPI, independent usage rows, text and service panels into one valid coordinate space', () => {
  const result = projectFreeOverview(
    [
      { id: '28', x: 0, y: 0, width: 240, height: 96 },
      { id: '32', x: 675, y: 180, width: 325, height: 64 },
      { id: '38', x: 675, y: 244, width: 325, height: 64 },
      { id: '40', x: 675, y: 308, width: 325, height: 64 },
      { id: '-1003', x: 0, y: 400, width: 1000, height: 48 },
      { id: '242', x: 0, y: 460, width: 240, height: 54 },
    ],
    1000
  );
  expect(validatePanelLayout(result, ['28', '32', '38', '40', '-1003', '242'])).toBeDefined();
  expect(result.map((item) => item.i).sort()).toEqual(['28', '32', '38', '40', '-1003', '242'].sort());
  expect(result.find((item) => item.i === '32')?.y).toBe(90);
  expect(result.find((item) => item.i === '38')!.y).toBeGreaterThanOrEqual(128);
  expect(result.some((item) => item.i === '-1004')).toBe(false);
});

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
    <PanelLayoutGrid
      panels={panels}
      initialLayout={initial}
      validate={validate}
      storageKey={readOnly ? undefined : 'free-overview-test'}
      readOnly={readOnly}
      original={<div>fallback</div>}
      renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
      rowPitch={2}
      maxWidth={Infinity}
      minimumWidth={760}
      bounds={() => ({ minW: 4, minH: 12, maxH: 2000 })}
    />
  );
}
it('exchanges KPI and usage across former section boundaries, cancels, saves and restores', async () => {
  const view = setup();
  const move = await screen.findByRole('button', { name: '28 이동 핸들' });
  const drag = () => {
    fireEvent.mouseDown(move, { button: 0, clientX: 20, clientY: 10 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 310 });
    fireEvent.mouseUp(document, { clientX: 20, clientY: 310 });
  };
  drag();
  expect(view.container.querySelector('[data-wall-layout-item="28"]')).toHaveStyle({
    transform: 'translate(0px,300px)',
  });
  expect(view.container.querySelector('[data-wall-layout-item="32"]')).toHaveStyle({ transform: 'translate(0px,0px)' });
  expect(screen.getAllByRole('button', { name: '배치 저장' })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  drag();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  view.unmount();
  const restored = setup();
  await screen.findByRole('button', { name: '28 이동 핸들' });
  expect(restored.container.querySelector('[data-wall-layout-item="28"]')).toHaveStyle({
    transform: 'translate(0px,300px)',
  });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
it('renders the same independent layout to viewers without move or resize controls', async () => {
  const { container } = setup(true);
  expect(await screen.findByText('28')).toBeInTheDocument();
  expect(container.querySelectorAll('.react-grid-layout')).toHaveLength(1);
  expect(container.querySelectorAll('.wall-kpi-move,.react-resizable-handle')).toHaveLength(0);
  expect(screen.queryByText('fallback')).not.toBeInTheDocument();
});
