import { PureComponent } from 'react';
import { ConnectedProps, connect } from 'react-redux';

import SharedPreferences from 'app/core/components/SharedPreferences/SharedPreferences';
import { appEvents, contextSrv } from 'app/core/core';
import { t, Trans } from 'app/core/internationalization';
import { getNavModel } from 'app/core/selectors/navModel';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';
import { AccessControlAction, StoreState } from 'app/types';
import { ShowConfirmModalEvent } from 'app/types/events';

import OrgProfile from './OrgProfile';
import { loadOrganization, updateOrganization } from './state/actions';
import { setOrganizationName } from './state/reducers';

interface OwnProps {}

export class OrgDetailsPage extends PureComponent<Props> {
  async componentDidMount() {
    await this.props.loadOrganization();
  }

  onUpdateOrganization = async (orgName: string) => {
    this.props.setOrganizationName(orgName);
    await this.props.updateOrganization();
  };

  handleConfirm = () => {
    return new Promise<boolean>((resolve) => {
      appEvents.publish(
        new ShowConfirmModalEvent({
          title: t('ablestack-wall.administration.general.confirm-preferences-update', 'Confirm preferences update'),
          text: t(
            'ablestack-wall.administration.general.confirm-preferences-update-text',
            'This will update the preferences for the whole organization. Are you sure you want to update the preferences?'
          ),
          yesText: t('ablestack-wall.common.save', 'Save'),
          yesButtonVariant: 'primary',
          noText: t('ablestack-wall.common.cancel', 'Cancel'),
          onConfirm: async () => resolve(true),
          onDismiss: async () => resolve(false),
        })
      );
    });
  };

  render() {
    const { organization } = this.props;
    const isLoading = Object.keys(organization).length === 0;
    const canReadOrg = contextSrv.hasPermission(AccessControlAction.OrgsRead);
    const canReadPreferences = contextSrv.hasPermission(AccessControlAction.OrgsPreferencesRead);
    const canWritePreferences = contextSrv.hasPermission(AccessControlAction.OrgsPreferencesWrite);

    return (
      <WallAdminPage
        navId="org-settings"
        isLoading={isLoading}
        description="조직에 적용되는 이름, 표시 및 시간 설정을 관리합니다. 개인 설정이 지정된 항목은 개인 설정이 우선합니다."
      >
        {!isLoading && (
          <div>
            {canReadOrg && (
              <section className="wall-admin-section wall-settings-section">
                <header>
                  <h2>
                    <Trans i18nKey="wall.admin.organization-info">조직 정보</Trans>
                  </h2>
                  <p>
                    <Trans i18nKey="wall.admin.organization-name-help">현재 조직의 표시 이름을 설정합니다.</Trans>
                  </p>
                </header>
                <OrgProfile onSubmit={this.onUpdateOrganization} orgName={organization.name} />
              </section>
            )}
            {canReadPreferences && (
              <section className="wall-admin-section wall-settings-section wall-admin-preferences">
                <header>
                  <h2>
                    <Trans i18nKey="wall.admin.display-time">표시 및 시간 설정</Trans>
                  </h2>
                  <p>
                    <Trans i18nKey="wall.admin.preferences-save-help">
                      변경사항은 조직 환경 설정 저장 시 적용됩니다.
                    </Trans>
                  </p>
                </header>
                <SharedPreferences
                  wallPresentation
                  resourceUri="org"
                  disabled={!canWritePreferences}
                  preferenceType="org"
                  onConfirm={this.handleConfirm}
                />
              </section>
            )}
          </div>
        )}
      </WallAdminPage>
    );
  }
}

function mapStateToProps(state: StoreState) {
  return {
    navModel: getNavModel(state.navIndex, 'org-settings'),
    organization: state.organization.organization,
  };
}

const mapDispatchToProps = {
  loadOrganization,
  setOrganizationName,
  updateOrganization,
};

const connector = connect(mapStateToProps, mapDispatchToProps);
export type Props = OwnProps & ConnectedProps<typeof connector>;

export default connector(OrgDetailsPage);
