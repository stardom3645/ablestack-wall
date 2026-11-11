import { DashboardCursorSync } from '@grafana/schema';

/** Wall shares the time cursor by default, without opening follower tooltips. */
export const DEFAULT_DASHBOARD_CURSOR_SYNC = DashboardCursorSync.Crosshair;
