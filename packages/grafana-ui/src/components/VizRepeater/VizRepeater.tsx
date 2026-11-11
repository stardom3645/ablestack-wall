import { clamp } from 'lodash';
import { PureComponent, CSSProperties, ContextType } from 'react';
import * as React from 'react';

import { VizOrientation } from '@grafana/data';

import { calculateGridDimensions } from '../../utils/squares';
import { PanelScrollArea, panelScrollTokens } from '../PanelScrollArea/PanelScrollArea';
import { VizPresentationContext } from '../VizPresentation/VizPresentation';

interface Props<V, D> {
  getGridDimensions?: (values: V[], width: number, height: number, spacing: number) => VizRepeaterGrid | undefined;
  /**
   * Optionally precalculate dimensions to support consistent behavior between repeated
   * values.  Two typical patterns are:
   * 1) Calculate raw values like font size etc and pass them to each vis
   * 2) find the maximum input values and pass that to the vis
   */
  getAlignmentFactors?: (values: V[], width: number, height: number) => D;

  /**
   * Render a single value
   */
  renderValue: (props: VizRepeaterRenderValueProps<V, D>) => JSX.Element;
  height: number;
  width: number;
  source: unknown; // If this changes, new values will be requested
  getValues: () => V[];
  renderCounter: number; // force update of values & render
  orientation: VizOrientation;
  itemSpacing?: number;
  /** When orientation is set to auto layout items in a grid */
  autoGrid?: boolean;
  minVizWidth?: number;
  minVizHeight?: number;
  maxVizHeight?: number;
  /** Opt-in readout grid: retain legible cells and scroll rather than crushing values. */
  gridItemMinSize?: { width: number; height: number };
}

export interface VizRepeaterRenderValueProps<V, D = {}> {
  layout?: 'inline';
  value: V;
  width: number;
  height: number;
  orientation: VizOrientation;
  alignmentFactors: D;
  /**
   * Total number of values being shown in repeater
   */
  count: number;
}

export interface VizRepeaterGrid {
  width: number;
  height: number;
  widthOnLastRow: number;
  xCount: number;
  yCount: number;
  spacing?: number;
  layout?: 'inline';
}

interface DefaultProps {
  itemSpacing: number;
}

type PropsWithDefaults<V, D> = Props<V, D> & DefaultProps;

interface State<V> {
  values: V[];
}

export class VizRepeater<V, D = {}> extends PureComponent<PropsWithDefaults<V, D>, State<V>> {
  static contextType = VizPresentationContext;
  declare context: ContextType<typeof VizPresentationContext>;

  static defaultProps: DefaultProps = {
    itemSpacing: 8,
  };

  constructor(props: PropsWithDefaults<V, D>) {
    super(props);

    this.state = {
      values: props.getValues(),
    };
  }

  componentDidUpdate(prevProps: Props<V, D>) {
    const { renderCounter, source } = this.props;
    if (renderCounter !== prevProps.renderCounter || source !== prevProps.source) {
      this.setState({ values: this.props.getValues() });
    }
  }

  getOrientation(): VizOrientation {
    const { orientation, width, height } = this.props;

    if (orientation === VizOrientation.Auto) {
      if (width > height) {
        return VizOrientation.Vertical;
      } else {
        return VizOrientation.Horizontal;
      }
    }

    return orientation;
  }

  renderGrid() {
    const { renderValue, height, width, itemSpacing, getAlignmentFactors, orientation } = this.props;

    const { values } = this.state;
    if (!values.length) {
      return null;
    }
    const minimum = this.props.gridItemMinSize;
    const gridWidth = minimum ? Math.max(1, width - panelScrollTokens.clearance) : width;
    const capacity = minimum
      ? Math.max(1, Math.min(values.length, Math.floor((gridWidth + itemSpacing) / (minimum.width + itemSpacing))))
      : 0;
    const rows = capacity ? Math.ceil(values.length / capacity) : 0;
    // Balance four fields as 2×2 instead of leaving a lone value on a 3+1 row.
    const columns = rows ? Math.ceil(values.length / rows) : 0;
    const grid: VizRepeaterGrid =
      this.props.getGridDimensions?.(values, width, height, itemSpacing) ??
      (minimum
        ? {
            width: Math.max(1, (gridWidth - (columns - 1) * itemSpacing) / columns),
            height: Math.max(values.length === 1 ? 0 : minimum.height, (height - (rows - 1) * itemSpacing) / rows),
            xCount: columns,
            yCount: rows,
            widthOnLastRow: Math.max(1, (gridWidth - (columns - 1) * itemSpacing) / columns),
          }
        : calculateGridDimensions(width, height, itemSpacing, values.length));
    const spacing = grid.spacing ?? itemSpacing;
    const alignmentFactors = getAlignmentFactors ? getAlignmentFactors(values, grid.width, grid.height) : ({} as D);

    let xGrid = 0;
    let yGrid = 0;
    let items: JSX.Element[] = [];

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      const isLastRow = yGrid === grid.yCount - 1;

      const itemWidth = isLastRow ? grid.widthOnLastRow : grid.width;
      const itemHeight = grid.height;

      const xPos = xGrid * itemWidth + spacing * xGrid;
      const yPos = yGrid * itemHeight + spacing * yGrid;

      const itemStyles: CSSProperties = {
        position: 'absolute',
        left: xPos,
        top: yPos,
        width: `${itemWidth}px`,
        height: `${itemHeight}px`,
      };

      items.push(
        <div key={i} style={itemStyles}>
          {renderValue({
            value,
            width: itemWidth,
            height: itemHeight,
            alignmentFactors,
            orientation,
            count: values.length,
            layout: grid.layout,
          })}
        </div>
      );

      xGrid++;

      if (xGrid === grid.xCount) {
        xGrid = 0;
        yGrid++;
      }
    }

