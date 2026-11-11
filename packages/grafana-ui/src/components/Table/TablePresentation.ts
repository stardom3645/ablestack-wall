import { createContext, CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';

import type { Field } from '@grafana/data';

import type { TableCellProps } from './types';

export type TableCellInteractionProps = Pick<TableCellProps, 'field' | 'frame' | 'row' | 'cell' | 'onCellFilterAdded'>;

/** Optional application slots; the native table owns rows, fields, sorting and virtualization. */
export interface TableColumnAction {
  id: string;
  label: string;
  field: Field;
  visible: boolean;
  canSort: boolean;
  sort?: 'asc' | 'desc';
  canHide: boolean;
  setVisible: (visible: boolean) => void;
  setSort: (sort?: 'asc' | 'desc') => void;
}

export interface TableToolbarProps {
  columns: TableColumnAction[];
  totalRows: number;
  filteredRows: number;
}

export interface TablePresentation {
  toolbarHeight: number;
  variables?: CSSProperties;
  fontRevision?: string;
  viewKey?: string;
  styles: {
    resizeHandleWidth: number;
    fontFamily: string;
    bodySize: number;
    headerSize: number;
    headerWeight: number;
    text: string;
    muted: string;
    surface: string;
    header: string;
    divider: string;
    hover: string;
    focus: string;
  };
  renderToolbar: (props: TableToolbarProps) => ReactNode;
  renderColumnMenu: (column: TableColumnAction) => ReactNode;
  renderCell: (
    props: TableCellInteractionProps,
    native: (props?: HTMLAttributes<HTMLDivElement>) => ReactElement
  ) => ReactNode;
  renderValue?: (props: TableCellProps, native: ReactNode) => ReactNode;
}

export const TablePresentationContext = createContext<TablePresentation | undefined>(undefined);
