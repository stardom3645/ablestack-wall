import { ReactNode, useMemo, useContext } from 'react';

import { DataFrame, formattedValueToString } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema/dist/esm/common/common.gen';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizTooltipContent } from '@grafana/ui/src/components/VizTooltip/VizTooltipContent';
import { VizTooltipFooter } from '@grafana/ui/src/components/VizTooltip/VizTooltipFooter';
import { VizTooltipHeader } from '@grafana/ui/src/components/VizTooltip/VizTooltipHeader';
import { VizTooltipWrapper } from '@grafana/ui/src/components/VizTooltip/VizTooltipWrapper';
import { VizTooltipItem } from '@grafana/ui/src/components/VizTooltip/types';
import { getContentItems } from '@grafana/ui/src/components/VizTooltip/utils';
import { WallTimeSeriesTooltip } from 'app/features/wall-modern/charts/WallTimeSeriesTooltip';

import { getDataLinks } from '../status-history/utils';
import { isTooltipScrollable } from '../timeseries/utils';

export interface HistogramTooltipProps {
  // aligned series frame
  series: DataFrame;
  xMinOnlyFrame: DataFrame;

  // hovered points
  dataIdxs: Array<number | null>;
  // closest/hovered series
  seriesIdx?: number | null;
  mode?: TooltipDisplayMode;
  sortOrder?: SortOrder;

  isPinned: boolean;
  maxHeight?: number;
  allowBinLinks?: boolean;
}

export const HistogramTooltip = ({
  series,
  xMinOnlyFrame,
  dataIdxs,
  seriesIdx,
  mode = TooltipDisplayMode.Single,
  sortOrder = SortOrder.None,
  isPinned,
  maxHeight,
  allowBinLinks = true,
}: HistogramTooltipProps) => {
  const presentation = useContext(TimeSeriesPresentationContext);
  // The X cursor index is the nearest boundary; a bar's actual interval can differ.
  const row = seriesIdx != null ? dataIdxs[seriesIdx] : dataIdxs.slice(1).find((idx) => idx != null);
  const xMinField = series.fields[0];
  const xMaxField = series.fields[1];

  // use the formatter from other bucket bound if none is defined
  const { display: xMinDisp } = xMinField.config.unit != null ? xMinField : xMaxField;
  const { display: xMaxDisp } = xMaxField.config.unit != null ? xMaxField : xMinField;

  const xMinVal = formattedValueToString(xMinDisp!(xMinField.values[row!]));
  const xMaxVal = formattedValueToString(xMaxDisp!(xMaxField.values[row!]));

  const headerItem: VizTooltipItem | null = xMinField.config.custom?.hideFrom?.tooltip
    ? null
    : {
        label: presentation ? '구간' : 'Bucket',
        value: `${xMinVal} - ${xMaxVal}`,
      };

  const contentItems = useMemo(
    () => getContentItems(xMinOnlyFrame.fields, xMinField, dataIdxs, seriesIdx, mode, sortOrder),
    [xMinOnlyFrame.fields, xMinField, dataIdxs, seriesIdx, mode, sortOrder]
  );

  let footer: ReactNode;

  if (
    isPinned &&
    seriesIdx != null &&
    allowBinLinks &&
    xMinOnlyFrame.fields[seriesIdx] &&
    dataIdxs[seriesIdx] != null
  ) {
    const field = xMinOnlyFrame.fields[seriesIdx];
    const dataIdx = dataIdxs[seriesIdx]!;
    const links = getDataLinks(field, dataIdx);

    footer = <VizTooltipFooter dataLinks={links} />;
  }

  if (row == null || row < 0 || row >= series.length) {
    return null;
  }
  if (presentation) {
    return (
      <WallTimeSeriesTooltip
        header={headerItem}
        timestamp={null}
        items={contentItems}
        isPinned={isPinned}
        scrollable={isTooltipScrollable({ mode, maxHeight })}
        maxHeight={maxHeight}
        footer={footer}
        tokens={presentation}
      />
    );
  }
  return (
    <VizTooltipWrapper>
      {headerItem != null && <VizTooltipHeader item={headerItem} isPinned={isPinned} />}
      <VizTooltipContent
        items={contentItems}
        isPinned={isPinned}
        scrollable={isTooltipScrollable({ mode, maxHeight })}
        maxHeight={maxHeight}
      />
      {footer}
    </VizTooltipWrapper>
  );
};
