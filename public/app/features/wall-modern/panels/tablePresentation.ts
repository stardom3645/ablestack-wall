import { CSSProperties } from 'react';

import { Field, GrafanaTheme2 } from '@grafana/data';

import { wallApplicationTokens } from '../applicationTokens';
import { wallFieldText } from '../formatSystem';
import { wallCommandTokens, wallCommandVariables, wallSurfaceTokens, wallSurfaceVariables } from '../surfaceTokens';
import { wallTypography } from '../typography';

export const wallTableTokens = {
  toolbarHeight: 34,
  actionSize: 26,
  iconSize: 14,
  menuWidth: wallCommandTokens.width,
  menuRow: wallCommandTokens.itemHeight,
  radius: wallSurfaceTokens.radius,
  gap: wallSurfaceTokens.contentGap,
  font: wallTypography.roles.body,
} as const;

export function wallTableStyles(theme: GrafanaTheme2) {
  const surface = theme.isDark ? wallApplicationTokens.dark : wallApplicationTokens.light;
  return {
    resizeHandleWidth: wallSurfaceTokens.compactPadding,
    fontFamily: wallTypography.family,
    bodySize: wallTableTokens.font.size,
    headerSize: wallTypography.roles.control.size,
    headerWeight: wallTypography.roles.control.weight,
    text: surface.text,
    muted: surface.muted,
    surface: surface.surface,
    header: surface.soft,
    divider: `color-mix(in srgb, ${surface.border} 55%, transparent)`,
    hover: surface.soft,
    focus: theme.colors.primary.main,
  };
}

export function formatTableCellValue(field: Field, value: unknown) {
  return wallFieldText(field, value);
}

export function tableCellText(field: Field, row: number) {
  return formatTableCellValue(field, field.values[row]);
}

/** Escape embedded delimiters; export only this visible row, never unrelated/hidden fields. */
export function tableRowText(fields: Field[], row: number, values?: unknown[]) {
  return fields
    .map((field, index) => {
      const text = values ? formatTableCellValue(field, values[index]) : tableCellText(field, row);
      return /[\t\r\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join('\t');
}

export function wallTableVariables(theme: GrafanaTheme2): CSSProperties {
  return {
    ...wallSurfaceVariables(theme.isDark, true),
    ...wallCommandVariables(theme.isDark),
    '--wall-table-toolbar-height': `${wallTableTokens.toolbarHeight}px`,
    '--wall-table-action-size': `${wallTableTokens.actionSize}px`,
    '--wall-table-menu-width': `${wallTableTokens.menuWidth}px`,
    '--wall-table-menu-row': `${wallTableTokens.menuRow}px`,
  };
}
