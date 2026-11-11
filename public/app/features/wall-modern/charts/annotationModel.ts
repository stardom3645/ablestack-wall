import { wallEventTokens } from '../eventTokens';

/** A temporary projection, retaining exact native event fields and row identity. */
export interface WallAnnotation {
  key: string;
  values: Record<string, unknown[]>;
  index: number;
  left: number;
  right: number;
  color: string;
  region: boolean;
  wip: boolean;
}

export function annotationLabel(event: WallAnnotation) {
  return (
    String(event.values.title?.[event.index] || event.values.text?.[event.index] || '주석')
      .replace(/<[^>]*>/g, ' ')
      .trim() || '주석'
  );
}

/** Group overlapping marker hit areas, not data/time intervals. No events are removed or merged. */
export function groupAnnotationMarkers(events: WallAnnotation[]) {
  const groups: WallAnnotation[][] = [];
  let edge = -Infinity;
  for (const event of [...events].sort((a, b) => a.left - b.left)) {
    const previous = groups[groups.length - 1];
    if (
      !event.wip &&
      previous &&
      !previous.some((item) => item.wip) &&
      event.left < edge + wallEventTokens.clusterGap
    ) {
      previous.push(event);
      edge = Math.max(edge, event.right, event.left + wallEventTokens.markerHitWidth);
    } else {
      groups.push([event]);
      edge = Math.max(event.right, event.left + wallEventTokens.markerHitWidth);
    }
  }
  return groups;
}
