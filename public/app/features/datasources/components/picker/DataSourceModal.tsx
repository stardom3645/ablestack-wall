import { once } from 'lodash';
import { Check, Database, Layers, LayoutDashboard } from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { DataSourceInstanceSettings, DataSourceRef } from '@grafana/data';
import { config, reportInteraction } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { Modal, FileDropzone, FileDropzoneDefaultChildren, LinkButton, Input, Icon } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { Trans, t } from 'app/core/internationalization';
import * as DFImport from 'app/features/dataframe-import';
import { Button } from 'app/features/wall-modern/ui';
import { GrafanaQuery } from 'app/plugins/datasource/grafana/types';
import { getFileDropToQueryHandler } from 'app/plugins/datasource/grafana/utils';
import { AccessControlAction } from 'app/types';

import { PanelScrollArea } from '../../../../../../packages/grafana-ui/src/components/PanelScrollArea/PanelScrollArea';
import { useDatasource, useDatasources, useRecentlyUsedDataSources } from '../../hooks';

import { AddNewDataSourceButton } from './AddNewDataSourceButton';
import { sourcePresentation } from './sourcePresentation';
import { getDataSourceCompareFn, isDataSourceMatch, matchDataSourceWithSearch } from './utils';

import '../dataSources.css';

const INTERACTION_EVENT_NAME = 'dashboards_dspickermodal_clicked';
const INTERACTION_ITEM = {
  SELECT_DS: 'select_ds',
  UPLOAD_FILE: 'upload_file',
  CONFIG_NEW_DS: 'config_new_ds',
  CONFIG_NEW_DS_EMPTY_STATE: 'config_new_ds_empty_state',
  SEARCH: 'search',
  DISMISS: 'dismiss',
};

export interface DataSourceModalProps {
  onChange: (ds: DataSourceInstanceSettings, defaultQueries?: DataQuery[] | GrafanaQuery[]) => void;
  current: DataSourceRef | string | null | undefined;
  onDismiss: () => void;
  recentlyUsed?: string[];
  reportedInteractionFrom?: string;

  // DS filters
  filter?: (ds: DataSourceInstanceSettings) => boolean;
  tracing?: boolean;
  mixed?: boolean;
  dashboard?: boolean;
  metrics?: boolean;
  type?: string | string[];
  annotations?: boolean;
  variables?: boolean;
  alerting?: boolean;
  pluginId?: string;
  logs?: boolean;
  uploadFile?: boolean;
}

