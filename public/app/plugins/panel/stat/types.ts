import type { StatPresentationStyle } from '@grafana/ui/src/components/BigValue/StatCardPresentation';

import type { Options as NativeOptions } from './panelcfg.gen';

/** Optional Wall UI presentation; native options and generated schema stay intact. */
export interface Options extends NativeOptions {
  wallStatStyle?: StatPresentationStyle;
}
