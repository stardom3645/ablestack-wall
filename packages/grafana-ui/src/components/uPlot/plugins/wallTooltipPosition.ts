export interface WallTooltipPlacement {
  xSide?: 'before' | 'after';
  ySide?: 'above' | 'below';
  edge?: 'top' | 'bottom';
}

/** Cursor-anchored viewport placement; a short plot must not force the popup over its own cursor. */
export function wallTooltipPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  plot: { left: number; right: number; top: number; bottom: number },
  viewport: { width: number; height: number },
  gap: number,
  margin: number,
  placement: WallTooltipPlacement = {}
) {
  const bound = (value: number, low: number, high: number) => Math.max(low, Math.min(Math.max(low, high), value));
  const left = margin,
    right = viewport.width - margin;
  const top = margin,
    bottom = viewport.height - margin;
  const fitsRight = x + gap + width <= right,
    fitsLeft = x - gap - width >= left;
  const fitsBelow = y + gap + height <= bottom,
    fitsAbove = y - gap - height >= top;
  // Keep the current side while it fits, rather than flipping again at every threshold crossing.
  const overlap = (start: number) => Math.max(0, Math.min(start + width, plot.right) - Math.max(start, plot.left));
  const preferLeft = fitsLeft && (!fitsRight || overlap(x - gap - width) < overlap(x + gap));
  placement.xSide =
    placement.xSide === 'before' && fitsLeft
      ? 'before'
      : placement.xSide === 'after' && fitsRight
        ? 'after'
        : preferLeft
          ? 'before'
          : 'after';
  const verticalOverlap = (start: number) =>
    Math.max(0, Math.min(start + height, plot.bottom) - Math.max(start, plot.top));
  const preferAbove = fitsAbove && (!fitsBelow || verticalOverlap(y - gap - height) < verticalOverlap(y + gap));
  const aboveOverlap = verticalOverlap(y - gap - height),
    belowOverlap = verticalOverlap(y + gap);
  placement.ySide =
    placement.ySide === 'above' && fitsAbove && (!fitsBelow || aboveOverlap <= belowOverlap + gap)
      ? 'above'
      : placement.ySide === 'below' && fitsBelow && (!fitsAbove || belowOverlap <= aboveOverlap + gap)
        ? 'below'
        : preferAbove
          ? 'above'
          : 'below';
  const preferredX = placement.xSide === 'after' ? x + gap : x - gap - width;
  let preferredY = placement.ySide === 'below' ? y + gap : y - gap - height;
  // Nearby plot edges can remove occlusion without detaching the popup from its sample.
  // Keep the existing pointer bridge/lock; only the initial floating position changes.
  const edges = [
    { side: 'top' as const, at: plot.top - gap - height },
    { side: 'bottom' as const, at: plot.bottom + gap },
  ].filter(
    (edge) =>
      overlap(preferredX) > 0 &&
      verticalOverlap(preferredY) > 0 &&
      edge.at >= top &&
      edge.at + height <= bottom &&
      Math.abs(edge.at - preferredY) <= height / 2 + (placement.edge === edge.side ? gap : 0)
  );
  const edge =
    edges.find((edge) => edge.side === placement.edge) ??
    edges.sort((a, b) => Math.abs(a.at - preferredY) - Math.abs(b.at - preferredY))[0];
  placement.edge = edge?.side;
  if (edge) {
    preferredY = edge.at;
  }
  return {
    x:
      width <= right - left
        ? bound(preferredX, left, right - width)
        : bound(preferredX, margin, viewport.width - margin - width),
    y: bound(preferredY, top, bottom - height),
  };
}
