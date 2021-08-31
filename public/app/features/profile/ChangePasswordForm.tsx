import React, { FC } from 'react';
import { css } from '@emotion/css';
import { Button, Field, Form, HorizontalGroup, LinkButton } from '@grafana/ui';

import config from 'app/core/config';
import { UserDTO } from 'app/types';
import { ChangePasswordFields } from './types';
import { PasswordField } from '../../core/components/PasswordField/PasswordField';

export interface Props {
  user: UserDTO;
  isSaving: boolean;
  onChangePassword: (payload: ChangePasswordFields) => void;
}

export const ChangePasswordForm: FC<Props> = ({ user, onChangePassword, isSaving }) => {
  const { ldapEnabled, authProxyEnabled, disableLoginForm } = config;
  const authSource = user.authLabels?.length && user.authLabels[0];

  if (ldapEnabled || authProxyEnabled) {
    return <p>You cannot change password when LDAP or auth proxy authentication is enabled.</p>;
  }
  if (authSource && disableLoginForm) {
    return <p>Password cannot be changed here.</p>;
  }

  return (
    <div
      className={css`
        max-width: 400px;
      `}
    >
      <Form onSubmit={onChangePassword}>
        {({ register, errors, getValues }) => {
          return (
            <>
              <Field label="기존 비밀번호" invalid={!!errors.oldPassword} error={errors?.oldPassword?.message}>
                <PasswordField
                  id="current-password"
                  autoComplete="current-password"
                  {...register('oldPassword', { required: '기존 비밀번호는 필수입니다.' })}
                />
              </Field>

              <Field label="새 비밀번호" invalid={!!errors.newPassword} error={errors?.newPassword?.message}>
                <PasswordField
                  id="new-password"
                  autoComplete="new-password"
                  {...register('newPassword', {
                    required: '새 비밀번호는 필수입니다.',
                    validate: {
                      confirm: (v) => v === getValues().confirmNew || '비밀번호가 일치해야합니다.',
                      old: (v) => v !== getValues().oldPassword || `새 비밀번호는 이전 비밀번호와 같을 수 없습니다.`,
                    },
                  })}
                />
              </Field>

              <Field label="비밀번호 확인" invalid={!!errors.confirmNew} error={errors?.confirmNew?.message}>
                <PasswordField
                  id="confirm-new-password"
                  autoComplete="new-password"
                  {...register('confirmNew', {
                    required: '새 비밀번호 확인이 필요합니다.',
                    validate: (v) => v === getValues().newPassword || '비밀번호가 일치해야합니다.',
                  })}
                />
              </Field>
              <HorizontalGroup>
                <Button variant="primary" disabled={isSaving}>
                  비밀번호 변경
                </Button>
                <LinkButton variant="secondary" href={`${config.appSubUrl}/profile`} fill="outline">
                  취소
                </LinkButton>
              </HorizontalGroup>
            </>
          );
        }}
      </Form>
    </div>
  );
};
