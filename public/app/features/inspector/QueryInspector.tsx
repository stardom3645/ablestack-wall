import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import { PureComponent } from 'react';
import { Subscription } from 'rxjs';

import { LoadingState, PanelData } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config } from '@grafana/runtime';
import { Button, ClipboardButton, JSONFormatter, LoadingPlaceholder, Stack } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { backendSrv } from 'app/core/services/backend_srv';
import { WallQueryInspection } from 'app/features/wall-modern/editor/WallQueryInspection';
import { inspectorExchange, InspectorExchange } from 'app/features/wall-modern/editor/inspectorModel';

import { getPanelInspectorStyles2 } from './styles';

interface ExecutedQueryInfo {
  refId: string;
  query: string;
  frames: number;
  rows: number;
}

interface Props {
  wall?: boolean;
  acceptResponse?: (requestId?: string) => boolean;
  instanceId?: string; // Must match the prefix of the requestId of the query being inspected. For updating only one instance of the inspector in case of multiple instances, ie Explore split view
  data: PanelData;
  onRefreshQuery: () => void;
}

interface State {
  exchanges: InspectorExchange[];
  allNodesExpanded: boolean | null;
  isMocking: boolean;
  mockedResponse: string;
  response: {};
  executedQueries: ExecutedQueryInfo[];
}

export class QueryInspector extends PureComponent<Props, State> {
  private formattedJson?: {};
  private pendingExchanges: InspectorExchange[] = [];
  private subs = new Subscription();

  constructor(props: Props) {
    super(props);
    this.state = {
      exchanges: [],
      executedQueries: [],
      allNodesExpanded: null,
      isMocking: false,
      mockedResponse: '',
      response: {},
    };
  }