export function DataSourceModal({
  tracing,
  dashboard,
  mixed,
  metrics,
  type,
  annotations,
  variables,
  alerting,
  pluginId,
  logs,
  uploadFile,
  filter,
  onChange,
  current,
  onDismiss,
  reportedInteractionFrom,
}: DataSourceModalProps) {
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const sources = useDatasources({
    tracing,
    dashboard,
    mixed,
    metrics,
    type,
    annotations,
    variables,
    alerting,
    pluginId,
    logs,
  });
  const [recent, remember] = useRecentlyUsedDataSources();
  const visible = sources
    .filter((ds) => (!filter || filter(ds)) && matchDataSourceWithSearch(ds, search))
    .sort(getDataSourceCompareFn(current, recent, []));
  const groups = [
    { title: '연결된 데이터 소스', sources: visible.filter((ds) => !ds.meta.builtIn) },
    { title: '다른 데이터 사용 방식', sources: visible.filter((ds) => ds.meta.builtIn) },
  ];
  const canManage = contextSrv.hasPermission(AccessControlAction.DataSourcesRead);
  // Native buttons own Enter/Space/Tab. Arrow keys traverse one list, including both groups.
  const navigate = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-source-choice]') || []);
    const index = buttons.findIndex((button) => button === document.activeElement);
    if (index < 0 && !['ArrowDown', 'ArrowUp'].includes(event.key)) {
      return;
    }
    if (!buttons.length) {
      return;
    }
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : index < 0
            ? event.key === 'ArrowDown'
              ? 0
              : buttons.length - 1
            : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].scrollIntoView({ block: 'nearest' });
  };
  const analyticsInteractionSrc = reportedInteractionFrom || 'modal';

  const onDismissModal = () => {
    onDismiss();
    reportInteraction(INTERACTION_EVENT_NAME, { item: INTERACTION_ITEM.DISMISS, src: analyticsInteractionSrc });
  };
  const onChangeDataSource = (ds: DataSourceInstanceSettings) => {
    remember(ds);
    onChange(ds);
    reportInteraction(INTERACTION_EVENT_NAME, {
      item: INTERACTION_ITEM.SELECT_DS,
      ds_type: ds.type,
      src: analyticsInteractionSrc,
    });
  };
  // Memoizing to keep once() cached so it avoids reporting multiple times
  const reportSearchUsageOnce = useMemo(
    () =>
      once(() => {
        reportInteraction(INTERACTION_EVENT_NAME, { item: 'search', src: analyticsInteractionSrc });
      }),
    [analyticsInteractionSrc]
  );

  const grafanaDS = useDatasource('-- Grafana --');

  const onFileDrop = getFileDropToQueryHandler((query, fileRejections) => {
    if (!grafanaDS) {
      return;
    }
    onChange(grafanaDS, [query]);

    reportInteraction(INTERACTION_EVENT_NAME, {
      item: INTERACTION_ITEM.UPLOAD_FILE,
      src: analyticsInteractionSrc,
    });

    if (fileRejections.length < 1) {
      onDismiss();
    }
  });

  return (
    <Modal
      title={t('data-source-picker.modal.title', 'Select data source')}
      closeOnEscape={true}
      closeOnBackdropClick={true}
      isOpen={true}
      className="wall-datasource-modal"
      contentClassName="wall-datasource-modal-content"
      onClickBackdrop={onDismissModal}
      onDismiss={onDismissModal}
    >
      <div className="wall-datasource-picker">
        <Input
          type="search"
          onKeyDown={navigate}
          autoFocus
          aria-label="데이터 소스 검색"
          value={search}
          prefix={<Icon name="search" />}
          placeholder="이름 또는 유형으로 검색"
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            reportSearchUsageOnce();
          }}
        />
        <PanelScrollArea className="wall-datasource-choices" tabIndex={-1} aria-label="데이터 소스 목록">
          <div ref={listRef}>
            {groups
              .filter((group) => group.sources.length)
              .map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h3 className="wall-datasource-group-title">
                    {group.title}
                    <span>{group.sources.length}</span>
                  </h3>
                  {group.sources.map((ds) => {
                    const item = sourcePresentation(ds);
                    const selected = isDataSourceMatch(ds, current);
                    const SpecialIcon =
                      item.icon === 'mixed' ? Layers : item.icon === 'dashboard' ? LayoutDashboard : Database;
                    return (
                      <Button
                        key={ds.uid}
                        variant="ghost"
                        className="wall-datasource-choice"
                        data-source-choice={ds.uid}
                        onKeyDown={navigate}
                        aria-pressed={selected}
                        onClick={() => onChangeDataSource(ds)}
                      >
                        <span className="wall-datasource-logo">
                          {item.icon ? (
                            <SpecialIcon size={22} aria-hidden="true" />
                          ) : (
                            <img src={ds.meta.info.logos.small} alt="" />
                          )}
                        </span>
                        <span className="wall-datasource-identity">
                          <span className="wall-datasource-name" title={item.name}>
                            {item.name}
                          </span>
                          <span className="wall-datasource-type" title={item.detail}>
                            {item.detail}
                          </span>
                        </span>
                        {ds.isDefault && (
                          <span className="wall-datasource-default">
                            <Trans i18nKey="wall.data-source-modal.text-7f1d8c41">기본</Trans>
                          </span>
                        )}
                        <span className="wall-datasource-selected">
                          {selected && (
                            <>
                              <Check size={16} aria-hidden="true" />
                              <span className="sr-only">
                                <Trans i18nKey="wall.data-source-modal.text-c7cad5ad">선택됨</Trans>
                              </span>
                            </>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </section>
              ))}
            {!visible.length && (
              <p className="wall-datasource-empty" role="status">
                <Trans i18nKey="wall.data-source-modal.text-300d3cac">검색 결과가 없습니다.</Trans>
              </p>
            )}
          </div>
          {uploadFile && config.featureToggles.editPanelCSVDragAndDrop && (
            <FileDropzone
              readAs="readAsArrayBuffer"
              fileListRenderer={() => undefined}
              options={{
                maxSize: DFImport.maxFileSize,
                multiple: false,
                accept: DFImport.acceptedFiles,
                onDrop: onFileDrop,
              }}
            >
              <FileDropzoneDefaultChildren />
            </FileDropzone>
          )}
        </PanelScrollArea>
        <footer className="wall-datasource-picker-footer">
          {canManage && (
            <LinkButton
              href={config.appSubUrl + '/connections/datasources'}
              variant="secondary"
              fill="text"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Trans i18nKey="wall.data-source-modal.text-70a7b6bd">데이터 소스 관리</Trans>
            </LinkButton>
          )}
          <AddNewDataSourceButton
            variant="secondary"
            onClick={() => {
              reportInteraction(INTERACTION_EVENT_NAME, {
                item: INTERACTION_ITEM.CONFIG_NEW_DS,
                src: analyticsInteractionSrc,
              });
              onDismiss();
            }}
          />
        </footer>
      </div>
    </Modal>
  );
}
