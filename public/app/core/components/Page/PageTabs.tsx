import { css } from '@emotion/css';

import { NavModelItem, GrafanaTheme2 } from '@grafana/data';
import { useStyles2, TabsBar, Tab, toIconName } from '@grafana/ui';

export interface Props {
  navItem: NavModelItem;
  wallPresentation?: boolean;
}

export function PageTabs({ navItem, wallPresentation = false }: Props) {
  const styles = useStyles2(getStyles);

  const tabs = navItem.children!.map(
    (child, index) =>
      !child.hideFromTabs && (
        <Tab
          label={child.text}
          active={child.active}
          key={`${child.url}-${index}`}
          icon={child.icon ? toIconName(child.icon) : undefined}
          counter={child.tabCounter}
          href={child.url}
          suffix={child.tabSuffix}
          onChangeTab={child.onClick}
        />
      )
  );
  // Native Tab links/actions remain the same; this opt-in avoids a vertical custom scrollbar in a single row.
  return wallPresentation ? (
    <div className="wall-admin-tab-list" role="tablist" aria-label="관리 화면">
      {tabs}
    </div>
  ) : (
    <div className={styles.tabsWrapper}>
      <TabsBar>{tabs}</TabsBar>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    tabsWrapper: css({
      paddingBottom: theme.spacing(3),
    }),
  };
};
