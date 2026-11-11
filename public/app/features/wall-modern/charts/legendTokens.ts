import { wallTypography } from '../typography';

/** Shared legend geometry; no changes to the surrounding plot's size policy. */
export const wallLegendTokens = {
  actionSize: 22,
  gap: 8,
  rowGap: 2,
  compactAt: 360,
  minimumName: 128,
  minimumStat: 80,
  minimumWideStat: 64,
  rightMaxWidth: 280,
  rightWidthRatio: 0.34,
  lowAt: 72,
  lowMinimumWidth: 480,
  lowToolbarWidth: 72,
  characterWidth: wallTypography.roles.legend.size * 0.64,
  line: wallTypography.roles.legend.line,
};
