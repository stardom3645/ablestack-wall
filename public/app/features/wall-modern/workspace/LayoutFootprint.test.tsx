import { act, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { LayoutFootprint, LayoutFootprintHandle } from './LayoutFootprint';

it('keeps the logical target immediate while one stable, clipped preview box can trail it', () => {
  const ref = createRef<LayoutFootprintHandle>();
  const { container } = render(<LayoutFootprint ref={ref} width={948} gapX={12} gapY={12} rowPitch={2} />);
  const source = { i: 'a', x: 0, y: 0, w: 12, h: 48 };
  act(() => ref.current!.show(source, 'destination'));
  const border = screen.getByRole('img');
  const preview = container.querySelector('[data-wall-footprint-preview]');
  const ink = container.querySelector('.wall-layout-footprint-ink');
  expect(preview).toHaveAttribute('aria-hidden', 'true');
  expect(preview).toContainElement(ink as HTMLElement);
  expect(ink).not.toHaveAttribute('style');
  // Update size and position together, as with a left-corner resize. The exact
  // drop prediction is never put behind an animation timer or a delayed state.
  act(() => ref.current!.show({ ...source, x: 2, y: 6, w: 10, h: 60 }, 'destination'));
  expect(screen.getByRole('img')).toBe(border);
  expect(border).toHaveStyle({ transform: 'translate(40px, 12px)', width: '188px', height: '108px' });
  expect(container.querySelector('[data-wall-footprint-preview]')).toBe(preview);
  expect(preview).toHaveStyle({ transform: 'translate(40px, 12px)', width: '188px', height: '108px' });
  act(() => ref.current!.hide());
  expect(container).toBeEmptyDOMElement();
  // A new gesture starts without a stale trail from the previous gesture.
  act(() => ref.current!.show(source, 'destination'));
  expect(screen.getByRole('img')).toHaveStyle({ transform: 'translate(0px, 0px)' });
  expect(container.querySelector('[data-wall-footprint-preview]')).not.toBe(preview);
});
