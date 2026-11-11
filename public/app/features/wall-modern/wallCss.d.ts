import 'react';

// Wall's design tokens are CSS custom properties, alongside React's standard styles.
declare module 'react' {
  interface CSSProperties {
    [property: `--wall-${string}`]: string | number | undefined;
  }
}
