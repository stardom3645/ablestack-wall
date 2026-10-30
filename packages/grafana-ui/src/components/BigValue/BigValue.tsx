import { cx } from '@emotion/css';
import { ContextType, PureComponent } from 'react';
import * as React from 'react';

import { DisplayValue, DisplayValueAlignmentFactors, FieldSparkline } from '@grafana/data';
import { PercentChangeColorMode, VizTextDisplayOptions } from '@grafana/schema';

import { Themeable2 } from '../../types';
import { clearButtonStyles } from '../Button';
import { FormattedValueDisplay } from '../FormattedValueDisplay/FormattedValueDisplay';
import { presentValueColor, VizPresentation, VizPresentationContext } from '../VizPresentation/VizPresentation';

import { buildLayout } from './BigValueLayout';
import { PercentChange } from './PercentChange';
import { getStatCardPresentation, StatCardPresentation } from './StatCardPresentation';

export enum BigValueColorMode {
  Background = 'background',
  BackgroundSolid = 'background_solid',
  None = 'none',
  Value = 'value',
}

export enum BigValueGraphMode {
  None = 'none',
  Line = 'line',
  Area = 'area',
}

export enum BigValueJustifyMode {
  Auto = 'auto',
  Center = 'center',
}

/**
 * Options for how the value & title are to be displayed
 */
export enum BigValueTextMode {
  Auto = 'auto',
  Value = 'value',
  ValueAndName = 'value_and_name',
  Name = 'name',
  None = 'none',
}

export interface Props extends Themeable2 {
  presentation?: VizPresentation;
  /** Optional application skin. Unset keeps the existing Stat presentation. */
  statPresentation?: StatCardPresentation;
  isValueMapped?: boolean;
  /** Height of the component */
  height: number;
  /** Width of the component */
  width: number;
  /** Value displayed as Big Value */
  value: DisplayValue;
  /** Sparkline values for showing a graph under/behind the value  */
  sparkline?: FieldSparkline;
  /** onClick handler for the value */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Custom styling */
  className?: string;
  /** Color mode for coloring the value or the background */
  colorMode: BigValueColorMode;
  /** Show a graph behind/under the value */
  graphMode: BigValueGraphMode;
  /** Auto justify value and text or center it */
  justifyMode?: BigValueJustifyMode;
  /** Factors that should influence the positioning of the text  */
  alignmentFactors?: DisplayValueAlignmentFactors;
  /** Explicit font size control */
  text?: VizTextDisplayOptions;
  /** Specify which text should be visible in the BigValue */
  textMode?: BigValueTextMode;
  /** If true disables the tooltip */
  hasLinks?: boolean;
  /** Percent change color mode */
  percentChangeColorMode?: PercentChangeColorMode;

  /**
   * If part of a series of stat panes, this is the total number.
   * Used by BigValueTextMode.Auto text mode.
   */
  count?: number;

  /**
   * Disable the wide layout for the BigValue
   */
  disableWideLayout?: boolean;
}

export class BigValue extends PureComponent<Props> {
  static contextType = VizPresentationContext;
  declare context: ContextType<typeof VizPresentationContext>;
  static defaultProps: Partial<Props> = {
    justifyMode: BigValueJustifyMode.Auto,
  };

