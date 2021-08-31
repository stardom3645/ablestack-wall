import React, { PureComponent } from 'react';
import { Button, ClipboardButton, Icon, Spinner, Select, Input, LinkButton, Field, Modal } from '@grafana/ui';
import { AppEvents, SelectableValue } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { getTimeSrv } from 'app/features/dashboard/services/TimeSrv';
import { appEvents } from 'app/core/core';
import { VariableRefresh } from '../../../variables/types';

const snapshotApiUrl = '/api/snapshots';

const expireOptions: Array<SelectableValue<number>> = [
  { label: 'Never', value: 0 },
  { label: '1 Hour', value: 60 * 60 },
  { label: '1 Day', value: 60 * 60 * 24 },
  { label: '7 Days', value: 60 * 60 * 24 * 7 },
];

interface Props {
  dashboard: DashboardModel;
  panel?: PanelModel;
  onDismiss(): void;
}

interface State {
  isLoading: boolean;
  step: number;
  snapshotName: string;
  selectedExpireOption: SelectableValue<number>;
  snapshotExpires?: number;
  snapshotUrl: string;
  deleteUrl: string;
  timeoutSeconds: number;
  externalEnabled: boolean;
  sharingButtonText: string;
}

export class ShareSnapshot extends PureComponent<Props, State> {
  private dashboard: DashboardModel;

  constructor(props: Props) {
    super(props);
    this.dashboard = props.dashboard;
    this.state = {
      isLoading: false,
      step: 1,
      selectedExpireOption: expireOptions[0],
      snapshotExpires: expireOptions[0].value,
      snapshotName: props.dashboard.title,
      timeoutSeconds: 4,
      snapshotUrl: '',
      deleteUrl: '',
      externalEnabled: false,
      sharingButtonText: '',
    };
  }

  componentDidMount() {
    this.getSnaphotShareOptions();
  }

  async getSnaphotShareOptions() {
    const shareOptions = await getBackendSrv().get('/api/snapshot/shared-options');
    this.setState({
      sharingButtonText: shareOptions['externalSnapshotName'],
      externalEnabled: shareOptions['externalEnabled'],
    });
  }

  createSnapshot = (external?: boolean) => () => {
    const { timeoutSeconds } = this.state;
    this.dashboard.snapshot = {
      timestamp: new Date(),
    };

    if (!external) {
      this.dashboard.snapshot.originalUrl = window.location.href;
    }

    this.setState({ isLoading: true });
    this.dashboard.startRefresh();

    setTimeout(() => {
      this.saveSnapshot(this.dashboard, external);
    }, timeoutSeconds * 1000);
  };

