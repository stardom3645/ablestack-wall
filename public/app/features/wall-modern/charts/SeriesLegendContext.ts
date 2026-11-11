import { createContext } from 'react';

import type { VizLegendItem } from '@grafana/ui/src/components/VizLegend/types';
export const SeriesLegendContext = createContext<VizLegendItem[]>([]);
