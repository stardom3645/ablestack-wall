import { HTMLAttributes, isValidElement, useContext } from 'react';
import { Cell } from 'react-table';

import { TimeRange, DataFrame } from '@grafana/data';

import { TablePresentationContext } from './TablePresentation';
import { TableStyles } from './styles';
import { GetActionsFunction, GrafanaTableColumn, TableFilterActionCallback } from './types';

export interface Props {
  cell: Cell;
  tableStyles: TableStyles;
  onCellFilterAdded?: TableFilterActionCallback;
  columnIndex: number;
  columnCount: number;
  timeRange?: TimeRange;
  userProps?: object;
  frame: DataFrame;
  rowStyled?: boolean;
  rowExpanded?: boolean;
  textWrapped?: boolean;
  height?: number;
  getActions?: GetActionsFunction;
}

export const TableCell = ({
  cell,
  tableStyles,
  onCellFilterAdded,
  timeRange,
  userProps,
  frame,
  rowStyled,
  rowExpanded,
  textWrapped,
  height,
  getActions,
}: Props) => {
  const presentation = useContext(TablePresentationContext);
  const cellProps = cell.getCellProps();
  const field = (cell.column as unknown as GrafanaTableColumn).field;

  if (!field?.display) {
    return null;
  }

  if (cellProps.style) {
    cellProps.style.wordBreak = 'break-word';
    cellProps.style.minWidth = cellProps.style.width;
    const justifyContent = (cell.column as any).justifyContent;

    if (justifyContent === 'flex-end' && !field.config.unit) {
      // justify-content flex-end is not compatible with cellLink overflow; use direction instead
      cellProps.style.textAlign = 'right';
      cellProps.style.direction = 'rtl';
      cellProps.style.unicodeBidi = 'plaintext';
    } else {
      cellProps.style.justifyContent = justifyContent;
    }
  }

  let innerWidth = (typeof cell.column.width === 'number' ? cell.column.width : 24) - tableStyles.cellPadding * 2;

  const actions = getActions ? getActions(frame, field) : [];

  const nativeProps = {
    field,
    tableStyles,
    onCellFilterAdded,
    cellProps,
    innerWidth,
    timeRange,
    userProps,
    frame,
    rowStyled,
    rowExpanded,
    textWrapped,
    height,
    actions,
  };
  const renderNative = (extra?: HTMLAttributes<HTMLDivElement>) => {
    const node = cell.render('Cell', {
      ...nativeProps,
      cellProps: { ...cellProps, ...extra, style: { ...cellProps.style, ...extra?.style } },
    });
    return isValidElement(node) ? node : <>{node}</>;
  };
  return (
    <>
      {(cell.column.id !== 'expander' &&
        presentation?.renderCell({ ...nativeProps, cell, row: cell.row }, renderNative)) ||
        renderNative()}
    </>
  );
};
