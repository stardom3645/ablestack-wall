import { partial } from 'lodash';
import { type ReactElement, useEffect, useState } from 'react';
import { DeepMap, FieldError, FieldErrors, useForm, Controller } from 'react-hook-form';

import { locationUtil, SelectableValue } from '@grafana/data';
import { config, locationService, reportInteraction } from '@grafana/runtime';
import { Alert, Button, Field, Modal, RadioButtonGroup } from '@grafana/ui';
import { DashboardPicker } from 'app/core/components/Select/DashboardPicker';
import { t } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import { removeDashboardToFetchFromLocalStorage } from 'app/features/dashboard/state/initDashboard';
import { AccessControlAction, useSelector } from 'app/types';

import { getExploreItemSelector } from '../../state/selectors';

import { setDashboardInLocalStorage, AddToDashboardError } from './addToDashboard';

enum SaveTarget {
  NewDashboard = 'new-dashboard',
  ExistingDashboard = 'existing-dashboard',
}

interface SaveTargetDTO {
  saveTarget: SaveTarget;
}
interface SaveToNewDashboardDTO extends SaveTargetDTO {
  saveTarget: SaveTarget.NewDashboard;
}

interface SaveToExistingDashboard extends SaveTargetDTO {
  saveTarget: SaveTarget.ExistingDashboard;
  dashboardUid: string;
}

type FormDTO = SaveToNewDashboardDTO | SaveToExistingDashboard;

function assertIsSaveToExistingDashboardError(
  errors: FieldErrors<FormDTO>
): asserts errors is DeepMap<SaveToExistingDashboard, FieldError> {
  // the shape of the errors object is always compatible with the type above, but we need to
  // explicitly assert its type so that TS can narrow down FormDTO to SaveToExistingDashboard
  // when we use it in the form.
}

function getDashboardURL(dashboardUid?: string) {
  return dashboardUid ? `d/${dashboardUid}` : 'dashboard/new';
}

enum GenericError {
  UNKNOWN = 'unknown-error',
  NAVIGATION = 'navigation-error',
}

interface SubmissionError {
  error: AddToDashboardError | GenericError;
  message: string;
}

interface Props {
  onClose: () => void;
  exploreId: string;
}

export function AddToDashboardForm(props: Props): ReactElement {
  const { exploreId, onClose } = props;
  const exploreItem = useSelector(getExploreItemSelector(exploreId))!;
  const [submissionError, setSubmissionError] = useState<SubmissionError | undefined>();
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormDTO>({
    defaultValues: { saveTarget: SaveTarget.NewDashboard },
  });

  const canCreateDashboard = contextSrv.hasPermission(AccessControlAction.DashboardsCreate);
  const canWriteDashboard = contextSrv.hasPermission(AccessControlAction.DashboardsWrite);

  const saveTargets: Array<SelectableValue<SaveTarget>> = [];
  if (canCreateDashboard) {
    saveTargets.push({
      label: t('ablestack-wall.dashboard.new-dashboard', 'New dashboard'),
      value: SaveTarget.NewDashboard,
    });
  }
  if (canWriteDashboard) {
    saveTargets.push({
      label: t('ablestack-wall.dashboard.existing-dashboard', 'Existing dashboard'),
      value: SaveTarget.ExistingDashboard,
    });
  }

  const saveTarget = saveTargets.length > 1 ? watch('saveTarget') : saveTargets[0].value;

  const onSubmit = async (openInNewTab: boolean, data: FormDTO) => {
    setSubmissionError(undefined);
    const dashboardUid = data.saveTarget === SaveTarget.ExistingDashboard ? data.dashboardUid : undefined;

    reportInteraction('e_2_d_submit', {
      newTab: openInNewTab,
      saveTarget: data.saveTarget,
      queries: exploreItem.queries.length,
    });

    const { from, to } = exploreItem.range.raw;

    try {
      await setDashboardInLocalStorage({
        dashboardUid,
        datasource: exploreItem.datasourceInstance?.getRef(),
        queries: exploreItem.queries,
        queryResponse: exploreItem.queryResponse,
        panelState: exploreItem?.panelsState,
        time: {
          from: typeof from === 'string' ? from : from.toISOString(),
          to: typeof to === 'string' ? to : to.toISOString(),
        },
      });
    } catch (error) {
      switch (error) {
        case AddToDashboardError.FETCH_DASHBOARD:
          setSubmissionError({ error, message: 'Could not fetch dashboard information. Please try again.' });
          break;
        case AddToDashboardError.SET_DASHBOARD_LS:
          setSubmissionError({ error, message: 'Could not add panel to dashboard. Please try again.' });
          break;
        default:
          setSubmissionError({ error: GenericError.UNKNOWN, message: 'Something went wrong. Please try again.' });
      }
      return;
    }

    const dashboardURL = getDashboardURL(dashboardUid);
    if (!openInNewTab) {
      onClose();
      locationService.push(locationUtil.stripBaseFromUrl(dashboardURL));
      return;
    }

    const didTabOpen = !!global.open(config.appUrl + dashboardURL, '_blank');
    if (!didTabOpen) {
      setSubmissionError({
        error: GenericError.NAVIGATION,
        message: 'Could not navigate to the selected dashboard. Please try again.',
      });
      removeDashboardToFetchFromLocalStorage();
      return;
    }
    onClose();
  };

  useEffect(() => {
    reportInteraction('e_2_d_open');
  }, []);

  return (
    <form>
      {saveTargets.length > 1 && (
        <Controller
          control={control}
          render={({ field: { ref, ...field } }) => (
            <Field
              label={t('ablestack-wall.explore.target-dashboard', 'Target dashboard')}
              description={t('ablestack-wall.explore.choose-where-to-add-the-panel', 'Choose where to add the panel.')}
            >
              <RadioButtonGroup options={saveTargets} {...field} id="e2d-save-target" />
            </Field>
          )}
          name="saveTarget"
        />
      )}

      {saveTarget === SaveTarget.ExistingDashboard &&
        (() => {
          assertIsSaveToExistingDashboardError(errors);
          return (
            <Controller
              render={({ field: { ref, value, onChange, ...field } }) => (
                <Field
                  label="Dashboard"
                  description="Select in which dashboard the panel will be created."
                  error={errors.dashboardUid?.message}
                  invalid={!!errors.dashboardUid}
                >
                  <DashboardPicker
                    {...field}
                    inputId="e2d-dashboard-picker"
                    defaultOptions
                    onChange={(d) => onChange(d?.uid)}
                  />
                </Field>
              )}
              control={control}
              name="dashboardUid"
              shouldUnregister
              rules={{ required: { value: true, message: 'This field is required.' } }}
            />
          );
        })()}

      {submissionError && (
        <Alert severity="error" title="Error adding the panel">
          {submissionError.message}
        </Alert>
      )}

      <Modal.ButtonRow>
        <Button type="reset" onClick={onClose} fill="outline" variant="secondary">
          {t('ablestack-wall.common.cancel', 'Cancel')}
        </Button>
        <Button
          type="submit"
          variant="secondary"
          onClick={handleSubmit(partial(onSubmit, true))}
          icon="external-link-alt"
        >
          {t('ablestack-wall.explore.open-in-new-tab', 'Open in new tab')}
        </Button>
        <Button type="submit" variant="primary" onClick={handleSubmit(partial(onSubmit, false))} icon="apps">
          {t('ablestack-wall.explore.open-dashboard', 'Open dashboard')}
        </Button>
      </Modal.ButtonRow>
    </form>
  );
}
