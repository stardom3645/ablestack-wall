import { css } from '@emotion/css';
import memoizeOne from 'memoize-one';
import { Component, ContextType } from 'react';

import { DataFrame, TimeRange } from '@grafana/data';
import {
  TimeSeriesPresentation,
  timeSeriesPlotStyles,
} from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizPresentationContext } from '@grafana/ui/src/components/VizPresentation/VizPresentation';
import { hasVisibleLegendSeries, PlotLegend } from '@grafana/ui/src/components/uPlot/PlotLegend';
import { UPlotConfigBuilder } from '@grafana/ui/src/components/uPlot/config/UPlotConfigBuilder';
import { withTheme2 } from '@grafana/ui/src/themes/ThemeContext';

import { GraphNG, GraphNGProps, PropDiffFn } from '../GraphNG/GraphNG';

import { preparePlotConfigBuilder } from './utils';

const propsToDiff: Array<string | PropDiffFn> = ['legend', 'options', 'theme'];

type TimeSeriesProps = Omit<GraphNGProps, 'prepConfig' | 'propsToDiff' | 'renderLegend'> & {
  wallPresentation?: TimeSeriesPresentation;
};

export class UnthemedTimeSeries extends Component<TimeSeriesProps> {
  static contextType = VizPresentationContext;
  declare context: ContextType<typeof VizPresentationContext>;

  // Changing the presentation also invalidates GraphNG's theme diff (e.g. panel editor entry).
  presentationTheme = memoizeOne(
    (theme: TimeSeriesProps['theme'], presentation: typeof this.context, chart?: TimeSeriesPresentation) => {
      const style = chart ?? presentation;
      return style ? { ...theme, typography: { ...theme.typography, fontFamily: style.fontFamily } } : theme;
    }
  );

  prepConfig = (alignedFrame: DataFrame, allFrames: DataFrame[], getTimeRange: () => TimeRange) => {
    const { theme, timeZone, options, renderers, tweakAxis, tweakScale } = this.props;

    return preparePlotConfigBuilder({
      frame: alignedFrame,
      theme: this.presentationTheme(theme, this.context, this.props.wallPresentation),
      presentation: this.context,
      timeSeriesPresentation: this.props.wallPresentation,
      timeZones: Array.isArray(timeZone) ? timeZone : [timeZone],
      getTimeRange,
      allFrames,
      renderers,
      tweakScale,
      tweakAxis,
      hoverProximity: options?.tooltip?.hoverProximity,
      orientation: options?.orientation,
    });
  };

  renderLegend = (config: UPlotConfigBuilder) => {
    const { legend, frames } = this.props;

    if (!config || (legend && !legend.showLegend) || !hasVisibleLegendSeries(config, frames)) {
      return null;
    }

    return <PlotLegend data={frames} config={config} {...legend} />;
  };

  render() {
    const plot = (
      <GraphNG
        {...this.props}
        theme={this.presentationTheme(this.props.theme, this.context, this.props.wallPresentation)}
        prepConfig={this.prepConfig}
        propsToDiff={propsToDiff}
        renderLegend={this.renderLegend}
      />
    );
    return this.props.wallPresentation ? (
      <div data-wall-timeseries="true" className={css(timeSeriesPlotStyles(this.props.wallPresentation))}>
        {plot}
      </div>
    ) : (
      plot
    );
  }
}

export const TimeSeries = withTheme2(UnthemedTimeSeries);
TimeSeries.displayName = 'TimeSeries';
