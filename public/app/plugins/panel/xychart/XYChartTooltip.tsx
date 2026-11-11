import { ReactNode, useContext } from 'react';

import { DataFrame, Field, getFieldDisplayName } from '@grafana/data';
import { alpha } from '@grafana/data/src/themes/colorManipulator';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizTooltipContent } from '@grafana/ui/src/components/VizTooltip/VizTooltipContent';
import { VizTooltipFooter } from '@grafana/ui/src/components/VizTooltip/VizTooltipFooter';
import { VizTooltipHeader } from '@grafana/ui/src/components/VizTooltip/VizTooltipHeader';
import { VizTooltipWrapper } from '@grafana/ui/src/components/VizTooltip/VizTooltipWrapper';
import { ColorIndicator, VizTooltipItem } from '@grafana/ui/src/components/VizTooltip/types';
import { WallTimeSeriesTooltip } from 'app/features/wall-modern/charts/WallTimeSeriesTooltip';

import { getDataLinks } from '../status-history/utils';

import { Options } from './panelcfg.gen';
import { ScatterSeries } from './types';
import { fmt } from './utils';

export interface Props {
  dataIdxs: Array<number | null>;
  seriesIdx: number | null | undefined;
  isPinned: boolean;
  dismiss: () => void;
  options: Options;
  data: DataFrame[]; // source data
  allSeries: ScatterSeries[];
}

export const XYChartTooltip = ({ dataIdxs, seriesIdx, data, allSeries, dismiss, options, isPinned }: Props) => {
  const presentation = useContext(TimeSeriesPresentationContext);
  const rowIndex = seriesIdx != null ? (dataIdxs[seriesIdx] ?? dataIdxs.find((idx) => idx !== null)) : undefined;
  // @todo: remove -1 when uPlot v2 arrive
  // context: first value in dataIdxs always null and represent X series
  const hoveredPointIndex = seriesIdx! - 1;

  if (!allSeries?.[hoveredPointIndex] || rowIndex == null) {
    return null;
  }

  const series = allSeries[hoveredPointIndex];
  const frame = series.frame(data);
  if (!frame || rowIndex < 0 || rowIndex >= frame.length) {
    return null;
  }
  const xField = series.x(frame);
  const yField = series.y(frame);

  let label = series.name;
  if (options.seriesMapping === 'manual') {
    label = options.series?.[hoveredPointIndex]?.name ?? `Series ${hoveredPointIndex + 1}`;
  }

  let colorThing = series.pointColor(frame);

  if (Array.isArray(colorThing)) {
    colorThing = colorThing[rowIndex];
  }

  const headerItem: VizTooltipItem = {
    label,
    value: '',
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    color: alpha(colorThing as string, presentation ? 1 : 0.5),
    colorIndicator: ColorIndicator.marker_md,
  };

  const contentItems: VizTooltipItem[] = [
    {
      label: getFieldDisplayName(xField, frame),
      value: fmt(xField, xField.values[rowIndex]),
    },
    {
      label: getFieldDisplayName(yField, frame),
      value: fmt(yField, yField.values[rowIndex]),
    },
  ];

  // add extra fields
  const extraFields: Field[] = frame.fields.filter(
    (f) => f !== xField && f !== yField && (!presentation || !f.config.custom?.hideFrom?.tooltip)
  );
  if (extraFields) {
    extraFields.forEach((field) => {
      contentItems.push({
        label: field.name,
        value: fmt(field, field.values[rowIndex]),
      });
    });
  }

  let footer: ReactNode;

  if (isPinned && seriesIdx != null) {
    const links = getDataLinks(yField, rowIndex);

    footer = <VizTooltipFooter dataLinks={links} />;
  }

  if (presentation) {
    return (
      <WallTimeSeriesTooltip
        header={headerItem}
        timestamp={null}
        items={contentItems}
        isPinned={isPinned}
        scrollable
        maxHeight={options.tooltip.maxHeight}
        footer={footer}
        tokens={presentation}
      />
    );
  }

  return (
    <VizTooltipWrapper>
      <VizTooltipHeader item={headerItem} isPinned={isPinned} />
      <VizTooltipContent items={contentItems} isPinned={isPinned} />
      {footer}
    </VizTooltipWrapper>
  );
};
