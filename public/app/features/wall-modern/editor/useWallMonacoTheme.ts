import { useEffect } from 'react';

import { useTheme2 } from '@grafana/ui';

/** Sync Monaco colors without replacing the unsaved document or editor instance. */
export function useWallMonacoTheme(enabled: boolean) {
  const theme = useTheme2();
  useEffect(() => {
    if (!enabled) {
      return;
    }
    let active = true;
    // Grafana registers both Monaco themes with mount-time colors. Re-register
    // on a live Wall theme change without remounting or losing the code buffer.
    Promise.all([import('monaco-editor'), import('@grafana/ui/src/components/Monaco/theme')]).then(
      ([monaco, nativeTheme]) => {
        if (active) {
          nativeTheme.default(monaco, theme);
          monaco.editor.setTheme(theme.isDark ? 'grafana-dark' : 'grafana-light');
        }
      }
    );
    return () => {
      active = false;
    };
  }, [enabled, theme]);
}
