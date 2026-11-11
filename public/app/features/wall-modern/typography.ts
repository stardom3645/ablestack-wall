import { createContext, CSSProperties, useEffect, useState } from 'react';

/** One source for DOM, native Stat/Gauge and Canvas typography. Pixels are CSS pixels. */
export const wallTypography = {
  family: '"Wall Inter", "Wall Pretendard", -apple-system, BlinkMacSystemFont, sans-serif',
  roles: {
    dashboard: { size: 24, weight: 700, line: 32, tracking: -0.5 },
    section: { size: 14, weight: 600, line: 20, tracking: -0.15 },
    panel: { size: 12, weight: 600, line: 18, tracking: 0 },
    compactPanel: { size: 11, weight: 600, line: 16, tracking: 0 },
    body: { size: 13, weight: 400, line: 20, tracking: 0 },
    caption: { size: 11, weight: 400, line: 16, tracking: 0 },
    control: { size: 12, weight: 500, line: 18, tracking: 0 },
    kpi: { size: 36, weight: 700, line: 42, tracking: -1 },
    gauge: { size: 25, weight: 700, line: 30, tracking: -0.5 },
    compactMetric: { size: 22, weight: 600, line: 26, tracking: -0.3 },
    unit: { size: 13, weight: 500, line: 18, tracking: 0 },
    status: { size: 14, weight: 600, line: 20, tracking: 0 },
    axis: { size: 11, weight: 400, line: 16, tracking: 0 },
    legend: { size: 11, weight: 500, line: 16, tracking: 0 },
    tooltip: { size: 12, weight: 500, line: 18, tracking: 0 },
    navigation: { size: 14, weight: 500, line: 20, tracking: 0 },
    navigationCaption: { size: 12, weight: 500, line: 18, tracking: 0 },
  },
} as const;

export const wallTypographyVariables: CSSProperties = Object.fromEntries([
  ['--wall-type-family', wallTypography.family],
  ...Object.entries(wallTypography.roles).flatMap(([role, value]) => [
    [`--wall-type-${role}-size`, `${value.size}px`],
    [`--wall-type-${role}-weight`, value.weight],
    [`--wall-type-${role}-line`, `${value.line}px`],
    [`--wall-type-${role}-tracking`, `${value.tracking}px`],
  ]),
]);

/** Editors and their portals use the same unscaled font faces as the rest of Wall. */
export const wallEditorFontFamily = wallTypography.family;
export const wallEditorTypography = {
  heading: { size: 15, weight: 550, line: 22 },
  title: { size: 13, weight: 500, line: 20 },
  label: { size: 13, weight: 450, line: 20 },
  body: { size: 13, weight: 400, line: 20 },
  control: { size: 13, weight: 400, line: 20 },
  caption: { size: 12, weight: 400, line: 18 },
} as const;

export const wallEditorTypographyVariables: CSSProperties = Object.fromEntries([
  ['--wall-editor-font-family', wallEditorFontFamily],
  ...Object.entries(wallEditorTypography).flatMap(([role, value]) => [
    [`--wall-editor-type-${role}-size`, `${value.size}px`],
    [`--wall-editor-type-${role}-weight`, value.weight],
    [`--wall-editor-type-${role}-line`, `${value.line}px`],
  ]),
]);

export const WallTypographyContext = createContext(false);
export const WallFontStatusContext = createContext('disabled');

/** Canvas does not automatically repaint when a web font swaps in. Rebuild providers once fonts settle. */
export function useWallTypographyFonts(enabled: boolean) {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    if (!document.fonts) {
      setStatus('fallback');
      return;
    }
    setStatus('loading');
    Promise.all(
      [400, 500, 600, 700].flatMap((weight) =>
        ['Wall Inter', 'Wall Pretendard'].map((family) =>
          document.fonts.load(
            `${weight} ${wallTypography.roles.body.size}px "${family}"`,
            'Wall SCVM 가상머신 0123456789'
          )
        )
      )
    ).then(
      (faces) => {
        if (active) {
          setStatus(faces.every((loaded) => loaded.length >= 1) ? 'ready' : 'fallback');
        }
      },
      () => {
        if (active) {
          setStatus('fallback');
        }
      }
    );
    return () => {
      active = false;
    };
  }, [enabled]);
  return enabled ? status : 'disabled';
}
