import React, { PureComponent } from 'react';
import { selectors as e2eSelectors } from '@grafana/e2e-selectors';
import { Alert, ClipboardButton, Field, FieldSet, Icon, Input, RadioButtonGroup, Switch } from '@grafana/ui';
import { AppEvents, SelectableValue } from '@grafana/data';
import { buildImageUrl, buildShareUrl } from './utils';
import { appEvents } from 'app/core/core';
import config from 'app/core/config';
import { ShareModalTabProps } from './types';

const themeOptions: Array<SelectableValue<string>> = [
  { label: 'Current', value: 'current' },
  { label: 'Dark', value: 'dark' },
  { label: 'Light', value: 'light' },
];

export interface Props extends ShareModalTabProps {}

export interface State {
  useCurrentTimeRange: boolean;
  useShortUrl: boolean;
  selectedTheme: string;
  shareUrl: string;
  imageUrl: string;
}

export class ShareLink extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      useCurrentTimeRange: true,
      useShortUrl: false,
      selectedTheme: 'current',
      shareUrl: '',
      imageUrl: '',
    };
  }

  componentDidMount() {
    this.buildUrl();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { useCurrentTimeRange, useShortUrl, selectedTheme } = this.state;
    if (
      prevState.useCurrentTimeRange !== useCurrentTimeRange ||
      prevState.selectedTheme !== selectedTheme ||
      prevState.useShortUrl !== useShortUrl
    ) {
      this.buildUrl();
    }
  }

  buildUrl = async () => {
    const { panel } = this.props;
    const { useCurrentTimeRange, useShortUrl, selectedTheme } = this.state;

    const shareUrl = await buildShareUrl(useCurrentTimeRange, selectedTheme, panel, useShortUrl);
    const imageUrl = buildImageUrl(useCurrentTimeRange, selectedTheme, panel);

    this.setState({ shareUrl, imageUrl });
  };

  onUseCurrentTimeRangeChange = () => {
    this.setState({ useCurrentTimeRange: !this.state.useCurrentTimeRange });
  };

  onUrlShorten = () => {
    this.setState({ useShortUrl: !this.state.useShortUrl });
  };

  onThemeChange = (value: string) => {
    this.setState({ selectedTheme: value });
  };

  onShareUrlCopy = () => {
    appEvents.emit(AppEvents.alertSuccess, ['Content copied to clipboard']);
  };

  getShareUrl = () => {
    return this.state.shareUrl;
  };

  render() {
    const { panel } = this.props;
    const isRelativeTime = this.props.dashboard ? this.props.dashboard.time.to === 'now' : false;
    const { useCurrentTimeRange, useShortUrl, selectedTheme, shareUrl, imageUrl } = this.state;
    const selectors = e2eSelectors.pages.SharePanelModal;

    return (
      <>
        <p className="share-modal-info-text">
          아래 옵션으로 사용자 정의된 이 대시보드 또는 패널에 대한 직접 링크를 만드십시오.
        </p>
        <FieldSet>
          <Field
            label="잠금 시간 범위"
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
          <Field label="단축 URL">
            <Switch id="share-shorten-url" value={useShortUrl} onChange={this.onUrlShorten} />
          </Field>

          <Field label="링크 URL">
            <Input
              id="link-url-input"
              value={shareUrl}
              readOnly
              addonAfter={
                <ClipboardButton variant="primary" getText={this.getShareUrl} onClipboardCopy={this.onShareUrlCopy}>
                  <Icon name="copy" /> 복사
                </ClipboardButton>
              }
            />
          </Field>
        </FieldSet>
        {panel && config.rendererAvailable && (
          <div className="gf-form">
            <a href={imageUrl} target="_blank" rel="noreferrer" aria-label={selectors.linkToRenderedImage}>
              <Icon name="camera" /> Direct link rendered image
            </a>
          </div>
        )}
        {panel && !config.rendererAvailable && (
          <Alert severity="info" title="이미지 렌더러 플러그인이 설치되지 않았습니다." bottomSpacing={0}>
            <>패널 이미지를 렌더링하려면 다음을 설치해야 합니다. </>
            <a
              href="https://grafana.com/grafana/plugins/grafana-image-renderer"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              Wall 이미지 렌더러 플러그인
            </a>
            . 플러그인을 설치하려면 Wall 관리자에게 문의하십시오.
          </Alert>
        )}
      </>
    );
  }
}
