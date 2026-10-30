import { GrafanaTheme2 } from '@grafana/data';
import { StatCardPresentation } from '@grafana/ui/src/components/BigValue/StatCardPresentation';

import { isWallModernRoute } from './model';
import { wallSurfaceTokens } from './surfaceTokens';
import { wallTypography } from './typography';

export const STORAGE_VM_DASHBOARD_UID = 'aec03x1adsi68f';

// Keep this first pilot confined to its dashboard, including either native renderer.
export function isStorageStatPilot(pathname: string, search = '') {
  return (
    isWallModernRoute(pathname, search) &&
    pathname.split('/')[1] === 'd' &&
    pathname.split('/')[2] === STORAGE_VM_DASHBOARD_UID
  );
}

export function wallStatCardPresentation(theme: GrafanaTheme2): StatCardPresentation {
  return {
    foreground: theme.isDark ? '#edf2fa' : '#111d4e',
    muted: theme.isDark ? '#a0afc4' : '#77819d',
    surface: (theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light).surface,
    border: (theme.isDark ? wallSurfaceTokens.dark : wallSurfaceTokens.light).border,
    shadow: wallSurfaceTokens.shadow,
    radius: wallSurfaceTokens.radius,
    fontFamily: wallTypography.family,
    valueSize: wallTypography.roles.kpi.size,
    statusSize: wallTypography.roles.status.size,
    labelSize: wallTypography.roles.caption.size,
    valueWeight: wallTypography.roles.kpi.weight,
    statusWeight: wallTypography.roles.status.weight,
    labelWeight: wallTypography.roles.unit.weight,
    valueLineHeight: wallTypography.roles.kpi.line / wallTypography.roles.kpi.size,
    labelLineHeight: wallTypography.roles.caption.line / wallTypography.roles.caption.size,
    valueTracking: `${wallTypography.roles.kpi.tracking}px`,
    unitSize: wallTypography.roles.unit.size,
    unitWeight: wallTypography.roles.unit.weight,
    statusLineHeight: wallTypography.roles.status.line / wallTypography.roles.status.size,
  };
}
