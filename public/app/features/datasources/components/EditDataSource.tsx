import { AnyAction } from '@reduxjs/toolkit';
import { omit } from 'lodash';
import { useMemo, useRef, useState } from 'react';
import * as React from 'react';

import {
  DataSourcePluginContextProvider,
  DataSourcePluginMeta,
  DataSourceSettings as DataSourceSettingsType,
  PluginExtensionPoints,
  PluginExtensionDataSourceConfigContext,
  DataSourceJsonData,
  DataSourceUpdatedSuccessfully,
} from '@grafana/data';
import { getDataSourceSrv, usePluginComponentExtensions } from '@grafana/runtime';
import appEvents from 'app/core/app_events';
import PageLoader from 'app/core/components/PageLoader/PageLoader';
import { Trans } from 'app/core/internationalization';
import { DataSourceSettingsState, useDispatch } from 'app/types';

import { PanelScrollArea } from '../../../../../packages/grafana-ui/src/components/PanelScrollArea/PanelScrollArea';
import {
  dataSourceLoaded,
  setDataSourceName,
  setIsDefault,
  useDataSource,
  useDataSourceExploreUrl,
  useDataSourceMeta,
  useDataSourceRights,
  useDataSourceSettings,
  useDeleteLoadedDataSource,
  useInitDataSourceSettings,
  useTestDataSource,
  useUpdateDatasource,
} from '../state';
import { trackDsConfigClicked, trackDsConfigUpdated } from '../tracking';
import { DataSourceRights } from '../types';

import { BasicSettings } from './BasicSettings';
import { ButtonRow } from './ButtonRow';
import { CloudInfoBox } from './CloudInfoBox';
import { DataSourceLoadError } from './DataSourceLoadError';
import { DataSourceMissingRightsMessage } from './DataSourceMissingRightsMessage';
import { DataSourcePluginConfigPage } from './DataSourcePluginConfigPage';
import { DataSourcePluginSettings } from './DataSourcePluginSettings';
import { DataSourcePluginState } from './DataSourcePluginState';
import { DataSourceReadOnlyMessage } from './DataSourceReadOnlyMessage';
import { DataSourceTestingStatus } from './DataSourceTestingStatus';

import './dataSources.css';

export type Props = {
  // The ID of the data source
  uid: string;
  // The ID of the custom datasource setting page
  pageId?: string | null;
};

export function EditDataSource({ uid, pageId }: Props) {
  useInitDataSourceSettings(uid);

  const dispatch = useDispatch();
  const dataSource = useDataSource(uid);
  const dataSourceMeta = useDataSourceMeta(dataSource.type);
  const dataSourceSettings = useDataSourceSettings();
  const dataSourceRights = useDataSourceRights(uid);
  const exploreUrl = useDataSourceExploreUrl(uid);
  const onDelete = useDeleteLoadedDataSource();
  const onTest = useTestDataSource(uid);
  const onUpdate = useUpdateDatasource();
  const onDefaultChange = (value: boolean) => dispatch(setIsDefault(value));
  const onNameChange = (name: string) => dispatch(setDataSourceName(name));
  const onOptionsChange = (ds: DataSourceSettingsType) => dispatch(dataSourceLoaded(ds));

  return (
    <EditDataSourceView
      pageId={pageId}
      dataSource={dataSource}
      dataSourceMeta={dataSourceMeta}
      dataSourceSettings={dataSourceSettings}
      dataSourceRights={dataSourceRights}
      exploreUrl={exploreUrl}
      onDelete={onDelete}
      onDefaultChange={onDefaultChange}
      onNameChange={onNameChange}
      onOptionsChange={onOptionsChange}
      onTest={onTest}
      onUpdate={onUpdate}
    />
  );
}

export type ViewProps = {
  pageId?: string | null;
  dataSource: DataSourceSettingsType;
  dataSourceMeta: DataSourcePluginMeta;
  dataSourceSettings: DataSourceSettingsState;
  dataSourceRights: DataSourceRights;
  exploreUrl: string;
  onDelete: () => void;
  onDefaultChange: (isDefault: boolean) => AnyAction;
  onNameChange: (name: string) => AnyAction;
  onOptionsChange: (dataSource: DataSourceSettingsType) => AnyAction;
  onTest: () => void | Promise<unknown>;
  onUpdate: (dataSource: DataSourceSettingsType) => Promise<DataSourceSettingsType>;
};

