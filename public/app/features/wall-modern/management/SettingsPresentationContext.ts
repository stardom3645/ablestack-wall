import { createContext, useContext } from 'react';

import type { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';

export const settingsPresentationContext = createContext<DashboardScene | undefined>(undefined);
export const useWallSettings = () => useContext(settingsPresentationContext);
