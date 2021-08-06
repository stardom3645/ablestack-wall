import React, { FormEvent, PureComponent } from 'react';
import { RadioButtonGroup, Switch, Field, TextArea, ClipboardButton, Modal } from '@grafana/ui';
import { SelectableValue, AppEvents } from '@grafana/data';
import { DashboardModel, PanelModel } from 'app/features/dashboard/state';
import { appEvents } from 'app/core/core';
import { buildIframeHtml } from './utils';

const themeOptions: Array<SelectableValue<string>> = [
  { label: 'Current', value: 'current' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

interface Props {
  dashboard: DashboardModel;
  panel?: PanelModel;
}

interface State {
  useCurrentTimeRange: boolean;
  selectedTheme: string;
  iframeHtml: string;
}

export class ShareEmbed extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      useCurrentTimeRange: true,
      selectedTheme: 'current',
      iframeHtml: '',
    };
  }

  componentDidMount() {
    this.buildIframeHtml();
  }

  buildIframeHtml = () => {
    const { panel } = this.props;
    const { useCurrentTimeRange, selectedTheme } = this.state;

    const iframeHtml = buildIframeHtml(useCurrentTimeRange, selectedTheme, panel);
    this.setState({ iframeHtml });
  };

  onIframeHtmlChange = (event: FormEvent<HTMLTextAreaElement>) => {
    this.setState({ iframeHtml: event.currentTarget.value });
  };

  onUseCurrentTimeRangeChange = () => {
    this.setState(
      {
        useCurrentTimeRange: !this.state.useCurrentTimeRange,
      },
      this.buildIframeHtml
    );
  };

  onThemeChange = (value: string) => {
    this.setState({ selectedTheme: value }, this.buildIframeHtml);
  };

  onIframeHtmlCopy = () => {
    appEvents.emit(AppEvents.alertSuccess, ['Content copied to clipboard']);
  };

  getIframeHtml = () => {
    return this.state.iframeHtml;
  };

  render() {
    const { useCurrentTimeRange, selectedTheme, iframeHtml } = this.state;
    const isRelativeTime = this.props.dashboard ? this.props.dashboard.time.to === 'now' : false;

    return (
      <>
        <p className="share-modal-info-text">이 패널을 사용하여 iframe을 포함하기 위한 HTML을 생성합니다.</p>
        <Field
          label="현재 시간 범위"
          description={isRelativeTime ? '현재 상대 시간 범위를 절대 시간 범위로 변환합니다.' : ''}
        >
          <Switch
            id="share-current-time-range"
            value={useCurrentTimeRange}
            onChange={this.onUseCurrentTimeRangeChange}
          />
        </Field>
        <Field label="테마">
          <RadioButtonGroup options={themeOptions} value={selectedTheme} onChange={this.onThemeChange} />
        </Field>
        <Field
          label="HTML 끼워넣기"
          description="아래 HTML 코드를 붙여넣고 다른 웹 페이지에 포함할 수 있습니다. 익명 액세스가 활성화되지 않은 경우 해당 페이지를 보는 사용자는 그래프를 로드하려면 Wall에 로그인해야 합니다."
        >
          <TextArea rows={5} value={iframeHtml} onChange={this.onIframeHtmlChange}></TextArea>
        </Field>
        <Modal.ButtonRow>
          <ClipboardButton variant="primary" getText={this.getIframeHtml} onClipboardCopy={this.onIframeHtmlCopy}>
            클립 보드에 복사
          </ClipboardButton>
        </Modal.ButtonRow>
      </>
    );
  }
}
