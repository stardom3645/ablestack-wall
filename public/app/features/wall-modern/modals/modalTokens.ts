import type { CSSProperties } from 'react';

import { wallApplicationTokens } from '../applicationTokens';
import { wallSurfaceTokens } from '../surfaceTokens';

/** Geometry shared by native/React Aria modals and local Base UI Dialogs. */
export const wallModalTokens = {
  padding: wallSurfaceTokens.sectionGap,
  gap: wallSurfaceTokens.cardGap,
  viewportGutter: wallSurfaceTokens.sectionGap,
  closeSize: 30,
  controlHeight: 34,
  light: {
    backdrop: 'rgb(24 27 33 / 32%)',
    shadow: '0 12px 36px rgb(24 27 33 / 14%)',
    actionText: wallApplicationTokens.light.surface,
  },
  dark: {
    backdrop: 'rgb(0 0 0 / 52%)',
    shadow: '0 12px 36px rgb(0 0 0 / 32%)',
    actionText: wallApplicationTokens.dark.background,
  },
} as const;

export function wallModalVariables(isDark: boolean): CSSProperties {
  const colors = isDark ? wallModalTokens.dark : wallModalTokens.light;
  return {
    '--wall-modal-padding': `${wallModalTokens.padding}px`,
    '--wall-modal-gap': `${wallModalTokens.gap}px`,
    '--wall-modal-gutter': `${wallModalTokens.viewportGutter}px`,
    '--wall-modal-close-size': `${wallModalTokens.closeSize}px`,
    '--wall-modal-control-height': `${wallModalTokens.controlHeight}px`,
    '--wall-modal-shadow': colors.shadow,
    '--wall-modal-backdrop': colors.backdrop,
    '--wall-modal-action-text': colors.actionText,
  };
}
