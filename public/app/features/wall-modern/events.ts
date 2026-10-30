import { BusEventWithPayload } from '@grafana/data';

// Both native dashboard renderers already use DashboardSrv for star mutations.
export class WallDashboardStarredEvent extends BusEventWithPayload<{ uid: string; isStarred: boolean }> {
  static type = 'wall-dashboard-starred';
}
