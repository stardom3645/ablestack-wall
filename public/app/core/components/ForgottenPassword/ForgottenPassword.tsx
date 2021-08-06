import React, { FC, useState } from 'react';
import { Form, Field, Input, Button, Legend, Container, useStyles, HorizontalGroup, LinkButton } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { css } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import config from 'app/core/config';

interface EmailDTO {
  userOrEmail: string;
}

const paragraphStyles = (theme: GrafanaTheme) => css`
  color: ${theme.colors.formDescription};
  font-size: ${theme.typography.size.sm};
  font-weight: ${theme.typography.weight.regular};
  margin-top: ${theme.spacing.sm};
  display: block;
`;

export const ForgottenPassword: FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  const styles = useStyles(paragraphStyles);
  const loginHref = `${config.appSubUrl}/login`;

  const sendEmail = async (formModel: EmailDTO) => {
    const res = await getBackendSrv().post('/api/user/password/send-reset-email', formModel);
    if (res) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <div>
        <p>설정하신 이메일로 메일을 새로운 비밀번호를 발송하였습니다.</p>
        <Container margin="md" />
        <LinkButton variant="primary" href={loginHref}>
          돌아가기
        </LinkButton>
      </div>
    );
  }
  return (
    <Form onSubmit={sendEmail}>
      {({ register, errors }) => (
        <>
          <Legend>새 비밀번호</Legend>
          <Field
            label="사용자"
            description="새로운 비밀번호를 받을 이메일 또는 사용자 이름 정보를 입력해주세요."
            invalid={!!errors.userOrEmail}
            error={errors?.userOrEmail?.message}
          >
            <Input
              id="user-input"
              placeholder="이메일 또는 사용자 이름"
              {...register('userOrEmail', { required: '이메일 또는 사용자 이름은 필수입니다.' })}
            />
          </Field>
          <HorizontalGroup>
            <Button>이메일 보내기</Button>
            <LinkButton fill="text" href={loginHref}>
              돌아가기
            </LinkButton>
          </HorizontalGroup>

          <p className={styles}>이메일 또는 사용자 이름을 잃어버렸다면, ABLESTACK Wall 관리자에게 문의하기 바랍니다.</p>
        </>
      )}
    </Form>
  );
};
