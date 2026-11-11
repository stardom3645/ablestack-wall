import { css } from '@emotion/css';
import { FC, CSSProperties, ComponentType, useContext } from 'react';
import * as React from 'react';
import { useMeasure } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { LegendPlacement } from '@grafana/schema';

import { useStyles2, useTheme2 } from '../../themes/ThemeContext';
import { getFocusStyles } from '../../themes/mixins';
import { CustomScrollbar } from '../CustomScrollbar/CustomScrollbar';
import { panelScrollTokens } from '../PanelScrollArea/PanelScrollArea';
import { TimeSeriesPresentationContext } from '../VizPresentation/TimeSeriesPresentation';
import { VizPresentationContext } from '../VizPresentation/VizPresentation';

/**
 * @beta
 */
export interface VizLayoutProps {
  width: number;
  height: number;
  legend?: React.ReactElement<VizLayoutLegendProps> | null;
  children: (width: number, height: number) => React.ReactNode;
}

/**
 * @beta
 */
export interface VizLayoutComponentType extends FC<VizLayoutProps> {
  Legend: ComponentType<VizLayoutLegendProps>;
}

/**
 * @beta
 */
export const VizLayout: VizLayoutComponentType = ({ width, height, legend, children }) => {
  const theme = useTheme2();
  const wall = Boolean(useContext(VizPresentationContext));
  const timeSeriesPresentation = useContext(TimeSeriesPresentationContext);
  const wallTimeSeries = Boolean(timeSeriesPresentation?.refinedInteractions);
  const styles = useStyles2(getVizStyles);
  const containerStyle: CSSProperties = {
    display: 'flex',
    width: `${width}px`,
    height: `${height}px`,
  };
  const [legendRef, legendMeasure] = useMeasure<HTMLDivElement>();

  if (!legend) {
    return (
      <>
        <div style={containerStyle} className={styles.viz}>
          {children(width, height)}
        </div>
      </>
    );
  }

  let { placement, maxHeight = '35%', maxWidth = '60%' } = legend.props;

  if (!wallTimeSeries && document.body.clientWidth < theme.breakpoints.values.lg) {
    placement = 'bottom';
  }

  let size: VizSize | null = null;

  const legendStyle: CSSProperties = {};

  switch (placement) {
    case 'bottom':
      containerStyle.flexDirection = 'column';
      legendStyle.maxHeight = maxHeight;

      if (legendMeasure.height) {
        size = { width, height: height - legendMeasure.height };
      }
      break;
    case 'right':
      containerStyle.flexDirection = 'row';
      legendStyle.maxWidth = maxWidth;
      if (wallTimeSeries) {
        legendStyle.flexShrink = 0;
      }

      if (legendMeasure.width) {
        size = { width: width - legendMeasure.width, height };
      }

      if (legend.props.width) {
        legendStyle.width = legend.props.width;
        // Subtract the measured, CSS-constrained box, not an unclamped request.
        if (!wallTimeSeries) {
          size = { width: width - legend.props.width, height };
        }
      }
      break;
  }

  // This happens when position is switched from bottom to right
  // Then we preserve old with for one render cycle until legend is measured in it's new position
  if (wallTimeSeries && size) {
    size.width = Math.max(1, size.width);
    size.height = Math.max(1, size.height);
  }
  if (!wallTimeSeries && size?.width === 0) {
    size.width = width;
  }

  if (!wallTimeSeries && size?.height === 0) {
    size.height = height;
  }

  return (
    <div style={containerStyle}>
      <div className={styles.viz} style={wallTimeSeries ? { minWidth: 0, minHeight: 0 } : undefined}>
        {size && children(size.width, size.height)}
      </div>
      <div style={legendStyle} ref={legendRef}>
        <CustomScrollbar
          hideHorizontalTrack
          hideNativeScrollbars={timeSeriesPresentation?.refinedInteractions}
          contentInset={wall ? panelScrollTokens.clearance : 0}
        >
          {legend}
        </CustomScrollbar>
      </div>
    </div>
  );
};

export const getVizStyles = (theme: GrafanaTheme2) => {
  return {
    viz: css({
      flexGrow: 2,
      borderRadius: theme.shape.radius.default,
      '&:focus-visible': getFocusStyles(theme),
    }),
  };
};
interface VizSize {
  width: number;
  height: number;
}

/**
 * @beta
 */
export interface VizLayoutLegendProps {
  placement: LegendPlacement;
  children: React.ReactNode;
  maxHeight?: string;
  maxWidth?: string;
  width?: number;
}

/**
 * @beta
 */
export const VizLayoutLegend: FC<VizLayoutLegendProps> = ({ children }) => {
  return <>{children}</>;
};

VizLayout.Legend = VizLayoutLegend;