  componentDidMount() {
    this.updateQueryList();
    this.subs.add(
      backendSrv.getInspectorStream().subscribe({
        next: (response) => {
          let update = true;
          if (this.props.instanceId && response?.requestId) {
            update = response.requestId.startsWith(this.props.instanceId);
          }
          if (update && this.props.wall) {
            if (!response.response.config?.hideFromInspector) {
              // Backend stream fires before PanelData receives the new request ID.
              // Buffer only masked projections; match them after the native result update.
              this.pendingExchanges = [
                ...this.pendingExchanges,
                inspectorExchange(response.response, response.requestId),
              ].slice(-32);
              this.flushExchanges();
            }
          } else if (update) {
            return this.onDataSourceResponse(response.response, response.requestId);
          }
        },
      })
    );
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.data !== oldProps.data) {
      this.updateQueryList();
      this.flushExchanges();
    }
  }

  /**
   * Find the list of executed queries
   */
  updateQueryList() {
    const { data } = this.props;
    const frames = data.series;
    const executedQueries: ExecutedQueryInfo[] = [];

    if (frames?.length) {
      let last: ExecutedQueryInfo | undefined = undefined;

      frames.forEach((frame, idx) => {
        const query = frame.meta?.executedQueryString;

        if (query) {
          const refId = frame.refId || '?';

          if (last?.refId === refId) {
            last.frames++;
            last.rows += frame.length;
          } else {
            last = {
              refId,
              frames: 1,
              rows: frame.length,
              query,
            };
            executedQueries.push(last);
          }
        }
      });
    }

    this.setState({ executedQueries });
  }

  private flushExchanges() {
    const accepted = this.pendingExchanges.filter((exchange) => this.props.acceptResponse?.(exchange.requestId));
    if (!accepted.length) {
      return;
    }
    this.pendingExchanges = [];
    this.setState(({ exchanges }) => ({
      exchanges: [
        ...exchanges.filter(
          (item) =>
            this.props.acceptResponse?.(item.requestId) && !accepted.some((next) => next.requestId === item.requestId)
        ),
        ...accepted,
      ],
    }));
  }

  componentWillUnmount() {
    this.pendingExchanges = [];
    this.subs.unsubscribe();
  }

  onDataSourceResponse(response: any, requestId?: string) {
    // ignore silent requests
    if (response.config?.hideFromInspector) {
      return;
    }

    response = cloneDeep(response); // Nested request config must never be mutated by inspection.

    if (response.headers) {
      delete response.headers;
    }

    if (response.config) {
      response.request = response.config;

      delete response.config;
      delete response.request.transformRequest;
      delete response.request.transformResponse;
      delete response.request.paramSerializer;
      delete response.request.jsonpCallbackParam;
      delete response.request.headers;
      delete response.request.requestId;
      delete response.request.inspect;
      delete response.request.retry;
      delete response.request.timeout;
    }

    if (response.data) {
      response.response = response.data;

      delete response.config;
      delete response.data;
      delete response.status;
      delete response.statusText;
      delete response.ok;
      delete response.url;
      delete response.redirected;
      delete response.type;
      delete response.$$config;
    }

    this.setState({
      response: response,
    });
  }

  setFormattedJson = (formattedJson: {}) => {
    this.formattedJson = formattedJson;
  };

  getTextForClipboard = () => {
    return JSON.stringify(this.formattedJson, null, 2);
  };

  onToggleExpand = () => {
    this.setState((prevState) => ({
      ...prevState,
      allNodesExpanded: !this.state.allNodesExpanded,
    }));
  };

  onToggleMocking = () => {
    this.setState((prevState) => ({
      ...prevState,
      isMocking: !this.state.isMocking,
    }));
  };

  getNrOfOpenNodes = () => {
    if (this.state.allNodesExpanded === null) {
      return 3; // 3 is default, ie when state is null
    } else if (this.state.allNodesExpanded) {
      return 20;
    }
    return 1;
  };

  renderExecutedQueries(executedQueries: ExecutedQueryInfo[]) {
    if (!executedQueries.length) {
      return null;
    }

    const styles = {
      refId: css`
        font-weight: ${config.theme.typography.weight.semibold};
        color: ${config.theme.colors.textBlue};
        margin-right: 8px;
      `,
    };

    return (
      <div>
        {executedQueries.map((info) => {
          return (
            <Stack key={info.refId} gap={1} direction="column">
              <div>
                <span className={styles.refId}>
                  {info.refId}
                  <Trans i18nKey="wall.query-inspector.text-05a79f06">:</Trans>
                </span>
                {info.frames > 1 && (
                  <span>
                    {info.frames}
                    <Trans i18nKey="wall.query-inspector.text-67be1f00"> frames, </Trans>
                  </span>
                )}
                <span>
                  {info.rows}
                  <Trans i18nKey="wall.query-inspector.text-6c30d261"> rows</Trans>
                </span>
              </div>
              <pre>{info.query}</pre>
            </Stack>
          );
        })}
      </div>
    );
  }

  render() {
    if (this.props.wall) {
      return (
        <WallQueryInspection
          exchanges={this.state.exchanges}
          executed={this.state.executedQueries}
          loading={this.props.data.state === LoadingState.Loading}
          onRefresh={() => {
            this.setState({ exchanges: [] });
            this.props.onRefreshQuery();
          }}
        />
      );
    }
    const { allNodesExpanded, executedQueries, response } = this.state;
    const { onRefreshQuery, data } = this.props;
    const openNodes = this.getNrOfOpenNodes();
    const styles = getPanelInspectorStyles2(config.theme2);
    const haveData = Object.keys(response).length > 0;
    const isLoading = data.state === LoadingState.Loading;

    return (
      <div className={styles.wrap}>
        <div aria-label={selectors.components.PanelInspector.Query.content}>
          <h3 className={styles.heading}>
            <Trans i18nKey="wall.query-inspector.text-f87c6468">Query inspector</Trans>
          </h3>
          <p className="small muted">
            <Trans i18nKey="inspector.query.description">
              Query inspector allows you to view raw request and response. To collect this data Grafana needs to issue a
              new query. Click refresh button below to trigger a new query.
            </Trans>
          </p>
        </div>
        {this.renderExecutedQueries(executedQueries)}
        <div className={styles.toolbar}>
          <Button
            icon="sync"
            onClick={onRefreshQuery}
            aria-label={selectors.components.PanelInspector.Query.refreshButton}
          >
            <Trans i18nKey="inspector.query.refresh">Refresh</Trans>
          </Button>

          {haveData && allNodesExpanded && (
            <Button icon="minus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              <Trans i18nKey="inspector.query.collapse-all">Collapse all</Trans>
            </Button>
          )}
          {haveData && !allNodesExpanded && (
            <Button icon="plus" variant="secondary" className={styles.toolbarItem} onClick={this.onToggleExpand}>
              <Trans i18nKey="inspector.query.expand-all">Expand all</Trans>
            </Button>
          )}

          {haveData && (
            <ClipboardButton
              getText={this.getTextForClipboard}
              className={styles.toolbarItem}
              icon="copy"
              variant="secondary"
            >
              <Trans i18nKey="inspector.query.copy-to-clipboard">Copy to clipboard</Trans>
            </ClipboardButton>
          )}
          <div className="flex-grow-1" />
        </div>
        <div className={styles.content}>
          {isLoading && <LoadingPlaceholder text="Loading query inspector..." />}
          {!isLoading && haveData && (
            <JSONFormatter json={response} open={openNodes} onDidRender={this.setFormattedJson} />
          )}
          {!isLoading && !haveData && (
            <p className="muted">
              <Trans i18nKey="inspector.query.no-data">No request and response collected yet. Hit refresh button</Trans>
            </p>
          )}
        </div>
      </div>
    );
  }
}
