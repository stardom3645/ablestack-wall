import { useContext, useMemo } from 'react';

import { DataFrame } from '@grafana/data';
import { getValueMappingResult } from '@grafana/data/src/utils/valueMappings';
import { TableCellDisplayMode } from '@grafana/schema';
import { useTheme2 } from '@grafana/ui';
import type { TablePresentation } from '@grafana/ui/src/components/Table/TablePresentation';

import { WallFontStatusContext, WallTypographyContext } from '../typography';

import { WallTableCell } from './WallTableCell';
import { WallTableColumnMenu, WallTableControls } from './WallTableControls';
import { wallTableStyles, wallTableTokens, wallTableVariables } from './tablePresentation';
import './table.css';

export function useWallTablePresentation(frames: DataFrame[], index: number, onFrameChange: (index: number) => void) {
  const enabled = useContext(WallTypographyContext);
  const fontStatus = useContext(WallFontStatusContext);
  const theme = useTheme2();
  return useMemo<TablePresentation | undefined>(
    () =>
      enabled
        ? {
            toolbarHeight: wallTableTokens.toolbarHeight,
            fontRevision: fontStatus,
            viewKey: JSON.stringify([
              index,
              frames[index]?.refId,
              frames[index]?.name,
              frames[index]?.fields.map((field) => [field.name, field.type, field.config.custom?.hidden]),
            ]),
            variables: wallTableVariables(theme),
            styles: wallTableStyles(theme),
            renderToolbar: (props) => (
              <WallTableControls {...props} frames={frames} index={index} onFrameChange={onFrameChange} />
            ),
            renderColumnMenu: (column) => <WallTableColumnMenu column={column} />,
            renderCell: (props, native) => <WallTableCell {...props} native={native} />,
            renderValue: (props, native) => {
              const { field, cell } = props;
              const mapping = getValueMappingResult(field.config.mappings ?? [], cell.value);
              if (
                field.config.custom?.cellOptions?.type === TableCellDisplayMode.ColorText &&
                mapping?.text &&
                typeof native === 'string' &&
                native === mapping.text &&
                !/^[-+\d.,\s%]+$/.test(native)
              ) {
                return <span className="wall-table-status">{native}</span>;
              }
              return native;
            },
          }
        : undefined,
    [enabled, theme, frames, index, onFrameChange, fontStatus]
  );
}
