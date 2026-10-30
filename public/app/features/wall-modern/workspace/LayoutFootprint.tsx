import { forwardRef, useImperativeHandle, useState } from 'react';

import { KpiPosition } from './kpiLayout';
import { AlignmentGuide } from './layoutMovement';
import { panelPixelRect } from './panelGeometry';

export interface LayoutFootprintHandle {
  show: (position: KpiPosition, mode: 'held' | 'destination', guides?: AlignmentGuide[]) => void;
  hide: () => void;
}

/** Live geometry feedback must not rerender the grid or its query/visualization children. */
export const LayoutFootprint = forwardRef<
  LayoutFootprintHandle,
  { width: number; gapX: number; gapY: number; rowPitch: number }
>(function LayoutFootprint({ width, gapX, gapY, rowPitch }, ref) {
  const [feedback, setFeedback] = useState<{
    position: KpiPosition;
    mode: 'held' | 'destination';
    guides: AlignmentGuide[];
  }>();
  useImperativeHandle(
    ref,
    () => ({
      show(position, mode, guides = []) {
        setFeedback((current) => {
          const previous = current?.position;
          return current?.mode === mode &&
            previous?.i === position.i &&
            previous.x === position.x &&
            previous.y === position.y &&
            previous.w === position.w &&
            previous.h === position.h &&
            JSON.stringify(current.guides) === JSON.stringify(guides)
            ? current
            : { position: { ...position }, mode, guides };
        });
      },
      hide() {
        setFeedback(undefined);
      },
    }),
    []
  );
  if (!feedback) {
    return null;
  }
  const { position, mode } = feedback;
  const rect = panelPixelRect(position, { width, gapX, gapY, rowPitch });
  const label = mode === 'held' ? '현재 자리' : '놓을 자리';
  return (
    <div
      className="wall-layout-footprint"
      data-wall-footprint={mode}
      data-wall-footprint-group={position.i === '@wall-selection' || undefined}
      role="img"
      aria-label={`${label}: 패널 ${rect.width} × ${rect.height} px, ${position.x + 1}열 ${position.y + 1}행`}
      style={{
        width: rect.width,
        height: rect.height,
        transform: `translate(${rect.left}px, ${rect.top}px)`,
      }}
    >
      {feedback.guides.map((guide) => (
        <span
          key={`${guide.axis}:${guide.at}`}
          className="wall-layout-alignment-guide"
          data-axis={guide.axis}
          aria-hidden="true"
          style={
            guide.axis === 'x'
              ? {
                  left: guide.at - rect.left,
                  top: guide.start - rect.top,
                  height: guide.end - guide.start,
                }
              : {
                  top: guide.at - rect.top,
                  left: guide.start - rect.left,
                  width: guide.end - guide.start,
                }
          }
        />
      ))}
      <div className="wall-layout-footprint-label">
        <strong>{label}</strong>
        <span>
          {rect.width} × {rect.height} px
        </span>
        <span>
          {position.x + 1}열 · {position.y + 1}행 · 격자 {position.w} × {position.h}
        </span>
      </div>
    </div>
  );
});