  saveSnapshot = async (dashboard: DashboardModel, external?: boolean) => {
    const { snapshotExpires } = this.state;
    const dash = this.dashboard.getSaveModelClone();
    this.scrubDashboard(dash);

    const cmdData = {
      dashboard: dash,
      name: dash.title,
      expires: snapshotExpires,
      external: external,
    };

    try {
      const results: { deleteUrl: any; url: any } = await getBackendSrv().post(snapshotApiUrl, cmdData);
      this.setState({
        deleteUrl: results.deleteUrl,
        snapshotUrl: results.url,
        step: 2,
      });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  scrubDashboard = (dash: DashboardModel) => {
    const { panel } = this.props;
    const { snapshotName } = this.state;
    // change title
    dash.title = snapshotName;

    // make relative times absolute
    dash.time = getTimeSrv().timeRange();

    // Remove links
    dash.links = [];

    // remove panel queries & links
    dash.panels.forEach((panel) => {
      panel.targets = [];
      panel.links = [];
      panel.datasource = null;
    });

    // remove annotation queries
    const annotations = dash.annotations.list.filter((annotation) => annotation.enable);
    dash.annotations.list = annotations.map((annotation: any) => {
      return {
        name: annotation.name,
        enable: annotation.enable,
        iconColor: annotation.iconColor,
        snapshotData: annotation.snapshotData,
        type: annotation.type,
        builtIn: annotation.builtIn,
        hide: annotation.hide,
      };
    });

    // remove template queries
    dash.getVariables().forEach((variable: any) => {
      variable.query = '';
      variable.options = variable.current ? [variable.current] : [];
      variable.refresh = VariableRefresh.never;
    });

    // snapshot single panel
    if (panel) {
      const singlePanel = panel.getSaveModel();
      singlePanel.gridPos.w = 24;
      singlePanel.gridPos.x = 0;
      singlePanel.gridPos.y = 0;
      singlePanel.gridPos.h = 20;
      dash.panels = [singlePanel];
    }

    // cleanup snapshotData
    delete this.dashboard.snapshot;
    this.dashboard.forEachPanel((panel: PanelModel) => {
      delete panel.snapshotData;
    });
    this.dashboard.annotations.list.forEach((annotation) => {
      delete annotation.snapshotData;
    });
  };

  deleteSnapshot = async () => {
    const { deleteUrl } = this.state;
    await getBackendSrv().get(deleteUrl);
    this.setState({ step: 3 });
  };

  getSnapshotUrl = () => {
    return this.state.snapshotUrl;
  };

  onSnapshotNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ snapshotName: event.target.value });
  };

  onTimeoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ timeoutSeconds: Number(event.target.value) });
  };

  onExpireChange = (option: SelectableValue<number>) => {
    this.setState({
      selectedExpireOption: option,
      snapshotExpires: option.value,
    });
  };

  onSnapshotUrlCopy = () => {
    appEvents.emit(AppEvents.alertSuccess, ['Content copied to clipboard']);
  };

  renderStep1() {
    const { onDismiss } = this.props;
    const {
      snapshotName,
      selectedExpireOption,
      timeoutSeconds,
      isLoading,
      sharingButtonText,
      externalEnabled,
    } = this.state;

    return (
      <>
        <div>
          <p className="share-modal-info-text">
            스냅샷은 대화형 대시보드를 공개적으로 공유하는 즉각적인 방법입니다. 생성 시 쿼리(메트릭, 템플릿 및 주석) 및
            패널 링크와 같은 민감한 데이터를 제거하고 대시보드에 포함된 가시적인 메트릭 데이터 및 시리즈 이름만
            남깁니다.
          </p>
          <p className="share-modal-info-text">
            귀하의 스냅샷은 링크가 있고 URL에 액세스할 수 있는 <em>모든 사람이 볼</em> 수 있습니다. 현명하게
            공유하십시오.
          </p>
        </div>
        <Field label="스냅샷 이름">
          <Input width={30} value={snapshotName} onChange={this.onSnapshotNameChange} />
        </Field>
        <Field label="만료">
          <Select
            menuShouldPortal
            width={30}
            options={expireOptions}
            value={selectedExpireOption}
            onChange={this.onExpireChange}
          />
        </Field>
        <Field
          label="시간 초과(초)"
          description="대시보드 메트릭을 수집하는 데 시간이 오래 걸리는 경우 시간 초과 값을 구성해야 할 수 있습니다."
        >
          <Input type="number" width={21} value={timeoutSeconds} onChange={this.onTimeoutChange} />
        </Field>

        <Modal.ButtonRow>
          <Button variant="secondary" onClick={onDismiss} fill="outline">
            취소
          </Button>
          {externalEnabled && (
            <Button variant="secondary" disabled={isLoading} onClick={this.createSnapshot(true)}>
              {sharingButtonText}
            </Button>
          )}
          <Button variant="primary" disabled={isLoading} onClick={this.createSnapshot()}>
            로컬 스냅샷
          </Button>
        </Modal.ButtonRow>
      </>
    );
  }

  renderStep2() {
    const { snapshotUrl } = this.state;

    return (
      <>
        <div className="gf-form" style={{ marginTop: '40px' }}>
          <div className="gf-form-row">
            <a href={snapshotUrl} className="large share-modal-link" target="_blank" rel="noreferrer">
              <Icon name="external-link-alt" /> {snapshotUrl}
            </a>
            <br />
            <ClipboardButton variant="secondary" getText={this.getSnapshotUrl} onClipboardCopy={this.onSnapshotUrlCopy}>
              링크 복사
            </ClipboardButton>
          </div>
        </div>

        <div className="pull-right" style={{ padding: '5px' }}>
          실수로 만드셨습니까?{' '}
          <LinkButton fill="text" target="_blank" onClick={this.deleteSnapshot}>
            스냅샷 삭제.
          </LinkButton>
        </div>
      </>
    );
  }

  renderStep3() {
    return (
      <div className="share-modal-header">
        <p className="share-modal-info-text">
          스냅샷이 삭제되었습니다. 이미 한 번 액세스한 경우 브라우저 캐시 또는 CDN 캐시에서 제거되기까지 최대 1시간이
          소요될 수 있습니다.
        </p>
      </div>
    );
  }

  render() {
    const { isLoading, step } = this.state;

    return (
      <>
        {step === 1 && this.renderStep1()}
        {step === 2 && this.renderStep2()}
        {step === 3 && this.renderStep3()}
        {isLoading && <Spinner inline={true} />}
      </>
    );
  }
}
