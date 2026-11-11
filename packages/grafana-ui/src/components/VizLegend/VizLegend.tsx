import { css, cx } from '@emotion/css';
import { useCallback, useContext } from 'react';
import * as React from 'react';

import { DataHoverClearEvent, DataHoverEvent } from '@grafana/data';
import { LegendDisplayMode } from '@grafana/schema';

import { SeriesVisibilityChangeMode, usePanelContext } from '../PanelChrome';
import { TimeSeriesPresentationContext, timeSeriesLegendStyles } from '../VizPresentation/TimeSeriesPresentation';
import { VizPresentationContext } from '../VizPresentation/VizPresentation';

import { VizLegendList } from './VizLegendList';
import { VizLegendTable } from './VizLegendTable';
import { LegendProps, SeriesVisibilityChangeBehavior, VizLegendItem } from './types';
import { mapMouseEventToMode } from './utils';

/**
 * @public
 */
export function VizLegend<T>({
  items,
  thresholdItems,
  mappingItems,
  displayMode,
  sortBy: sortKey,
  seriesVisibilityChangeBehavior = SeriesVisibilityChangeBehavior.Isolate,
  sortDesc,
  onLabelClick,
  onToggleSort,
  placement,
  className,
  itemRenderer,
  readonly,
  isSortable,
}: LegendProps<T>) {
  const presentation = useContext(VizPresentationContext);
  const timeSeriesPresentation = useContext(TimeSeriesPresentationContext);
  className = cx(
    className,
    presentation && 'wall-viz-legend',
    timeSeriesPresentation && css(timeSeriesLegendStyles(timeSeriesPresentation))
  );
  const { eventBus, onToggleSeriesVisibility, onToggleLegendSort } = usePanelContext();

  const onMouseOver = useCallback(
    (item: VizLegendItem, event: React.MouseEvent<HTMLElement, MouseEvent> | React.FocusEvent<HTMLElement>) => {
      eventBus?.publish({
        type: DataHoverEvent.type,
        payload: {
          raw: event,
          x: 0,
          y: 0,
          dataId: item.label,
        },
      });
    },
    [eventBus]
  );

  const onMouseOut = useCallback(
    (item: VizLegendItem, event: React.MouseEvent<HTMLElement, MouseEvent> | React.FocusEvent<HTMLElement>) => {
      eventBus?.publish({
        type: DataHoverClearEvent.type,
        payload: {
          raw: event,
          x: 0,
          y: 0,
          dataId: item.label,
        },
      });
    },
    [eventBus]
  );

  const onLegendLabelClick = useCallback(
    (item: VizLegendItem, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (onLabelClick) {
        onLabelClick(item, event);
      }
      if (onToggleSeriesVisibility) {
        onToggleSeriesVisibility(
          item.fieldName ?? item.label,
          seriesVisibilityChangeBehavior === SeriesVisibilityChangeBehavior.Hide
            ? SeriesVisibilityChangeMode.AppendToSelection
            : mapMouseEventToMode(event)
        );
      }
    },
    [onToggleSeriesVisibility, onLabelClick, seriesVisibilityChangeBehavior]
  );

  const presentationItemRenderer = useCallback(
    (item: VizLegendItem<T>) =>
      timeSeriesPresentation!.renderLegendItem!({
        item,
        displayMode,
        readonly,
        onLabelClick: onLegendLabelClick,
        onLabelMouseOver: onMouseOver,
        onLabelMouseOut: onMouseOut,
      }),
    [timeSeriesPresentation, displayMode, readonly, onLegendLabelClick, onMouseOver, onMouseOut]
  );
  const effectiveItemRenderer =
    itemRenderer ?? (timeSeriesPresentation?.renderLegendItem ? presentationItemRenderer : undefined);

  const makeVizLegendList = useCallback(
    (items: VizLegendItem[]) => {
      return (
        <VizLegendList<T>
          className={className}
          placement={placement}
          onLabelMouseOver={onMouseOver}
          onLabelMouseOut={onMouseOut}
          onLabelClick={onLegendLabelClick}
          itemRenderer={effectiveItemRenderer}
          readonly={readonly}
          items={items}
        />
      );
    },
    [className, placement, onMouseOver, onMouseOut, onLegendLabelClick, effectiveItemRenderer, readonly]
  );

  if (timeSeriesPresentation?.renderLegend) {
    return timeSeriesPresentation.renderLegend({
      items,
      thresholdItems,
      mappingItems,
      displayMode,
      placement,
      sortBy: sortKey,
      sortDesc,
      readonly,
      onLabelClick: onLegendLabelClick,
      onLabelMouseOver: onMouseOver,
      onLabelMouseOut: onMouseOut,
    });
  }
  switch (displayMode) {
    case LegendDisplayMode.Table:
      return (
        <VizLegendTable<T>
          className={className}
          items={items}
          placement={placement}
          sortBy={sortKey}
          sortDesc={sortDesc}
          onLabelClick={onLegendLabelClick}
          onToggleSort={onToggleSort || onToggleLegendSort}
          onLabelMouseOver={onMouseOver}
          onLabelMouseOut={onMouseOut}
          itemRenderer={effectiveItemRenderer}
          readonly={readonly}
          isSortable={isSortable}
        />
      );
    case LegendDisplayMode.List:
      const isThresholdsEnabled = thresholdItems && thresholdItems.length > 1;
      const isValueMappingEnabled = mappingItems && mappingItems.length > 0;
      return (
        <>
          {/* render items when single series and there is no thresholds and no value mappings
           * render items when multi series and there is no thresholds
           */}
          {!isThresholdsEnabled && (!isValueMappingEnabled || items.length > 1) && makeVizLegendList(items)}
          {/* render threshold colors if From thresholds scheme selected */}
          {isThresholdsEnabled && makeVizLegendList(thresholdItems)}
          {/* render value mapping colors */}
          {isValueMappingEnabled && makeVizLegendList(mappingItems)}
        </>
      );
    default:
      return null;
  }
}

VizLegend.displayName = 'VizLegend';
