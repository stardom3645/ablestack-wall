import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMemo } from 'react';

import { WallPanelHeader } from './PanelActionDock';
import { PanelLayoutGrid } from './PanelLayoutGrid';
import { KpiPosition } from './kpiLayout';
import { projectPanelLayout, validatePanelLayout } from './panelLayout';

it('projects unequal native row heights and gaps without losing panels or overlapping positions', () => {
  const geometry = [
    { id: '244', x: 0, w: 20, row: 0, height: 164 },
    { id: '192', x: 24, w: 24, row: 0, height: 280 },
    { id: '194', x: 0, w: 24, row: 296, height: 280 },
  ];
  const snapshot = JSON.stringify(geometry);
  const layout = projectPanelLayout(geometry, { 244: 104 }, 16);
  expect(layout).toEqual([
    { i: '244', x: 0, w: 20, y: 0, h: 60 },
    { i: '192', x: 24, w: 24, y: 0, h: 148 },
    { i: '194', x: 0, w: 24, y: 148, h: 148 },
  ]);
  expect(
    validatePanelLayout(
      layout,
      geometry.map((item) => item.id)
    )
  ).toEqual(layout);
  expect(JSON.stringify(geometry)).toBe(snapshot);
  expect(validatePanelLayout(layout, ['244', '192'])).toBeUndefined();
  expect(validatePanelLayout([{ ...layout[0], x: 24 }, ...layout.slice(1)], ['244', '192', '194'])).toBeUndefined();
});
it('supports compact zero-gap service rows and all 19 network panels instead of a hard-coded four IDs', () => {
  const services = projectPanelLayout(
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      id: String(i),
      x: (i % 4) * 12,
      w: 12,
      row: Math.floor(i / 4),
      height: 54,
    })),
    {},
    0
  );
  expect(services[4].y).toBe(27);
  const network = projectPanelLayout(
    Array.from({ length: 19 }, (_, i) => ({
      id: String(150 + i),
      x: (i % 2) * 24,
      w: 24,
      row: Math.floor(i / 2),
      height: 280,
    })),
    {},
    16
  );
  expect(
    validatePanelLayout(
      network,
      network.map((item) => item.i)
    )
  ).toHaveLength(19);
});

