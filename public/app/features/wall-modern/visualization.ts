import { GrafanaTheme2 } from '@grafana/data';
import { VizPresentation } from '@grafana/ui/src/components/VizPresentation/VizPresentation';

import { wallSurfaceTokens } from './surfaceTokens';
import { wallTypography } from './typography';

// Canvas and portalled tooltips share the semantic tokens in modern.css.
export function wallVisualization(theme: GrafanaTheme2, fontFamily?: string): VizPresentation {
  return {
    fontFamily: fontFamily ?? "Inter, Pretendard, 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
    ...(fontFamily
      ? { gaugeValueMaxSize: wallTypography.roles.gauge.size, gaugeLabelSize: wallTypography.roles.panel.size }
      : {}),
    radius: fontFamily ? wallSurfaceTokens.radius : 10,
    text: theme.isDark ? '#edf2fa' : '#15233b',
    muted: theme.isDark ? '#a0afc4' : '#718099',
    surface: theme.isDark ? '#1c2635' : '#ffffff',
    border: fontFamily
      ? (theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light).border
      : theme.isDark
        ? '#304057'
        : '#e4eaf2',
    grid: theme.isDark ? 'rgba(160,175,196,0.12)' : 'rgba(113,128,153,0.10)',
    track: theme.isDark ? '#29374a' : '#edf2f7',
    shadow: fontFamily ? wallSurfaceTokens.shadow : theme.isDark ? '0 12px 32px #0006' : '0 12px 32px #15233b1a',
  };
}
