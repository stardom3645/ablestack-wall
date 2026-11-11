import { useId, useLayoutEffect, useRef, useState } from 'react';

import { kpiGrid } from './kpiLayout';
import { panelGridPoint, panelRowStops } from './panelGeometry';

/** Shared gutter centers inside the grid, actual placement boundaries at its edges.
 * Independent of the selected panel/Resize direction; footprint owns the drop box. */
export function LayoutGridGuide({
  width,
  rowPitch,
  rowStep,
  rowAnchors,
  gapX,
  gapY,
}: {
  width: number;
  rowPitch: number;
  rowStep: number;
  rowAnchors: readonly number[];
  gapX: number;
  gapY: number;
}) {
  const id = `wall-grid-${useId().replace(/:/g, '')}`;
  const svg = useRef<SVGSVGElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const parent = svg.current?.parentElement;
    if (!parent) {
      return;
    }
    const measure = () => setHeight(Math.max(parent.clientHeight, parent.ownerDocument.defaultView?.innerHeight ?? 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);
  const geometry = { width, rowPitch, gapX, gapY };
  const rows = [0, ...panelRowStops(0, (height + gapY) / rowPitch, rowStep, rowAnchors).filter((row) => row > 0)];
  return (
    <svg ref={svg} className="wall-layout-grid-guide" aria-hidden="true" focusable="false" data-wall-grid-guide>
      <defs>
        <g id={id}>
          {Array.from({ length: kpiGrid.columns + 1 }, (_, column) => (
            <circle
              key={column}
              data-grid-column={column}
              className="wall-layout-grid-dot"
              cx={
                column === 0 ? 0 : column === kpiGrid.columns ? width : panelGridPoint(column, 0, geometry).x - gapX / 2
              }
              cy={0}
            />
          ))}
        </g>
      </defs>
      {rows.map((row) => (
        <use
          key={row}
          href={`#${id}`}
          y={row === 0 ? 0 : panelGridPoint(0, row, geometry).y - gapY / 2}
          data-grid-row={row}
        />
      ))}
    </svg>
  );
}