    const content = (
      <div
        style={{ position: 'relative', height: minimum ? grid.yCount * (grid.height + spacing) - spacing : undefined }}
      >
        {items}
      </div>
    );
    return minimum ? (
      <PanelScrollArea aria-label="수치 항목 목록" style={{ width, height, overflowY: 'auto', overflowX: 'hidden' }}>
        {content}
      </PanelScrollArea>
    ) : (
      content
    );
  }

  render() {
    const {
      renderValue,
      height,
      width,
      itemSpacing,
      getAlignmentFactors,
      autoGrid,
      orientation,
      maxVizHeight,
      minVizWidth,
      minVizHeight,
    } = this.props;
    const { values } = this.state;

    if (autoGrid && orientation === VizOrientation.Auto) {
      return this.renderGrid();
    }

    const itemStyles: React.CSSProperties = {
      display: 'flex',
      flexShrink: this.props.gridItemMinSize ? 0 : undefined,
    };

    const repeaterStyle: React.CSSProperties = {
      display: 'flex',
      overflow: `${minVizWidth ? 'auto' : 'hidden'} ${minVizHeight ? 'auto' : 'hidden'}`,
    };

    let vizHeight = height;
    let vizWidth = width;

    const resolvedOrientation = this.getOrientation();

    switch (resolvedOrientation) {
      case VizOrientation.Horizontal:
        const defaultVizHeight = (height + itemSpacing) / values.length - itemSpacing;
        repeaterStyle.flexDirection = 'column';
        repeaterStyle.height = `${height}px`;
        repeaterStyle.overflowX = 'hidden';
        itemStyles.marginBottom = `${itemSpacing}px`;
        vizWidth =
          this.context && !(this.props.gridItemMinSize && values.length === 1)
            ? Math.max(1, width - panelScrollTokens.clearance)
            : width;
        vizHeight = clamp(
          defaultVizHeight,
          this.props.gridItemMinSize && values.length === 1 ? Math.min(height, minVizHeight ?? 0) : (minVizHeight ?? 0),
          maxVizHeight ??
            (this.props.gridItemMinSize ? Math.max(defaultVizHeight, minVizHeight ?? 0) : defaultVizHeight)
        );
        break;
      case VizOrientation.Vertical:
        repeaterStyle.flexDirection = 'row';
        repeaterStyle.justifyContent = 'space-between';
        repeaterStyle.overflowY = 'hidden';
        itemStyles.marginRight = `${itemSpacing}px`;
        vizHeight = height;
        vizWidth = Math.max(width / values.length - itemSpacing + itemSpacing / values.length, minVizWidth ?? 0);
    }

    itemStyles.width = `${vizWidth}px`;
    itemStyles.height = `${vizHeight}px`;

    const alignmentFactors = getAlignmentFactors ? getAlignmentFactors(values, vizWidth, vizHeight) : ({} as D);

    const Viewport = this.context ? PanelScrollArea : 'div';
    return (
      <Viewport style={repeaterStyle} aria-label={this.context ? '시각화 항목 목록' : undefined}>
        {values.map((value, index) => {
          return (
            <div key={index} style={getItemStylesForIndex(itemStyles, index, values.length)}>
              {renderValue({
                value,
                width: vizWidth,
                height: vizHeight,
                alignmentFactors,
                orientation: resolvedOrientation,
                count: values.length,
              })}
            </div>
          );
        })}
      </Viewport>
    );
  }
}

/*
 * Removes any padding on the last item
 */
function getItemStylesForIndex(itemStyles: CSSProperties, index: number, length: number): CSSProperties {
  if (index === length - 1) {
    return {
      ...itemStyles,
      marginRight: 0,
      marginBottom: 0,
    };
  }
  return itemStyles;
}
