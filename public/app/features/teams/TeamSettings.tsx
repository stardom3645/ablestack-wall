import React, { FC } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Input, Field, Form, Button, FieldSet, VerticalGroup } from '@grafana/ui';

import { SharedPreferences } from 'app/core/components/SharedPreferences/SharedPreferences';
import { updateTeam } from './state/actions';
import { Team } from 'app/types';

const mapDispatchToProps = {
  updateTeam,
};

const connector = connect(null, mapDispatchToProps);

interface OwnProps {
  team: Team;
}
export type Props = ConnectedProps<typeof connector> & OwnProps;

export const TeamSettings: FC<Props> = ({ team, updateTeam }) => {
  return (
    <VerticalGroup>
      <FieldSet label="팀 설정">
        <Form
          defaultValues={{ ...team }}
          onSubmit={(formTeam: Team) => {
            updateTeam(formTeam.name, formTeam.email);
          }}
        >
          {({ register }) => (
            <>
              <Field label="이름">
                <Input {...register('name', { required: true })} />
              </Field>

              <Field
                label="이메일"
                description="이것은 선택 사항이며 주로 팀 프로필 아바타를 설정하는 데 사용됩니다(gravatar 서비스를 통해)."
              >
                <Input {...register('email')} placeholder="team@email.com" type="email" />
              </Field>
              <Button type="submit">수정</Button>
            </>
          )}
        </Form>
      </FieldSet>
      <SharedPreferences resourceUri={`teams/${team.id}`} />
    </VerticalGroup>
  );
};

export default connector(TeamSettings);