  render() {
    const { onClick, className, hasLinks, theme } = this.props;
    const layout = buildLayout(this.context ? { ...this.props, presentation: this.context } : this.props);
    if (this.context) {
      // Keep the native fit calculation and explicit user font sizes as upper priorities.
      if (!this.props.text?.valueSize) {
        layout.valueFontSize = Math.min(layout.valueFontSize, 44);
      }
      if (!this.props.text?.titleSize) {
        layout.titleFontSize = Math.min(layout.titleFontSize, 12);
      }
    }
    const panelStyles = layout.getPanelStyles();
    const valueAndTitleContainerStyles = layout.getValueAndTitleContainerStyles();
    const valueStyles = layout.getValueStyles();
    const titleStyles = layout.getTitleStyles();
    if (this.context) {
      Object.assign(panelStyles, { fontFamily: this.context.fontFamily });
      Object.assign(valueStyles, { fontWeight: 600, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums' });
      Object.assign(titleStyles, { fontWeight: 500 });
      // Background color modes keep Grafana's contrast-aware foreground colors.
      if (this.props.colorMode === BigValueColorMode.Value || this.props.colorMode === BigValueColorMode.None) {
        titleStyles.color = this.context.muted;
        if (this.props.colorMode === BigValueColorMode.None) {
          valueStyles.color = this.context.text;
        } else {
          valueStyles.color = presentValueColor(this.props.value.color, this.context);
        }
      }
    }
    const textValues = layout.textValues;
    const statCard = this.props.statPresentation
      ? getStatCardPresentation(this.props.statPresentation, {
          width: this.props.width,
          height: this.props.height,
          valueSize: layout.valueFontSize,
          labelSize: layout.titleFontSize,
          explicitValueSize: this.props.text?.valueSize,
          explicitLabelSize: this.props.text?.titleSize,
          isMapped: Boolean(
            this.props.isValueMapped &&
              this.props.textMode !== BigValueTextMode.Name &&
              this.props.textMode !== BigValueTextMode.None
          ),
          isColored: this.props.colorMode === BigValueColorMode.Value && this.props.textMode !== BigValueTextMode.None,
          hasBackground:
            this.props.colorMode === BigValueColorMode.Background ||
            this.props.colorMode === BigValueColorMode.BackgroundSolid,
          isEmpty: Number.isNaN(this.props.value.numeric) && !this.props.isValueMapped,
          color: valueStyles.color,
        })
      : undefined;
    if (statCard) {
      Object.assign(panelStyles, statCard.panel);
      Object.assign(valueAndTitleContainerStyles, statCard.stack);
      Object.assign(valueStyles, statCard.value);
      Object.assign(titleStyles, statCard.label);
    }
    const percentChange = this.props.value.percentChange;
    const percentChangeColorMode = this.props.percentChangeColorMode;
    const showPercentChange = percentChange != null && !Number.isNaN(percentChange);

    // When there is an outer data link this tooltip will override the outer native tooltip
    const tooltip = hasLinks ? undefined : textValues.tooltip;

    if (!onClick) {
      return (
        <div
          className={className}
          style={panelStyles}
          title={tooltip}
          data-viz-presentation={statCard ? 'wall-stat-card' : this.context ? 'wall-stat' : undefined}
        >
          <div style={valueAndTitleContainerStyles}>
            {textValues.title && <div style={titleStyles}>{textValues.title}</div>}
            <FormattedValueDisplay
              value={textValues}
              unitStyle={
                this.props.statPresentation?.unitSize && this.props.text?.valueSize === undefined
                  ? {
                      fontSize: this.props.statPresentation.unitSize,
                      fontWeight: this.props.statPresentation.unitWeight,
                    }
                  : undefined
              }
              style={valueStyles}
              className={statCard ? 'wall-stat-card-value' : undefined}
              data-wall-stat-kind={statCard?.kind}
              data-wall-stat-indicator={statCard?.indicator || undefined}
            />
            {showPercentChange && (
              <PercentChange
                percentChange={percentChange}
                styles={layout.getPercentChangeStyles(percentChange, percentChangeColorMode, valueStyles)}
              />
            )}
          </div>
          {layout.renderChart()}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={cx(clearButtonStyles(theme), className)}
        style={panelStyles}
        onClick={onClick}
        title={tooltip}
        data-viz-presentation={statCard ? 'wall-stat-card' : this.context ? 'wall-stat' : undefined}
      >
        <div style={valueAndTitleContainerStyles}>
          {textValues.title && <div style={titleStyles}>{textValues.title}</div>}
          <FormattedValueDisplay
            value={textValues}
            unitStyle={
              this.props.statPresentation?.unitSize && this.props.text?.valueSize === undefined
                ? { fontSize: this.props.statPresentation.unitSize, fontWeight: this.props.statPresentation.unitWeight }
                : undefined
            }
            style={valueStyles}
            className={statCard ? 'wall-stat-card-value' : undefined}
            data-wall-stat-kind={statCard?.kind}
            data-wall-stat-indicator={statCard?.indicator || undefined}
          />
        </div>
        {layout.renderChart()}
      </button>
    );
  }
}
