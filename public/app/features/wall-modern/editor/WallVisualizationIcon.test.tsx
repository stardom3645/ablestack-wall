import { fireEvent, render } from '@testing-library/react';

import { WallVisualizationIcon, wallVisualizationIconIds } from './WallVisualizationIcon';

it('provides independent miniature glyphs for the installed core chart types without numeric text or plugin images', () => {
  const required = [
    'stat',
    'timeseries',
    'gauge',
    'bargauge',
    'table',
    'barchart',
    'piechart',
    'heatmap',
    'histogram',
    'xychart',
    'text',
  ];
  expect(wallVisualizationIconIds).toEqual(expect.arrayContaining(required));
  const { container } = render(
    <>
      {required.map((pluginId) => (
        <WallVisualizationIcon key={pluginId} pluginId={pluginId} logo="legacy.svg" />
      ))}
    </>
  );
  expect(container.querySelectorAll('svg')).toHaveLength(required.length);
  expect(container.querySelectorAll('img, text')).toHaveLength(0);
  const glyphs = [...container.querySelectorAll('svg')];
  expect(new Set(glyphs.map((e) => e.innerHTML)).size).toBe(required.length);
  expect(glyphs.every((e) => e.getAttribute('viewBox') === '0 0 24 24')).toBe(true);
  expect(glyphs.every((e) => e.getAttribute('stroke-width') === '1.6' && !e.querySelector('[stroke-width]'))).toBe(
    true
  );
});

it('retains external logos and safely falls back for a missing or broken plugin logo', () => {
  const { container, rerender } = render(<WallVisualizationIcon pluginId="third-party-stat" logo="external.svg" />);
  expect(container.querySelector('img')).toHaveAttribute('src', 'external.svg');
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('svg')).not.toBeNull();
  rerender(<WallVisualizationIcon pluginId="constructor" />);
  expect(container.querySelector('svg')).not.toBeNull();
});

it('uses the same geometry at selected and neutral sizes with decorative accessibility semantics', () => {
  const { container, rerender } = render(<WallVisualizationIcon pluginId="stat" />);
  const geometry = container.querySelector('svg')!.innerHTML;
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  expect(container.firstChild).not.toHaveAttribute('data-selected');
  rerender(<WallVisualizationIcon pluginId="stat" selected />);
  expect(container.firstChild).toHaveAttribute('data-selected');
  expect(container.querySelector('svg')!.innerHTML).toBe(geometry);
});

it('uses one arc geometry for both the gauge track and progress', () => {
  const { container } = render(<WallVisualizationIcon pluginId="gauge" />);
  const arcs = container.querySelectorAll('path');
  expect(arcs).toHaveLength(2);
  expect(arcs[0].getAttribute('d')).toBe(arcs[1].getAttribute('d'));
  expect(arcs[1]).toHaveAttribute('pathLength', '100');
  expect(arcs[1]).toHaveAttribute('stroke-dasharray', '65 100');
});
