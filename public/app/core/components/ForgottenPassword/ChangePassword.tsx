import React, { FC, SyntheticEvent } from 'react';
import { Tooltip, Form, Field, VerticalGroup, Button } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';
import { submitButton } from '../Login/LoginForm';
import { PasswordField } from '../PasswordField/PasswordField';
interface Props {
  onSubmit: (pw: string) => void;
  onSkip?: (event?: SyntheticEvent) => void;
}

interface PasswordDTO {
  newPassword: string;
  confirmNew: string;
}

export const ChangePassword: FC<Props> = ({ onSubmit, onSkip }) => {
  const submit = (passwords: PasswordDTO) => {
    onSubmit(passwords.newPassword);
  };
  return (
    <Form onSubmit={submit}>
      {({ errors, register, getValues }) => (
        <>
          <Field label="새 비밀번호" invalid={!!errors.newPassword} error={errors?.newPassword?.message}>
            <PasswordField
              id="new-password"
              autoFocus
              autoComplete="new-password"
              {...register('newPassword', { required: '새 비밀번호는 필수입니다.' })}
            />
          </Field>
          <Field label="새 비밀번호 확인" invalid={!!errors.confirmNew} error={errors?.confirmNew?.message}>
            <PasswordField
              id="confirm-new-password"
              autoComplete="new-password"
              {...register('confirmNew', {
                required: '새 비밀번호 확인은 필수입니다.',
                validate: (v: string) => v === getValues().newPassword || '패스워드가 일치하지 않습니다.',
              })}
            />
          </Field>
          <VerticalGroup>
            <Button type="submit" className={submitButton}>
              승인
            </Button>

            {onSkip && (
              <Tooltip
                content="건너뛰면, 다음에 로그인할 때 비밀번호를 변경하라는 메시지가 표시됩니다."
                placement="bottom"
              >
                <Button fill="text" onClick={onSkip} type="button" aria-label={selectors.pages.Login.skip}>
                  Skip
                </Button>
              </Tooltip>
            )}
          </VerticalGroup>
        </>
      )}
    </Form>
  );
};