const panels = [192, 194].map((id) => ({
  id,
  title: `Chart ${id}`,
  type: 'timeseries',
  width: 12,
  height: 8,
  model: {},
}));
const initial: KpiPosition[] = [
  { i: '192', x: 0, y: 0, w: 24, h: 148 },
  { i: '194', x: 24, y: 0, w: 24, h: 148 },
];
const validate = (value: unknown) => validatePanelLayout(value, ['192', '194']);
function TestRegion({
  cache,
  storageKey = 'storage-region',
  height = 280,
}: {
  cache: Map<string, KpiPosition[]>;
  storageKey?: string;
  height?: number;
}) {
  const defaults = useMemo(() => initial.map((item) => ({ ...item, h: (height + 16) / 2 })), [height]);
  return (
    <PanelLayoutGrid
      panels={panels}
      initialLayout={defaults}
      validate={validate}
      storageKey={storageKey}
      original={<div>original</div>}
      renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
      rowPitch={2}
      gapX={16}
      gapY={16}
      minimumWidth={200}
      maxWidth={Infinity}
      draftCache={cache}
      bounds={() => ({ minW: 8, minH: 80, maxH: 2000 })}
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
    height: 280,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 280,
    toJSON: () => ({}),
  });
});
afterEach(() => jest.restoreAllMocks());
it('retains unsaved region geometry across tab unmount/remount and separates cancel from browser save', async () => {
  const cache = new Map<string, KpiPosition[]>();
  const view = render(<TestRegion cache={cache} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Chart 192 이동 핸들' })).toBeInTheDocument());
  fireEvent.mouseDown(screen.getByRole('button', { name: 'Chart 192 이동 핸들' }), {
    button: 0,
    clientX: 20,
    clientY: 10,
  });
  fireEvent.mouseMove(document, { clientX: 20, clientY: 310, buttons: 1 });
  fireEvent.mouseUp(document, { clientX: 20, clientY: 310 });
  // The requested 300px drop now attracts to the adjacent 296px row edge.
  expect(cache.get('storage-region')![0].y).toBe(148);
  expect(localStorage.getItem('storage-region')).toBeNull();
  view.unmount();
  const restored = render(<TestRegion cache={cache} />);
  await screen.findByRole('button', { name: '배치 저장' });
  expect(restored.container.querySelector('.wall-kpi-layout-item')).toHaveStyle({ transform: 'translate(0px,296px)' });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(cache.size).toBe(0);
  expect(localStorage.getItem('storage-region')).toBeNull();
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
it('adapts unmodified defaults to native content height without exposing false unsaved changes', async () => {
  const cache = new Map<string, KpiPosition[]>();
  const view = render(<TestRegion cache={cache} />);
  await waitFor(() => expect(view.container.querySelector('.wall-kpi-layout-item')).toBeInTheDocument());
  view.rerender(<TestRegion cache={cache} height={164} />);
  await waitFor(() => expect(view.container.querySelector('.wall-kpi-layout-item')).toHaveStyle({ height: '180px' }));
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});

it('finishes a touch move using changedTouches when the active touch has ended', async () => {
  const view = render(<TestRegion cache={new Map()} />);
  const handle = await screen.findByRole('button', { name: 'Chart 192 이동 핸들' });
  fireEvent.touchStart(handle, { touches: [{ identifier: 1, clientX: 20, clientY: 10 }] });
  fireEvent.touchMove(document, { touches: [{ identifier: 1, clientX: 20, clientY: 310 }] });
  fireEvent.touchEnd(document, { touches: [], changedTouches: [{ identifier: 1, clientX: 20, clientY: 310 }] });
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  expect(await screen.findByRole('button', { name: '배치 저장' })).toBeInTheDocument();
});

it('previews a vertical exchange, commits the same slots on release, cancels and restores a saved swap', async () => {
  const ordered: KpiPosition[] = [
    { i: '192', x: 0, y: 0, w: 24, h: 148 },
    { i: '194', x: 0, y: 148, w: 24, h: 148 },
  ];
  const mount = () =>
    render(
      <PanelLayoutGrid
        panels={panels}
        storageKey="vertical-swap"
        bounds={() => ({ minW: 8, minH: 80, maxH: 2000 })}
        initialLayout={ordered}
        validate={validate}
        original={null}
        renderPanel={(panel) => <WallPanelHeader title={panel.title} />}
        rowPitch={2}
        gapX={16}
        gapY={16}
        minimumWidth={200}
        maxWidth={Infinity}
      />
    );
  const view = mount();
  const handle = await screen.findByRole('button', { name: 'Chart 192 이동 핸들' });
  const exchange = () => {
    fireEvent.mouseDown(handle, { button: 0, clientX: 20, clientY: 10 });
    for (const clientY of [210, 290, 330]) {
      fireEvent.mouseMove(document, { clientX: 20, clientY, buttons: 1 });
    }
    expect(screen.getByRole('button', { name: 'Chart 194 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
      transform: 'translate(0px,0px)',
    });
    fireEvent.mouseUp(document, { clientX: 20, clientY: 330 });
  };
  exchange();
  expect(screen.getByRole('button', { name: 'Chart 192 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(0px,296px)',
  });
  expect(view.container.querySelector('[data-interacting="true"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.getByRole('button', { name: 'Chart 194 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(0px,296px)',
  });
  exchange();
  fireEvent.click(screen.getByRole('button', { name: '배치 저장' }));
  view.unmount();
  mount();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Chart 194 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
      transform: 'translate(0px,0px)',
    })
  );
  expect(screen.getByRole('button', { name: 'Chart 192 이동 핸들' }).closest('.wall-kpi-layout-item')).toHaveStyle({
    transform: 'translate(0px,296px)',
  });
  expect(screen.queryByRole('button', { name: '배치 저장' })).not.toBeInTheDocument();
});
