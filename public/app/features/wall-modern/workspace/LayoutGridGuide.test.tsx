import { render } from '@testing-library/react';

import { LayoutGridGuide } from './LayoutGridGuide';
import { panelPixelRect } from './panelGeometry';

it.each([
  [1000, 8],
  [1000, 12],
  [1435, 12],
])('places one shared dot line midway between adjacent cards at width %d / gap %d', (width, gap) => {
  const geometry = { width, gapX: gap, gapY: gap, rowPitch: 2 };
  const first = { i: 'first', x: 0, y: 0, w: 24, h: 54 };
  const beside = { ...first, i: 'beside', x: 24 };
  const below = { ...first, i: 'below', y: 54 };
  const { container } = render(<LayoutGridGuide {...geometry} rowStep={6} rowAnchors={[0, 54]} />);
  const left = panelPixelRect(first, geometry);
  const right = panelPixelRect(beside, geometry);
  const bottom = panelPixelRect(below, geometry);
  const column = container.querySelector('[data-grid-column="24"]')!;
  const row = container.querySelector('[data-grid-row="54"]')!;

  expect(Number(column.getAttribute('cx'))).toBe((left.left + left.width + right.left) / 2);
  expect(Number(row.getAttribute('y'))).toBe((left.top + left.height + bottom.top) / 2);
  expect(container.querySelectorAll('[data-grid-column]')).toHaveLength(49);
  expect(Number(container.querySelector('[data-grid-column="0"]')!.getAttribute('cx'))).toBe(0);
  expect(Number(container.querySelector('[data-grid-column="48"]')!.getAttribute('cx'))).toBe(width);
  expect(Number(container.querySelector('[data-grid-row="0"]')!.getAttribute('y'))).toBe(0);
  expect(container.querySelector('[data-grid-fixed-corner]')).toBeNull();
});

it('retains the reachable top boundary even when a nearby legacy row suppresses its regular stop', () => {
  const { container } = render(
    <LayoutGridGuide width={1000} gapX={8} gapY={8} rowPitch={2} rowStep={6} rowAnchors={[1, 55]} />
  );
  expect(container.querySelectorAll('[data-grid-row="0"]')).toHaveLength(1);
  expect(Number(container.querySelector('[data-grid-row="0"]')!.getAttribute('y'))).toBe(0);
  expect(Number(container.querySelector('[data-grid-column="1"]')!.getAttribute('cx'))).toBe(Math.round(1008 / 48) - 4);
});
