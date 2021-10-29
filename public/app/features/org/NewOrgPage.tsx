import React, { FC } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import Page from 'app/core/components/Page/Page';
import { Button, Input, Field, Form } from '@grafana/ui';
import { getConfig } from 'app/core/config';
import { StoreState } from 'app/types';
import { connect } from 'react-redux';
import { NavModel } from '@grafana/data';
import { getNavModel } from '../../core/selectors/navModel';

const createOrg = async (newOrg: { name: string }) => {
  const result = await getBackendSrv().post('/api/orgs/', newOrg);

  await getBackendSrv().post('/api/user/using/' + result.orgId);
  window.location.href = getConfig().appSubUrl + '/org';
};

const validateOrg = async (orgName: string) => {
  try {
    await getBackendSrv().get(`api/orgs/name/${encodeURI(orgName)}`);
  } catch (error) {
    if (error.status === 404) {
      error.isHandled = true;
      return true;
    }
    return 'Something went wrong';
  }
  return 'Organization already exists';
};

interface PropsWithState {
  navModel: NavModel;
}

interface CreateOrgFormDTO {
  name: string;
}

export const NewOrgPage: FC<PropsWithState> = ({ navModel }) => {
  return (
    <Page navModel={navModel}>
      <Page.Contents>
        <h3 className="page-sub-heading">새 조직</h3>

        <p className="playlist-description">
          각 조직에는 조직 간에 공유할 수 없는 자체 대시보드, 데이터 원본 및 구성이 포함되어 있습니다. 사용자는 둘
          이상의 조직에 속할 수 있지만 다중 테넌트 배포에서는 여러 조직이 가장 자주 사용됩니다.{' '}
        </p>

        <Form<CreateOrgFormDTO> onSubmit={createOrg}>
          {({ register, errors }) => {
            return (
              <>
                <Field label="조직 이름" invalid={!!errors.name} error={errors.name && errors.name.message}>
                  <Input
                    placeholder="조직 이름"
                    {...register('name', {
                      required: '조직 이름은 필수입니다.',
                      validate: async (orgName) => await validateOrg(orgName),
                    })}
                  />
                </Field>
                <Button type="submit">생성</Button>
              </>
            );
          }}
        </Form>
      </Page.Contents>
    </Page>
  );
};

const mapStateToProps = (state: StoreState) => {
  return { navModel: getNavModel(state.navIndex, 'global-orgs') };
};

export default connect(mapStateToProps)(NewOrgPage);
