import { useForm } from 'react-hook-form';
import { connect, ConnectedProps } from 'react-redux';

import { Input, Field, Button, FieldSet } from '@grafana/ui';
import { TeamRolePicker } from 'app/core/components/RolePicker/TeamRolePicker';
import { useRoleOptions } from 'app/core/components/RolePicker/hooks';
import { SharedPreferences } from 'app/core/components/SharedPreferences/SharedPreferences';
import { t, Trans } from 'app/core/internationalization';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction, Team } from 'app/types';

import { updateTeam } from './state/actions';

const mapDispatchToProps = {
  updateTeam,
};

const connector = connect(null, mapDispatchToProps);

interface OwnProps {
  team: Team;
}
export type Props = ConnectedProps<typeof connector> & OwnProps;

export const TeamSettings = ({ team, updateTeam }: Props) => {
  const canWriteTeamSettings = contextSrv.hasPermissionInMetadata(AccessControlAction.ActionTeamsWrite, team);
  const currentOrgId = contextSrv.user.orgId;

  const [{ roleOptions }] = useRoleOptions(currentOrgId);
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<Team>({ defaultValues: team });

  const canUpdateRoles =
    contextSrv.hasPermission(AccessControlAction.ActionTeamsRolesAdd) &&
    contextSrv.hasPermission(AccessControlAction.ActionTeamsRolesRemove);

  const canListRoles =
    contextSrv.hasPermissionInMetadata(AccessControlAction.ActionTeamsRolesList, team) &&
    contextSrv.hasPermission(AccessControlAction.ActionRolesList);

  const onSubmit = async (formTeam: Team) => {
    updateTeam(formTeam.name, formTeam.email || '');
  };

  return (
    <div>
      <section className="wall-admin-section wall-settings-section">
        <header>
          <h2>
            <Trans i18nKey="wall.enterprise.text-38dbe853">팀 정보</Trans>
          </h2>
          <p>
            <Trans i18nKey="wall.enterprise.text-fa8704c0">팀의 표시 이름과 이메일을 관리합니다.</Trans>
          </p>
        </header>
        <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
          <FieldSet label={t('ablestack-wall.administration.service-and-access.team-details', 'Team details')}>
            <Field
              label={t('ablestack-wall.common.name', 'Name')}
              disabled={!canWriteTeamSettings}
              required
              invalid={!!errors.name}
              error="Name is required"
            >
              <Input {...register('name', { required: true })} id="name-input" />
            </Field>

            {contextSrv.licensedAccessControlEnabled() && canListRoles && (
              <Field label="Role">
                <TeamRolePicker teamId={team.id} roleOptions={roleOptions} disabled={!canUpdateRoles} maxWidth="100%" />
              </Field>
            )}

            <Field
              label={t('ablestack-wall.common.email', 'Email')}
              description={t(
                'ablestack-wall.administration.service-and-access.team-email-description-gravatar',
                'This is optional and is primarily used to set the team profile avatar (via gravatar service).'
              )}
              disabled={!canWriteTeamSettings}
            >
              <Input {...register('email')} placeholder="team@email.com" type="email" id="email-input" />
            </Field>
            <Button type="submit" disabled={!canWriteTeamSettings}>
              {t('ablestack-wall.common.update', 'Update')}
            </Button>
          </FieldSet>
        </form>
      </section>
      <section className="wall-admin-section wall-settings-section wall-admin-preferences">
        <header>
          <h2>
            <Trans i18nKey="wall.enterprise.text-3de7052a">표시 및 시간 설정</Trans>
          </h2>
          <p>
            <Trans i18nKey="wall.enterprise.text-75cebfe6">
              이 팀의 기본 환경 설정입니다. 개인 설정이 지정된 항목은 개인 설정이 우선합니다.
            </Trans>
          </p>
        </header>
        <SharedPreferences
          wallPresentation
          resourceUri={`teams/${team.id}`}
          disabled={!canWriteTeamSettings}
          preferenceType="team"
        />
      </section>
    </div>
  );
};

export default connector(TeamSettings);
