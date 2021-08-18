import React, { FC } from 'react';
import { Button, Field, FieldSet, Form, Icon, Input, Tooltip } from '@grafana/ui';
import { UserDTO } from 'app/types';
import config from 'app/core/config';
import { ProfileUpdateFields } from './types';

export interface Props {
  user: UserDTO | null;
  isSavingUser: boolean;
  updateProfile: (payload: ProfileUpdateFields) => void;
}

const { disableLoginForm } = config;

export const UserProfileEditForm: FC<Props> = ({ user, isSavingUser, updateProfile }) => {
  const onSubmitProfileUpdate = (data: ProfileUpdateFields) => {
    updateProfile(data);
  };

  return (
    <Form onSubmit={onSubmitProfileUpdate} validateOn="onBlur">
      {({ register, errors }) => {
        return (
          <FieldSet label="프로필 편집">
            <Field label="이름" invalid={!!errors.name} error="이름은 필수입니다." disabled={disableLoginForm}>
              <Input
                {...register('name', { required: true })}
                id="edit-user-profile-name"
                placeholder="이름"
                defaultValue={user?.name ?? ''}
                suffix={<InputSuffix />}
              />
            </Field>
            <Field label="이메일" invalid={!!errors.email} error="이메일은 필수입니다." disabled={disableLoginForm}>
              <Input
                {...register('email', { required: true })}
                id="edit-user-profile-email"
                placeholder="Email"
                defaultValue={user?.email ?? ''}
                suffix={<InputSuffix />}
              />
            </Field>
            <Field label="사용자 이름" disabled={disableLoginForm}>
              <Input
                {...register('login')}
                id="edit-user-profile-username"
                defaultValue={user?.login ?? ''}
                placeholder="사용자 이름"
                suffix={<InputSuffix />}
              />
            </Field>
            <div className="gf-form-button-row">
              <Button variant="primary" disabled={isSavingUser} aria-label="Edit user profile save button">
                저장
              </Button>
            </div>
          </FieldSet>
        );
      }}
    </Form>
  );
};

export default UserProfileEditForm;

const InputSuffix: FC = () => {
  return disableLoginForm ? (
    <Tooltip content="Login details locked because they are managed in another system.">
      <Icon name="lock" />
    </Tooltip>
  ) : null;
};
