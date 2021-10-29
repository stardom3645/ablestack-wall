import React from 'react';
import { connect } from 'react-redux';
import { getBackendSrv } from '@grafana/runtime';
import { NavModel } from '@grafana/data';

import { StoreState } from 'app/types';
import { getNavModel } from 'app/core/selectors/navModel';
import Page from 'app/core/components/Page/Page';

type Settings = { [key: string]: { [key: string]: string } };

interface Props {
  navModel: NavModel;
}

interface State {
  settings: Settings;
  isLoading: boolean;
}

export class AdminSettings extends React.PureComponent<Props, State> {
  state: State = {
    settings: {},
    isLoading: true,
  };

  async componentDidMount() {
    const settings: Settings = await getBackendSrv().get('/api/admin/settings');
    this.setState({
      settings,
      isLoading: false,
    });
  }

  render() {
    const { settings, isLoading } = this.state;
    const { navModel } = this.props;

    return (
      <Page navModel={navModel}>
        <Page.Contents isLoading={isLoading}>
          <div className="grafana-info-box span8" style={{ margin: '20px 0 25px 0' }}>
            이러한 시스템 설정은 defaultsini에 정의되어 있습니다. 이를 변경하려면 Wall 서비스를 다시 시작해야 합니다.
          </div>

          <table className="filter-table">
            <tbody>
              {Object.entries(settings).map(([sectionName, sectionSettings], i) => (
                <React.Fragment key={`section-${i}`}>
                  <tr>
                    <td className="admin-settings-section">{sectionName}</td>
                    <td />
                  </tr>
                  {Object.entries(sectionSettings).map(([settingName, settingValue], j) => (
                    <tr key={`property-${j}`}>
                      <td style={{ paddingLeft: '25px' }}>{settingName}</td>
                      <td style={{ whiteSpace: 'break-spaces' }}>{settingValue}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Page.Contents>
      </Page>
    );
  }
}

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'server-settings'),
});

export default connect(mapStateToProps)(AdminSettings);
