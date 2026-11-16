import type { CSSProperties } from 'react';

/** Application chrome only. Visualization colors/thresholds and panel geometry stay independent. */
export const wallApplicationTokens = {
  sidebar: 264,
  secondary: 224,
  rail: 64,
  header: 52,
  control: 36,
  gap: 8,
  gutter: 24,
  light: {
    background: '#fafafd',
    surface: '#ffffff',
    soft: '#f3f4f5',
    elevated: '#ffffff',
    text: '#45454f',
    muted: '#646970',
    border: '#e6e6ec',
    hover: '#f6f6f9',
    active: '#fafafd',
    primary: '#45454f',
    shadow: '0 6px 20px rgb(24 27 33 / 10%)',
  },
  dark: {
    background: '#17191e',
    surface: '#202329',
    soft: '#282c33',
    elevated: '#292d35',
    text: '#f2f3f5',
    muted: '#adb2bd',
    border: '#414650',
    hover: '#333842',
    active: '#292b31',
    primary: '#e2e2ea',
    shadow: '0 6px 20px rgb(0 0 0 / 24%)',
  },
} as const;

export function wallApplicationVariables(isDark: boolean): CSSProperties {
  const colors = isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  return Object.fromEntries([
    ...Object.entries(colors).map(([name, value]) => [`--wall-app-${name}`, value]),
    ...(['sidebar', 'secondary', 'rail', 'header', 'control', 'gap', 'gutter'] as const).map((name) => [
      `--wall-app-${name}`,
      `${wallApplicationTokens[name]}px`,
    ]),
  ]);
}
