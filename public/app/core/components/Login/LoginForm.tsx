import React, { FC, ReactElement } from 'react';
import { selectors } from '@grafana/e2e-selectors';

import { FormModel } from './LoginCtrl';
import { Button, Form, Input, Field } from '@grafana/ui';
import { css } from '@emotion/css';
import { PasswordField } from '../PasswordField/PasswordField';

interface Props {
  children: ReactElement;
  onSubmit: (data: FormModel) => void;
  isLoggingIn: boolean;
  passwordHint: string;
  loginHint: string;
}

const wrapperStyles = css`
  width: 100%;
  padding-bottom: 16px;
`;

export const submitButton = css`
  justify-content: center;
  width: 100%;
`;

export const LoginForm: FC<Props> = ({ children, onSubmit, isLoggingIn, passwordHint, loginHint }) => {
  return (
    <div className={wrapperStyles}>
      <Form onSubmit={onSubmit} validateOn="onChange">
        {({ register, errors }) => (
          <>
            <Field label="이메일 또는 사용자 이름" invalid={!!errors.user} error={errors.user?.message}>
              <Input
                {...register('user', { required: '이메일 또는 사용자 이름은 필수입니다.' })}
                autoFocus
                autoCapitalize="none"
                placeholder={loginHint}
                aria-label={selectors.pages.Login.username}
              />
            </Field>
            <Field label="비밀번호" invalid={!!errors.password} error={errors.password?.message}>
              <PasswordField
                id="current-password"
                autoComplete="current-password"
                passwordHint={passwordHint}
                {...register('password', { required: '비밀번호는 필수입니다.' })}
              />
            </Field>
            <Button aria-label={selectors.pages.Login.submit} className={submitButton} disabled={isLoggingIn}>
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </Button>
            {children}
          </>
        )}
      </Form>
    </div>
  );
};
