import { wallSurfaceTokens } from './surfaceTokens';

/** Shared filter/event interaction geometry. Popup transitions remain owned by motion.css/Base UI. */
export const wallEventTokens = {
  variableWidth: 360,
  variableNameWidth: 128,
  markerHitWidth: 14,
  clusterWidth: 28,
  markerHeight: 10,
  pointSize: 6,
  regionHeight: 4,
  clusterGap: 12,
  lineWidth: 1,
  pointDash: [3, 3],
  regionOpacity: 0.06,
  hoverOpenDelay: 150,
  hoverCloseDelay: 150,
  listHeight: 220,
  popupWidth: 380,
  gap: wallSurfaceTokens.contentGap,
} as const;
