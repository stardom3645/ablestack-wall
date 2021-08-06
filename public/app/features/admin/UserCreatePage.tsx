import React, { useCallback } from 'react';
import { hot } from 'react-hot-loader';
import { connect } from 'react-redux';
import { Form, Button, Input, Field } from '@grafana/ui';
import { NavModel } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { StoreState } from '../../types';
import { getNavModel } from '../../core/selectors/navModel';
import Page from 'app/core/components/Page/Page';
import { useHistory } from 'react-router-dom';

interface UserCreatePageProps {
  navModel: NavModel;
}
interface UserDTO {
  name: string;
  password: string;
  email?: string;
  login?: string;
}

const createUser = async (user: UserDTO) => getBackendSrv().post('/api/admin/users', user);

const UserCreatePage: React.FC<UserCreatePageProps> = ({ navModel }) => {
  const history = useHistory();

  const onSubmit = useCallback(
    async (data: UserDTO) => {
      await createUser(data);
      history.push('/admin/users');
    },
    [history]
  );

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h1>새 사용자 추가</h1>
        <Form onSubmit={onSubmit} validateOn="onBlur">
          {({ register, errors }) => {
            return (
              <>
                <Field
                  label="이름"
                  required
                  invalid={!!errors.name}
                  error={errors.name ? '이름은 필수입니다.' : undefined}
                >
                  <Input {...register('name', { required: true })} />
                </Field>

                <Field label="이메일">
                  <Input {...register('email')} />
                </Field>

                <Field label="사용자명">
                  <Input {...register('login')} />
                </Field>
                <Field
                  label="비밀번호"
                  required
                  invalid={!!errors.password}
                  error={errors.password ? '비밀번호는 필수이며 4자 이상이어야 합니다.' : undefined}
                >
                  <Input
                    {...register('password', {
                      validate: (value) => value.trim() !== '' && value.length >= 4,
                    })}
                    type="password"
                  />
                </Field>
                <Button type="submit">사용자 생성</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'global-users'),
});

export default hot(module)(connect(mapStateToProps)(UserCreatePage));
