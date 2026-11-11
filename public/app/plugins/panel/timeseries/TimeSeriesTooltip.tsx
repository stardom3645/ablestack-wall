import { ReactNode, useContext } from 'react';

import { DataFrame, Field, FieldType, formattedValueToString, InterpolateFunction, TimeZone } from '@grafana/data';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema/dist/esm/common/common.gen';
import { TimeSeriesPresentationContext } from '@grafana/ui/src/components/VizPresentation/TimeSeriesPresentation';
import { VizTooltipContent } from '@grafana/ui/src/components/VizTooltip/VizTooltipContent';
import { VizTooltipFooter } from '@grafana/ui/src/components/VizTooltip/VizTooltipFooter';
import { VizTooltipHeader } from '@grafana/ui/src/components/VizTooltip/VizTooltipHeader';
import { VizTooltipWrapper } from '@grafana/ui/src/components/VizTooltip/VizTooltipWrapper';
import { VizTooltipItem } from '@grafana/ui/src/components/VizTooltip/types';
import { getContentItems } from '@grafana/ui/src/components/VizTooltip/utils';
import { WallTimeSeriesTooltip } from 'app/features/wall-modern/charts/WallTimeSeriesTooltip';
import { tooltipTime, WallTooltipItem } from 'app/features/wall-modern/charts/tooltipModel';

import { getDataLinks, getFieldActions } from '../status-history/utils';
import { fmt } from '../xychart/utils';

import { isTooltipScrollable } from './utils';

// exemplar / annotation / time region hovering?
// add annotation UI / alert dismiss UI?

export interface TimeSeriesTooltipProps {
  // aligned series frame
  series: DataFrame;

  // aligned fields that are not series
  _rest?: Field[];

  // hovered points
  dataIdxs: Array<number | null>;
  // closest/hovered series
  seriesIdx?: number | null;
  mode?: TooltipDisplayMode;
  sortOrder?: SortOrder;

  isPinned: boolean;

  annotate?: () => void;
  maxHeight?: number;

  replaceVariables?: InterpolateFunction;
  timeZone?: TimeZone;
}

export const TimeSeriesTooltip = ({
  series,
  _rest,
  dataIdxs,
  seriesIdx,
  mode = TooltipDisplayMode.Single,
  sortOrder = SortOrder.None,
  isPinned,
  annotate,
  maxHeight,
  replaceVariables,
  timeZone = 'browser',
}: TimeSeriesTooltipProps) => {
  const presentation = useContext(TimeSeriesPresentationContext);
  const xField = series.fields[0];
  const xVal = formattedValueToString(xField.display!(xField.values[dataIdxs[0]!]));

  const contentItems = getContentItems(
    series.fields,
    xField,
    dataIdxs,
    seriesIdx,
    mode,
    sortOrder,
    (field) => field.type === FieldType.number || field.type === FieldType.enum,
    Boolean(presentation)
  );

  _rest?.forEach((field) => {
    if (!field.config.custom?.hideFrom?.tooltip) {
      contentItems.push({
        label: field.state?.displayName ?? field.name,
        value: fmt(field, field.values[dataIdxs[0]!]),
      });
    }
  });

  let footer: ReactNode;

  if (isPinned && seriesIdx != null) {
    const field = series.fields[seriesIdx];
    const dataIdx = dataIdxs[seriesIdx]!;
    const links = getDataLinks(field, dataIdx);
    const actions = getFieldActions(series, field, replaceVariables!);

    footer = <VizTooltipFooter dataLinks={links} actions={actions} annotate={annotate} />;
  }

  const headerItem: VizTooltipItem | null = xField.config.custom?.hideFrom?.tooltip
    ? null
    : {
        label: xField.type === FieldType.time ? '' : (xField.state?.displayName ?? xField.name),
        value: xVal,
      };

  if (presentation) {
    const timestamp = xField.type === FieldType.time ? xField.values[dataIdxs[0]!] : null;
    const time =
      typeof timestamp === 'number' && Number.isFinite(timestamp)
        ? tooltipTime(timestamp, xField, timeZone)
        : undefined;
    const items: WallTooltipItem[] = contentItems.map((item) => ({
      ...item,
      sampleTime: item.dataIndex != null && xField.type === FieldType.time ? xField.values[item.dataIndex] : undefined,
    }));
    return (
      <WallTimeSeriesTooltip
        header={headerItem && time ? { ...headerItem, value: time.text } : headerItem}
        timestamp={timestamp}
        timeZoneLabel={time?.zone}
        exactTime={time?.exact}
        sampleTimeLabel={(sample) => {
          const actual = tooltipTime(sample, xField, timeZone);
          return actual.exact.slice(0, 10) === time?.exact.slice(0, 10) ? actual.short : actual.text;
        }}
        items={items}
        isPinned={isPinned}
        maxHeight={maxHeight}
        scrollable={isTooltipScrollable({ mode, maxHeight })}
        footer={footer}
        tokens={presentation}
      />
    );
  }

  const header = headerItem != null && <VizTooltipHeader item={headerItem} isPinned={isPinned} />;
  const rows = (
    <VizTooltipContent
      items={contentItems}
      isPinned={isPinned}
      scrollable={isTooltipScrollable({ mode, maxHeight })}
      maxHeight={maxHeight}
    />
  );
  return (
    <VizTooltipWrapper>
      {header}
      {rows}
      {footer}
    </VizTooltipWrapper>
  );
};
