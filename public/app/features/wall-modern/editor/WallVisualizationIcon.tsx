import { type ReactNode, useState } from 'react';

import './visualizationIcon.css';

const axes = <path d="M3 3v18h18" opacity=".45" />;
const shapes: Record<string, ReactNode> = {
  // Preserve the bundled Grafana Stat12.4 + area silhouette; recolor via Wall tokens.
  stat: (
    <g transform="translate(1.5 1.75) scale(.259259)" fill="currentColor" stroke="none">
      <path d="M13.12.4v29h-7V8.71H5.85a5,5,0,0,1-2,1.45A8.94,8.94,0,0,1,0,10.87V5.34a6.39,6.39,0,0,0,3.13-.76,6.36,6.36,0,0,0,2.2-1.92A4.07,4.07,0,0,0,6.15.4Zm6.43,29v-5L30.13,15.1a22.8,22.8,0,0,0,2.76-2.87,4.67,4.67,0,0,0,1-2.91A3.6,3.6,0,0,0,32.72,6.5a4.23,4.23,0,0,0-2.93-1,4,4,0,0,0-2.91,1.08A4.08,4.08,0,0,0,25.77,9.6H19.12a9.6,9.6,0,0,1,1.33-5.11A8.79,8.79,0,0,1,24.2,1.17,12.74,12.74,0,0,1,29.82,0a13.77,13.77,0,0,1,5.74,1.11,8.81,8.81,0,0,1,3.77,3.07,8,8,0,0,1,1.34,4.59A8.48,8.48,0,0,1,40,12.05a13.83,13.83,0,0,1-2.4,3.6,52.32,52.32,0,0,1-4.86,4.72l-3.47,3.2v.19H41v5.65ZM49,29.82a3.59,3.59,0,0,1-2.62-1.08,3.67,3.67,0,0,1,0-5.18A3.62,3.62,0,0,1,49,22.5a3.58,3.58,0,0,1,2.56,1.06,3.55,3.55,0,0,1,0,5.18A3.56,3.56,0,0,1,49,29.82Zm7.86-5.23V19.12L68.7.4h8.83V19.07H81v5.52H77.53v4.82h-6.7V24.59ZM71,19.07V7.82h-.22l-7,11v.23Z" />
      <polygon points="53.24 61.55 27.32 43.53 0 54.29 0 79.04 81 79.04 81 47.84 53.24 61.55" opacity=".25" />
      <path
        d="M53.24,63.55a2,2,0,0,1-1.14-.35l-25-17.4L2.77,55.86a2,2,0,1,1-1.53-3.7L26.55,41.68a2,2,0,0,1,1.91.21L53.38,59.22,78.06,46.15a2,2,0,1,1,1.88,3.53L54.17,63.32A1.91,1.91,0,0,1,53.24,63.55Z"
        opacity=".8"
      />
    </g>
  ),
  timeseries: (
    <>
      {axes}
      <path d="m5 15 4-6 4 3 3-6 5 2" />
    </>
  ),
  gauge: (
    <>
      <path d="M5.636 18.364a9 9 0 1 1 12.728 0" opacity=".25" />
      <path d="M5.636 18.364a9 9 0 1 1 12.728 0" pathLength="100" strokeDasharray="65 100" />
    </>
  ),
  bargauge: (
    <>
      {[12, 7, 15].map((width, i) => (
        <g key={i}>
          <rect x="3" y={4 + i * 6} width="18" height="3" rx=".7" opacity=".2" />
          <rect x="3" y={4 + i * 6} width={width} height="3" rx=".7" fill="currentColor" fillOpacity=".15" />
        </g>
      ))}
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9h18M3 14h18M9 9v11M15 9v11" opacity=".5" />
    </>
  ),
  barchart: (
    <>
      {axes}
      {[
        [5, 13, 6],
        [11, 8, 11],
        [17, 4, 15],
      ].map(([x, y, height]) => (
        <rect key={x} x={x} y={y} width="3" height={height} rx=".4" fill="currentColor" fillOpacity=".15" />
      ))}
    </>
  ),
  piechart: (
    <>
      <path d="M10 3a9 9 0 1 0 11 11H10Z" />
      <path d="M14 3v7h7a9 9 0 0 0-7-7Z" fill="currentColor" opacity=".45" stroke="none" />
    </>
  ),
  heatmap: (
    <>
      {[0.2, 0.5, 0.8, 0.7, 0.3, 0.45, 0.4, 0.85, 0.2].map((opacity, i) => (
        <rect
          key={i}
          x={3 + (i % 3) * 7}
          y={3 + Math.floor(i / 3) * 7}
          width="5"
          height="5"
          rx=".5"
          fill="currentColor"
          stroke="none"
          opacity={opacity}
        />
      ))}
    </>
  ),
  histogram: (
    <>
      {axes}
      <path d="M5 21v-5h4v-7h4V5h4v8h4v8" fill="currentColor" fillOpacity=".15" />
    </>
  ),
  xychart: (
    <>
      {axes}
      {[
        [7, 16],
        [9, 10],
        [13, 14],
        [16, 6],
        [19, 9],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.4" fill="currentColor" stroke="none" />
      ))}
    </>
  ),
  text: (
    <>
      <path d="M4 5h16M4 10h12M4 15h16M4 20h9" />
    </>
  ),
  'state-timeline': (
    <>
      <path d="M3 7h5m3 0h10M3 16h11m3 0h4" />
      <path d="M3 3v18" opacity=".3" />
    </>
  ),
  'status-history': (
    <>
      {[3, 8, 13, 18].map((x, i) => (
        <g key={x} opacity={i % 2 ? 0.45 : 1}>
          <path d={`M${x} 5v5m0 4v5`} />
        </g>
      ))}
    </>
  ),
  candlestick: (
    <>
      <path d="M6 3v18m6-16v13m6-15v18" opacity=".4" />
      <path d="M6 7v7m6-4v6m6-9v5" />
    </>
  ),
  news: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M7 7h10M7 12h3m4 0h3M7 17h10" />
    </>
  ),
  trend: (
    <>
      {axes}
      <path d="m5 17 5-6 3 2 7-9" />
    </>
  ),
  logs: (
    <>
      <path d="M3 5h1m4 0h13M3 12h1m4 0h10M3 19h1m4 0h13" />
    </>
  ),
  traces: (
    <>
      <path d="M3 5h13M7 12h14M10 19h7" />
      <path d="M4 5v7h4v7" opacity=".35" />
    </>
  ),
  flamegraph: (
    <>
      <path d="M3 20h18M4 15h9m3 0h4M6 10h6m3 0h3M8 5h3" />
    </>
  ),
  nodeGraph: (
    <>
      <path d="m6 6 12 12M6 6l0 12 12 0" opacity=".4" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="3" />
    </>
  ),
  geomap: (
    <>
      <circle cx="12" cy="12" r="9" opacity=".4" />
      <path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18" opacity=".5" />
      <circle cx="15" cy="9" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  canvas: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" opacity=".4" />
      <rect x="6" y="6" width="5" height="4" />
      <circle cx="16" cy="16" r="2.5" />
      <path d="m9 13 3 3" />
    </>
  ),
  dashlist: (
    <>
      <rect x="3" y="4" width="6" height="6" rx="1" />
      <path d="M13 5h8m-8 4h5M3 15h18M3 20h14" />
    </>
  ),
  alertlist: (
    <>
      <path d="m12 3 10 18H2Z" />
      <path d="M12 9v5m0 3v.1" />
    </>
  ),
  annolist: (
    <>
      <path d="M7 4h14M7 12h14M7 20h10" />
      <circle cx="3" cy="4" r="1" />
      <circle cx="3" cy="12" r="1" />
      <circle cx="3" cy="20" r="1" />
    </>
  ),
};
// Legacy core types share the same visualization grammar; IDs remain native.
shapes.graph = shapes.timeseries;
shapes.datagrid = shapes.table;
shapes['table-old'] = shapes.table;
// Explicit core IDs only: third-party plugins retain their own logo, even with a matching display name.
export const wallVisualizationIconIds = Object.keys(shapes);
export function WallVisualizationIcon({
  pluginId,
  logo,
  selected = false,
}: {
  pluginId: string;
  logo?: string;
  selected?: boolean;
}) {
  const [failedLogo, setFailedLogo] = useState<string>();
  const shape = Object.prototype.hasOwnProperty.call(shapes, pluginId) ? shapes[pluginId] : undefined;
  return (
    <span
      className="wall-viz-icon"
      data-viz-icon={shape ? pluginId : 'plugin'}
      data-selected={selected || undefined}
      aria-hidden="true"
    >
      {!shape && logo && failedLogo !== logo ? (
        <img src={logo} alt="" onError={() => setFailedLogo(logo)} />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          focusable="false"
        >
          {shape ?? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" opacity=".4" />
              <path d="m6 16 4-5 4 3 4-6" />
            </>
          )}
        </svg>
      )}
    </span>
  );
}