export function EditDataSourceView({
  pageId,
  dataSource,
  dataSourceMeta,
  dataSourceSettings,
  dataSourceRights,
  exploreUrl,
  onDelete,
  onDefaultChange,
  onNameChange,
  onOptionsChange,
  onTest,
  onUpdate,
}: ViewProps) {
  const { plugin, loadError, testingStatus, loading } = dataSourceSettings;
  const { readOnly, hasWriteRights, hasDeleteRights } = dataSourceRights;
  const hasDataSource = dataSource.id > 0;
  const [phase, setPhase] = useState<'saving' | 'testing' | 'save-error' | undefined>();
  const working = useRef(false);
  const testConnection = async () => {
    if (working.current) {
      return;
    }
    working.current = true;
    setPhase('testing');
    try {
      await onTest();
    } finally {
      working.current = false;
      setPhase(undefined);
    }
  };

  const dsi = getDataSourceSrv()?.getInstanceSettings(dataSource.uid);

  const onSubmit = async (e: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (working.current) {
      return;
    }
    working.current = true;
    setPhase('saving');
    trackDsConfigClicked('save_and_test');
    try {
      await onUpdate({ ...dataSource });
      trackDsConfigUpdated({ item: 'success' });
      appEvents.publish(new DataSourceUpdatedSuccessfully());
    } catch (error) {
      trackDsConfigUpdated({ item: 'fail' });
      working.current = false;
      setPhase('save-error');
      return;
    }
    setPhase('testing');
    try {
      await onTest();
    } finally {
      working.current = false;
      setPhase(undefined);
    }
  };

  const extensionPointId = PluginExtensionPoints.DataSourceConfig;
  const { extensions } = usePluginComponentExtensions<{
    context: PluginExtensionDataSourceConfigContext<DataSourceJsonData>;
  }>({ extensionPointId });

  const allowedExtensions = useMemo(() => {
    const allowedPluginIds = ['grafana-pdc-app', 'grafana-auth-app'];
    return extensions.filter((e) => allowedPluginIds.includes(e.pluginId));
  }, [extensions]);

  if (loadError) {
    return (
      <DataSourceLoadError
        dataSourceRights={dataSourceRights}
        onDelete={() => {
          trackDsConfigClicked('delete');
          onDelete();
        }}
      />
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  // TODO - is this needed?
  if (!hasDataSource || !dsi) {
    return null;
  }

  if (pageId) {
    return (
      <DataSourcePluginContextProvider instanceSettings={dsi}>
        <DataSourcePluginConfigPage pageId={pageId} plugin={plugin} />
      </DataSourcePluginContextProvider>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="wall-datasource-configuration"
      aria-busy={phase === 'saving' || phase === 'testing'}
    >
      {!hasWriteRights && <DataSourceMissingRightsMessage />}
      {readOnly && <DataSourceReadOnlyMessage />}
      {dataSourceMeta.state && <DataSourcePluginState state={dataSourceMeta.state} />}

      <CloudInfoBox dataSource={dataSource} />

      <section className="wall-datasource-section" aria-label="데이터 소스 기본 설정">
        <h2>
          <Trans i18nKey="wall.edit-data-source.text-0a49fd14">기본 설정</Trans>
        </h2>
        <BasicSettings
          dataSourceName={dataSource.name}
          isDefault={dataSource.isDefault}
          onDefaultChange={onDefaultChange}
          onNameChange={onNameChange}
          disabled={readOnly || !hasWriteRights}
        />
      </section>
      <section className="wall-datasource-section wall-datasource-plugin-settings" aria-label="연결 및 인증 설정">
        <PanelScrollArea
          className="wall-datasource-plugin-viewport"
          aria-label="데이터 소스 플러그인 설정"
          role="region"
        >
          {plugin && (
            <DataSourcePluginContextProvider instanceSettings={dsi}>
              <DataSourcePluginSettings
                plugin={plugin}
                dataSource={dataSource}
                dataSourceMeta={dataSourceMeta}
                onModelChange={onOptionsChange}
              />
            </DataSourcePluginContextProvider>
          )}

          {/* Extension point */}
          {allowedExtensions.map((extension) => {
            const Component = extension.component;

            return (
              <div key={extension.id}>
                <Component
                  context={{
                    dataSource: omit(dataSource, ['secureJsonData']),
                    dataSourceMeta: dataSourceMeta,
                    testingStatus,
                    setJsonData: (jsonData) =>
                      onOptionsChange({
                        ...dataSource,
                        jsonData: { ...dataSource.jsonData, ...jsonData },
                      }),
                  }}
                />
              </div>
            );
          })}
        </PanelScrollArea>
      </section>
      <div className="wall-datasource-save-area">
        {phase !== 'saving' && phase !== 'testing' && (
          <DataSourceTestingStatus
            testingStatus={testingStatus}
            exploreUrl={exploreUrl}
            dataSource={dataSource}
            saveFailed={phase === 'save-error'}
          />
        )}

        <ButtonRow
          onSubmit={onSubmit}
          onDelete={() => {
            trackDsConfigClicked('delete');
            onDelete();
          }}
          onTest={() => {
            trackDsConfigClicked('test');
            void testConnection();
          }}
          pending={phase === 'saving' ? '설정 저장 중…' : phase === 'testing' ? '연결 테스트 중…' : undefined}
          canDelete={!readOnly && hasDeleteRights}
          canSave={!readOnly && hasWriteRights}
        />
      </div>
    </form>
  );
}
