import { useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { NavModelItem } from '@grafana/data';
import { t } from 'app/core/internationalization';

const defaultPageNav: Partial<NavModelItem> = {
  icon: 'bell-slash',
};

export function useSilenceNavData() {
  const { isExact, path } = useRouteMatch();
  const [pageNav, setPageNav] = useState<NavModelItem | undefined>();

  useEffect(() => {
    if (path === '/alerting/silence/new') {
      setPageNav({
        ...defaultPageNav,
        id: 'silence-new',
        text: t('ablestack-wall.alert.silence-alert-rule', 'Silence alert rule'),
        subTitle: t(
          'ablestack-wall.alert.silence-alert-rule-subtitle',
          'Configure silences to stop notifications from a particular alert rule.'
        ),
      });
    } else if (path === '/alerting/silence/:id/edit') {
      setPageNav({
        ...defaultPageNav,
        id: 'silence-edit',
        text: 'Edit silence',
        subTitle: 'Recreate existing silence to stop notifications from a particular alert rule',
      });
    }
  }, [path, isExact]);

  return pageNav;
}
