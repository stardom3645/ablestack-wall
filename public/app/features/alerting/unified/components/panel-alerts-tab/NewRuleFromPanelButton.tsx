import { useLocation } from 'react-router-dom-v5-compat';
import { useAsync } from 'react-use';

import { urlUtil } from '@grafana/data';
import { Alert, Button, LinkButton } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { useSelector } from 'app/types';

import { logInfo, LogMessages } from '../../Analytics';
import { panelToRuleFormValues } from '../../utils/rule-form';

interface Props {
  panel: PanelModel;
  dashboard: DashboardModel;
  className?: string;
}

export const NewRuleFromPanelButton = ({ dashboard, panel, className }: Props) => {
  const templating = useSelector((state) => {
    return state.templating;
  });

  const location = useLocation();

  const { loading, value: formValues } = useAsync(
    () => panelToRuleFormValues(panel, dashboard),
    // Templating variables are required to update formValues on each variable's change. It's used implicitly by the templating engine
    [panel, dashboard, templating]
  );

  if (loading) {
    return <Button disabled={true}>{t('ablestack-wall.alert.new-alert-rule', 'New alert rule')}</Button>;
  }

  if (!formValues) {
    return (
      <Alert severity="info" title="No alerting capable query found">
        {t(
          'ablestack-wall.alert.no-query-alert-datasource',
          'Cannot create alerts from this panel because no query to an alerting capable datasource is found.'
        )}
      </Alert>
    );
  }

  const ruleFormUrl = urlUtil.renderUrl('alerting/new', {
    defaults: JSON.stringify(formValues),
    returnTo: location.pathname + location.search,
  });

  return (
    <LinkButton
      icon="bell"
      onClick={() => logInfo(LogMessages.alertRuleFromPanel)}
      href={ruleFormUrl}
      className={className}
      data-testid="create-alert-rule-button"
    >
      {t('ablestack-wall.alert.new-alert-rule', 'New alert rule')}
    </LinkButton>
  );
};
