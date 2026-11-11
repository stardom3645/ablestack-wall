import { wallColorPalettes } from '../colorSystem';

/** Shared Gauge/Meter geometry and palettes; pairs are cosmetic, never threshold ranges. */
export const wallMeterTokens = {
  palettes: wallColorPalettes,
  lightTrack: '#e9edf3',
  darkTrack: '#343e4f',
  radius: 41,
  stroke: 5.5,
  labelHeight: 18,
  meterThickness: 8,
  meterGap: 8,
  lcdGap: 2,
  lcdRadius: 2,
  segmentCellWidth: 22,
  segmentMaxCells: 24,
  segmentThickness: 12,
  heatCellWidth: 18,
  heatCellHeight: 20,
  heatMaxColumns: 64,
  heatRowGap: 16,
  inset: 12,
  unitScale: 0.52,
  statusDot: 5,
  shapes: {
    ring: { sweep: 1, rotation: -90, viewHeight: 100 },
    arc: { sweep: 0.75, rotation: 135, viewHeight: 100 },
    semi: { sweep: 0.5, rotation: 180, viewHeight: 64 },
  },
} as const;
