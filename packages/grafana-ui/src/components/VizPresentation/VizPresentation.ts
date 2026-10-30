import { createContext, ReactNode } from 'react';
import tinycolor from 'tinycolor2';

import { DisplayValue } from '@grafana/data';
import { GraphDrawStyle, GraphFieldConfig, GraphGradientMode, StackingMode } from '@grafana/schema';

/** Optional presentation contract. No provider means unchanged Grafana rendering. */
export interface VizPresentation {
  fontFamily: string;
  /** Invalidates Canvas configuration after application web fonts finish loading. */
  fontLoadRevision?: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
  grid: string;
  track: string;
  shadow: string;
  radius: number;
  /** Overview-only HTML readout, retaining the native gauge arc and threshold engine. */
  renderGaugeValue?: (value: DisplayValue, explicitSize?: number) => ReactNode;
  gaugeThickness?: number;
  gaugeValueMaxSize?: number;
  gaugeLabelSize?: number;
}

export const VizPresentationContext = createContext<VizPresentation | undefined>(undefined);

/** Text-only contrast adjustment. Keep the hue and original threshold/mapping data. */
export function presentValueColor(color: string | undefined, presentation: VizPresentation): string | undefined {
  if (!color || !tinycolor(color).isValid() || tinycolor.readability(color, presentation.surface) >= 4.5) {
    return color;
  }
  const adjusted = tinycolor(color);
  if (adjusted.toHsl().s < 0.1) {
    return presentation.text;
  }
  const darkSurface = tinycolor(presentation.surface).isDark();
  for (let i = 0; i < 40 && tinycolor.readability(adjusted, presentation.surface) < 4.5; i++) {
    darkSurface ? adjusted.lighten(2) : adjusted.darken(2);
  }
  return adjusted.toHexString();
}

/** Copy only cosmetic line options; never mutate data, scales or threshold encodings. */
export function presentGraphConfig(config: GraphFieldConfig): GraphFieldConfig {
  if (config.drawStyle !== GraphDrawStyle.Line) {
    return config;
  }
  const usesColorGradient =
    config.gradientMode === GraphGradientMode.Scheme || config.gradientMode === GraphGradientMode.Hue;
  const canSoftenFill = !usesColorGradient && (!config.stacking || config.stacking.mode === StackingMode.None);
  return {
    ...config,
    lineWidth: config.lineWidth === 0 ? 0 : 1.8,
    ...(canSoftenFill && (config.fillOpacity ?? 0) > 0
      ? { fillOpacity: Math.min(config.fillOpacity!, 10), gradientMode: GraphGradientMode.Opacity }
      : {}),
  };
}
