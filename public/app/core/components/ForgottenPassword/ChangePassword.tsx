import { SyntheticEvent, useState } from 'react';
import { useForm } from 'react-hook-form';

import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import { Tooltip, Field, Button, Alert, useStyles2, Stack } from '@grafana/ui';
import { t } from 'app/core/internationalization';

import { getStyles } from '../Login/LoginForm';
import { PasswordField } from '../PasswordField/PasswordField';
import {
  ValidationLabels,
  strongPasswordValidations,
  strongPasswordValidationRegister,
} from '../ValidationLabels/ValidationLabels';

interface Props {
  onSubmit: (pw: string) => void;
  onSkip?: (event?: SyntheticEvent) => void;
  showDefaultPasswordWarning?: boolean;
}

interface PasswordDTO {
  newPassword: string;
  confirmNew: string;
}

export const ChangePassword = ({ onSubmit, onSkip, showDefaultPasswordWarning }: Props) => {
  const styles = useStyles2(getStyles);
  const [displayValidationLabels, setDisplayValidationLabels] = useState(false);
  const [pristine, setPristine] = useState(true);

  const {
    handleSubmit,
    register,
    getValues,
    formState: { errors },
    watch,
  } = useForm<PasswordDTO>({
    defaultValues: {
      newPassword: '',
      confirmNew: '',
    },
  });

  const newPassword = watch('newPassword');
  const submit = (passwords: PasswordDTO) => {
    onSubmit(passwords.newPassword);
  };
  return (
    <form onSubmit={handleSubmit(submit)}>
      {showDefaultPasswordWarning && (
        <Alert severity="info" title={t("ablestack-wall.login.continuing-password-exposes", "Continuing to use the default password exposes you to security risks.")} />
      )}
      <Field label={t("ablestack-wall.login.new-password", "New password")} invalid={!!errors.newPassword} error={errors?.newPassword?.message}>
        <PasswordField
          onFocus={() => setDisplayValidationLabels(true)}
          {...register('newPassword', {
            required: 'New Password is required',
            onBlur: () => setPristine(false),
            validate: { strongPasswordValidationRegister },
          })}
          id="new-password"
          autoFocus
          autoComplete="new-password"
        />
      </Field>
      {displayValidationLabels && (
        <ValidationLabels
          pristine={pristine}
          password={newPassword}
          strongPasswordValidations={strongPasswordValidations}
        />
      )}
      <Field label={t("ablestack-wall.login.confirm-new-password", "Confirm new password")} invalid={!!errors.confirmNew} error={errors?.confirmNew?.message}>
        <PasswordField
          {...register('confirmNew', {
            required: 'Confirmed Password is required',
            validate: (v: string) => v === getValues().newPassword || 'Passwords must match!',
          })}
          id="confirm-new-password"
          autoComplete="new-password"
        />
      </Field>
      <Stack direction="column">
        <Button type="submit" className={styles.submitButton}>
          {t("ablestack-wall.common.submit", "Submit")}
        </Button>

        {!config.auth.basicAuthStrongPasswordPolicy && onSkip && (
          <Tooltip
            content={t("ablestack-wall.login.if-you-skip", "If you skip you will be prompted to change password next time you log in.")}
            placement="bottom"
          >
            <Button
              className={styles.skipButton}
              fill="text"
              onClick={onSkip}
              type="button"
              data-testid={selectors.pages.Login.skip}
            >
              {t("ablestack-wall.common.skip", "Skip")}
            </Button>
          </Tooltip>
        )}
      </Stack>
    </form>
  );
};
