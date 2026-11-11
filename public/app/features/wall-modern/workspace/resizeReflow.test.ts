import { panelResizePreview, resizeReflowOrigin, ResizeReflow } from './layoutMovement';

const origin = [
  { i: 'a', x: 0, y: 0, w: 12, h: 40 },
  { i: 'b', x: 12, y: 0, w: 12, h: 40 },
  { i: 'c', x: 24, y: 0, w: 12, h: 40 },
  { i: 'intentional-gap', x: 36, y: 200, w: 12, h: 40 },
];

it('restores displaced neighbours across separate expand/release/shrink gestures, preserving intentional gaps', () => {
  const expanded = panelResizePreview(origin, { ...origin[0], w: 30 }, false);
  expect(expanded.find((x) => x.i === 'b')!.y).toBeGreaterThan(0);
  expect(expanded.find((x) => x.i === 'c')!.y).toBeGreaterThan(0);
  let chain: ResizeReflow = { id: 'a', origin, result: expanded };
  const partial = panelResizePreview(resizeReflowOrigin(expanded, 'a', chain), { ...origin[0], w: 24 }, false);
  expect(partial.find((x) => x.i === 'c')).toEqual(origin[2]);
  expect(partial.find((x) => x.i === 'b')!.y).toBeGreaterThan(0);
  chain = { ...chain, result: partial };
  const restored = panelResizePreview(resizeReflowOrigin(partial, 'a', chain), origin[0], false);
  for (const item of origin) {
    expect(restored.find((x) => x.i === item.i)).toEqual(item);
  }
  expect(chain.origin).toEqual(origin);
});

it('discards remembered slots after an intervening move, undo or different panel resize', () => {
  const expanded = panelResizePreview(origin, { ...origin[0], w: 30 }, false);
  const chain = { id: 'a', origin, result: expanded };
  const moved = expanded.map((x) => (x.i === 'b' ? { ...x, y: 300 } : x));
  expect(resizeReflowOrigin(moved, 'a', chain)).toEqual(moved);
  expect(resizeReflowOrigin(origin, 'a', chain)).toEqual(origin);
  expect(resizeReflowOrigin(expanded, 'b', chain)).toEqual(expanded);
});

it('restores neighbours when shrinking from the west while retaining the opposite edge', () => {
  const initial = [origin[0], { ...origin[1], x: 24, w: 24 }];
  const wide = panelResizePreview(initial, { ...initial[1], x: 0, w: 48 }, true);
  const chain = { id: 'b', origin: initial, result: wide };
  const restored = panelResizePreview(resizeReflowOrigin(wide, 'b', chain), initial[1], true);
  for (const item of initial) {
    expect(restored.find((x) => x.i === item.i)).toEqual(item);
  }
});

it('uses the live opposite corner when switching resize sides, while retaining neighbours preferred slots', () => {
  const initial = [
    { i: 'a', x: 0, y: 0, w: 3, h: 40 },
    { i: 'b', x: 3, y: 0, w: 45, h: 40 },
  ];
  const snapshot = JSON.stringify(initial);
  const west = panelResizePreview(initial, { ...initial[1], x: 0, w: 48 }, true);
  const westChain: ResizeReflow = { id: 'b', origin: initial, result: west };
  const eastOrigin = resizeReflowOrigin(west, 'b', westChain);
  expect(eastOrigin.find((e) => e.i === 'b')).toMatchObject({ x: 0, w: 48 });
  const east = panelResizePreview(eastOrigin, { ...initial[1], x: 0, w: 45 }, false);
  expect(east.find((e) => e.i === 'b')).toMatchObject({ x: 0, w: 45 });
  const eastChain: ResizeReflow = { id: 'b', origin: eastOrigin, result: east };
  const backOrigin = resizeReflowOrigin(east, 'b', eastChain);
  const westAgain = panelResizePreview(backOrigin, { ...initial[1], x: 3, w: 42 }, true);
  expect(westAgain.find((e) => e.i === 'b')).toMatchObject({ x: 3, w: 42 });
  expect(westAgain.find((e) => e.i === 'a')).toEqual(initial[0]);
  expect(JSON.stringify(initial)).toBe(snapshot);
});
