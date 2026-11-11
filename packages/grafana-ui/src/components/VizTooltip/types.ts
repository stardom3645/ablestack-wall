import type { FormattedValue } from '@grafana/data';
import { LineStyle } from '@grafana/schema';

export enum ColorIndicator {
  series = 'series',
  value = 'value',
  hexagon = 'hexagon',
  pie_1_4 = 'pie_1_4',
  pie_2_4 = 'pie_2_4',
  pie_3_4 = 'pie_3_4',
  marker_sm = 'marker_sm',
  marker_md = 'marker_md',
  marker_lg = 'marker_lg',
}

export enum ColorPlacement {
  hidden = 'hidden',
  first = 'first',
  leading = 'leading',
  trailing = 'trailing',
}

export interface VizTooltipItem {
  label: string;
  value: string;
  formattedValue?: FormattedValue;
  /** Native source indices, opt-in for time-series tooltip presentation only. */
  fieldIndex?: number;
  dataIndex?: number;
  color?: string;
  colorIndicator?: ColorIndicator;
  colorPlacement?: ColorPlacement;
  isActive?: boolean;
  lineStyle?: LineStyle;

  // internal/tmp for sorting
  numeric?: number;
}

export const DEFAULT_COLOR_INDICATOR = ColorIndicator.series;
