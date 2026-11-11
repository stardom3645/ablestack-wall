import { isNumber } from 'lodash';
import memoizeOne from 'memoize-one';
import { ContextType, PureComponent } from 'react';

import {
  DisplayValueAlignmentFactors,
  FieldDisplay,
  FieldType,
  getDisplayValueAlignmentFactors,
  getFieldDisplayValues,
  NumericRange,
  PanelProps,
} from '@grafana/data';
import { findNumericFieldMinMax } from '@grafana/data/src/field/fieldOverrides';
import { BigValueTextMode, BigValueGraphMode } from '@grafana/schema';
import { BigValue, DataLinksContextMenu, VizRepeater, VizRepeaterRenderValueProps } from '@grafana/ui';
import { StatCardPresentationContext } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { DataLinksContextMenuApi } from '@grafana/ui/src/components/DataLinks/DataLinksContextMenu';
import { config } from 'app/core/config';
import {
  hasStatStateColor,
  hasStatTimeSeries,
  statSourceValue,
  statValueMapping,
} from 'app/features/wall-modern/panels/statReadout';

import { Options } from './types';

export class StatPanel extends PureComponent<PanelProps<Options>> {
  static contextType = StatCardPresentationContext;
  declare context: ContextType<typeof StatCardPresentationContext>;
  // VizRepeater is pure: refresh its render callback on skin/theme changes without re-querying data.
  presentedRenderValue = memoizeOne(
    (_presentation: typeof this.context, _options: Options) =>
      (valueProps: VizRepeaterRenderValueProps<FieldDisplay, DisplayValueAlignmentFactors>) =>
        this.renderValue(valueProps)
  );
  presentedGridDimensions = memoizeOne(
    (presentation: NonNullable<typeof this.context>, options: Options, textMode: BigValueTextMode) =>
      (values: FieldDisplay[], width: number, height: number, spacing: number) =>
        presentation.getGridDimensions?.(values, width, height, spacing, { ...options, textMode })
  );
  renderComponent = (
    valueProps: VizRepeaterRenderValueProps<FieldDisplay, DisplayValueAlignmentFactors>,
    menuProps: DataLinksContextMenuApi
  ): JSX.Element => {
    const { timeRange, options } = this.props;
    const { value, alignmentFactors, width, height, count } = valueProps;
    const { openMenu, targetClassName } = menuProps;
    const mapping = this.context ? statValueMapping(value) : null;
    const sparkline =
      value.sparkline &&
      (!this.context || (options.graphMode !== BigValueGraphMode.None && hasStatTimeSeries(value.sparkline)))
        ? { ...value.sparkline, timeRange }
        : undefined;

    return (
      <BigValue
        statPresentation={this.context}
        statPresentationStyle={options.wallStatStyle}
        statLayout={valueProps.layout}
        hasStateColor={this.context ? hasStatStateColor(value) : undefined}
        isValueMapped={this.context ? mapping?.text != null && mapping.text === value.display.text : undefined}
        isNoValue={this.context ? !value.view : undefined}
        isTextValue={this.context && count === 1 ? typeof statSourceValue(value) === 'string' : undefined}
        value={value.display}
        count={count}
        sparkline={sparkline}
        colorMode={options.colorMode}
        graphMode={options.graphMode}
        justifyMode={options.justifyMode}
        textMode={this.getTextMode()}
        alignmentFactors={alignmentFactors}
        text={options.text}
        width={width}
        height={height}
        theme={config.theme2}
        onClick={openMenu}
        className={targetClassName}
        disableWideLayout={!options.wideLayout}
        percentChangeColorMode={options.percentChangeColorMode}
      />
    );
  };

  getTextMode() {
    const { options, fieldConfig, title } = this.props;

    // If we have manually set displayName or panel title switch text mode to value and name
    if (options.textMode === BigValueTextMode.Auto && (fieldConfig.defaults.displayName || !title)) {
      return BigValueTextMode.ValueAndName;
    }

    return options.textMode;
  }

  renderValue = (valueProps: VizRepeaterRenderValueProps<FieldDisplay, DisplayValueAlignmentFactors>): JSX.Element => {
    const { value } = valueProps;
    const { getLinks, hasLinks } = value;

    if (hasLinks && getLinks) {
      return (
        <DataLinksContextMenu links={getLinks}>
          {(api) => {
            return this.renderComponent(valueProps, api);
          }}
        </DataLinksContextMenu>
      );
    }

    return this.renderComponent(valueProps, {});
  };

  getValues = (): FieldDisplay[] => {
    const { data, options, replaceVariables, fieldConfig, timeZone } = this.props;

    let globalRange: NumericRange | undefined = undefined;

    for (let frame of data.series) {
      for (let field of frame.fields) {
        let { config } = field;
        // mostly copied from fieldOverrides, since they are skipped during streaming
        // Set the Min/Max value automatically
        if (field.type === FieldType.number) {
          if (field.state?.range) {
            continue;
          }
          if (!globalRange && (!isNumber(config.min) || !isNumber(config.max))) {
            globalRange = findNumericFieldMinMax(data.series);
          }
          const min = config.min ?? globalRange!.min;
          const max = config.max ?? globalRange!.max;
          field.state = field.state ?? {};
          field.state.range = { min, max, delta: max! - min! };
        }
      }
    }

    return getFieldDisplayValues({
      fieldConfig,
      reduceOptions: options.reduceOptions,
      replaceVariables,
      theme: config.theme2,
      data: data.series,
      sparkline: options.graphMode !== BigValueGraphMode.None,
      percentChange: options.showPercentChange,
      timeZone,
    });
  };

  render() {
    const { height, options, width, data, renderCounter } = this.props;

    return (
      <VizRepeater
        getValues={this.getValues}
        getAlignmentFactors={getDisplayValueAlignmentFactors}
        renderValue={this.context ? this.presentedRenderValue(this.context, options) : this.renderValue}
        width={width}
        height={height}
        source={data}
        itemSpacing={this.context?.itemGap ?? 3}
        minVizWidth={this.context?.minimumItemWidth}
        minVizHeight={this.context?.minimumItemHeight}
        gridItemMinSize={
          this.context?.minimumItemWidth && this.context?.minimumItemHeight
            ? { width: this.context.minimumItemWidth, height: this.context.minimumItemHeight }
            : undefined
        }
        renderCounter={renderCounter}
        autoGrid={true}
        getGridDimensions={
          this.context?.getGridDimensions
            ? this.presentedGridDimensions(this.context, options, this.getTextMode())
            : undefined
        }
        orientation={options.orientation}
      />
    );
  }
}
