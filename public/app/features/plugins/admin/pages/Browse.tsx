import { css } from '@emotion/css';
import { useState } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { SelectableValue, GrafanaTheme2, PluginType } from '@grafana/data';
import { locationSearchToObject } from '@grafana/runtime';
import { Select, RadioButtonGroup, useStyles2, Tooltip, Field, Button } from '@grafana/ui';
import { Trans, t } from 'app/core/internationalization';
import { WallAdminPage } from 'app/features/wall-modern/management/WallAdminPage';

import { HorizontalGroup } from '../components/HorizontalGroup';
import { PluginList } from '../components/PluginList';
import { RoadmapLinks } from '../components/RoadmapLinks';
import { SearchField } from '../components/SearchField';
import { UpdateAllModal } from '../components/UpdateAllModal';
import { Sorters } from '../helpers';
import { useHistory } from '../hooks/useHistory';
import { useGetAll, useGetUpdatable, useIsRemotePluginsAvailable } from '../state/hooks';

export default function Browse() {
  const location = useLocation();
  const locationSearch = locationSearchToObject(location.search);
  const styles = useStyles2(getStyles);
  const history = useHistory();
  const remotePluginsAvailable = useIsRemotePluginsAvailable();
  const keyword = locationSearch.q?.toString() || '';
  const filterBy = locationSearch.filterBy?.toString() || 'all';
  const filterByType = (locationSearch.filterByType as PluginType | 'all') || 'all';
  const sortBy = (locationSearch.sortBy as Sorters) || Sorters.nameAsc;
  const { isLoading, error, plugins } = useGetAll(
    {
      keyword,
      type: filterByType !== 'all' ? filterByType : undefined,
      isInstalled: filterBy === 'installed' ? true : undefined,
      hasUpdate: filterBy === 'has-update' ? true : undefined,
    },
    sortBy
  );

  const filterByOptions = [
    { value: 'all', label: '전체' },
    { value: 'installed', label: '설치됨' },
    { value: 'has-update', label: '업데이트 있음' },
  ];

  const { isLoading: areUpdatesLoading, updatablePlugins } = useGetUpdatable();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const disableUpdateAllButton = updatablePlugins.length <= 0 || areUpdatesLoading;

  const onSortByChange = (value: SelectableValue<string>) => {
    history.push({ query: { sortBy: value.value } });
  };

  const onFilterByChange = (value: string) => {
    history.push({ query: { filterBy: value } });
  };

  const onFilterByTypeChange = (value: SelectableValue<string>) => {
    history.push({ query: { filterByType: value.value } });
  };

  const onSearch = (q: string) => {
    history.push({ query: { filterBy, filterByType, q } });
  };

  const onUpdateAll = () => {
    setShowUpdateModal(true);
  };

  // How should we handle errors?
  if (error) {
    console.error(error.message);
    return null;
  }

  const updateAll = (
    <Button disabled={disableUpdateAllButton} onClick={onUpdateAll}>
      <Trans i18nKey="plugins.catalog.update-all.button">Update all</Trans>
      {disableUpdateAllButton ? '' : ` (${updatablePlugins.length})`}
    </Button>
  );

  return (
    <WallAdminPage
      navId="plugins"
      wide
      actions={updateAll}
      description="패널과 앱 확장 기능을 탐색하고 설치 상태 및 설정을 관리합니다."
    >
      <HorizontalGroup wrap className="wall-admin-catalog-tools">
        <Field label={t('ablestack-wall.common.search', 'Search')}>
          <SearchField value={keyword} onSearch={onSearch} />
        </Field>
        <HorizontalGroup wrap className={styles.actionBar}>
          {/* Filter by type */}
          <Field label={t('ablestack-wall.common.type', 'Type')}>
            <Select
              aria-label="Plugin type filter"
              value={filterByType}
              onChange={onFilterByTypeChange}
              width={18}
              options={[
                { value: 'all', label: '전체' },
                { value: 'datasource', label: '데이터 소스' },
                { value: 'panel', label: '패널' },
                { value: 'app', label: '앱' },
              ]}
            />
          </Field>

          {/* Filter by installed / all */}
          {remotePluginsAvailable ? (
            <Field label={t('ablestack-wall.common.state', 'State')}>
              <RadioButtonGroup value={filterBy} onChange={onFilterByChange} options={filterByOptions} />
            </Field>
          ) : (
            <Tooltip
              content="This filter has been disabled because the Grafana server cannot access grafana.com"
              placement="top"
            >
              <div>
                <Field label={t('ablestack-wall.common.state', 'State')}>
                  <RadioButtonGroup
                    disabled={true}
                    value={filterBy}
                    onChange={onFilterByChange}
                    options={filterByOptions}
                  />
                </Field>
              </div>
            </Tooltip>
          )}

          {/* Sorting */}
          <Field label={t('ablestack-wall.common.sort', 'Sort')}>
            <Select
              aria-label="Sort Plugins List"
              width={24}
              value={sortBy}
              onChange={onSortByChange}
              options={[
                { value: 'nameAsc', label: '이름 오름차순' },
                { value: 'nameDesc', label: '이름 내림차순' },
                { value: 'updated', label: '업데이트순' },
                { value: 'published', label: '게시일순' },
                { value: 'downloads', label: '다운로드순' },
              ]}
            />
          </Field>
        </HorizontalGroup>
      </HorizontalGroup>
      <div className={styles.listWrap}>
        <PluginList plugins={plugins} isLoading={isLoading} />
      </div>
      <RoadmapLinks />
      <UpdateAllModal
        isOpen={showUpdateModal}
        isLoading={areUpdatesLoading}
        onDismiss={() => setShowUpdateModal(false)}
        plugins={updatablePlugins}
      />
    </WallAdminPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  actionBar: css({
    [theme.breakpoints.up('xl')]: {
      marginLeft: 'auto',
    },
  }),
  listWrap: css({
    marginTop: theme.spacing(2),
  }),
  displayAs: css({
    svg: {
      marginRight: 0,
    },
  }),
});
