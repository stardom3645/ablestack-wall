import { PanelModel } from '@grafana/data';
import { sharedSingleStatMigrationHandler } from '@grafana/ui';

import type { WallBarOptions } from './BarGaugePanel';

export const barGaugePanelMigrationHandler = (panel: PanelModel<WallBarOptions>): Partial<WallBarOptions> => {
  return sharedSingleStatMigrationHandler(panel);
};
