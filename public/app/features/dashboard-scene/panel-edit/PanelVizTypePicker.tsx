import { Input as BaseInput } from '@base-ui/react/input';
import { css } from '@emotion/css';
import { ArrowLeft, Search } from 'lucide-react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'react-use';

import { GrafanaTheme2, PanelData, SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { reportInteraction } from '@grafana/runtime';
import { VizPanel } from '@grafana/scenes';
import { Button, CustomScrollbar, Field, FilterInput, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { LS_VISUALIZATION_SELECT_TAB_KEY, LS_WIDGET_SELECT_TAB_KEY } from 'app/core/constants';
import { t, Trans } from 'app/core/internationalization';
import { VisualizationSelectPaneTab } from 'app/features/dashboard/components/PanelEditor/types';
import { VisualizationSuggestions } from 'app/features/panel/components/VizTypePicker/VisualizationSuggestions';
import { VizTypePicker } from 'app/features/panel/components/VizTypePicker/VizTypePicker';
import { VizTypeChangeDetails } from 'app/features/panel/components/VizTypePicker/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'app/features/wall-modern/components/ui/tabs';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { WallVisualizationGallery } from 'app/features/wall-modern/editor/WallVisualizationGallery';
import { Button as WallButton } from 'app/features/wall-modern/ui';

import { PanelModelCompatibilityWrapper } from '../utils/PanelModelCompatibilityWrapper';

import { INTERACTION_EVENT_NAME, INTERACTION_ITEM } from './interaction';

export interface Props {
  data?: PanelData;
  panel: VizPanel;
  onChange: (options: VizTypeChangeDetails) => void;
  onClose: () => void;
}

export function PanelVizTypePicker({ panel, data, onChange, onClose }: Props) {
  const styles = useStyles2(getStyles);
  const wallEditor = useContext(editorPresentationContext);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    if (value) {
      reportInteraction(INTERACTION_EVENT_NAME, { item: INTERACTION_ITEM.SEARCH, query: value });
    }
    setSearchQuery(value);
  };

  const isWidgetEnabled = false;
  const tabKey = isWidgetEnabled ? LS_WIDGET_SELECT_TAB_KEY : LS_VISUALIZATION_SELECT_TAB_KEY;
  const defaultTab = isWidgetEnabled ? VisualizationSelectPaneTab.Widgets : VisualizationSelectPaneTab.Visualizations;
  const panelModel = useMemo(() => new PanelModelCompatibilityWrapper(panel), [panel]);

  const supportedListModes = useMemo(
    () =>
      new Set([
        VisualizationSelectPaneTab.Widgets,
        VisualizationSelectPaneTab.Visualizations,
        VisualizationSelectPaneTab.Suggestions,
      ]),
    []
  );
  const [listMode, setListMode] = useLocalStorage(tabKey, defaultTab);
  const handleListModeChange = (value: VisualizationSelectPaneTab) => {
    reportInteraction(INTERACTION_EVENT_NAME, {
      item: INTERACTION_ITEM.CHANGE_TAB,
      tab: VisualizationSelectPaneTab[value],
    });
    setListMode(value);
  };

  useEffect(() => {
    if (listMode && !supportedListModes.has(listMode)) {
      setListMode(defaultTab);
    }
  }, [defaultTab, listMode, setListMode, supportedListModes]);

  const radioOptions: Array<SelectableValue<VisualizationSelectPaneTab>> = [
    { label: 'Visualizations', value: VisualizationSelectPaneTab.Visualizations },
    { label: 'Suggestions', value: VisualizationSelectPaneTab.Suggestions },
  ];

  if (wallEditor) {
    return (
      <div className="wall-studio-viz-picker">
        <div className="wall-studio-viz-picker-heading">
          <WallButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid={selectors.components.PanelEditor.toggleVizPicker}
          >
            <ArrowLeft size={15} />
            <Trans i18nKey="wall.studio.back-to-properties">표현 설정으로</Trans>
          </WallButton>
          <span>
            <Trans i18nKey="wall.studio.choose-visualization">시각화 선택</Trans>
          </span>
        </div>
        <div className="wall-option-search">
          <Search size={15} aria-hidden="true" />
          <BaseInput
            value={searchQuery}
            onValueChange={handleSearchChange}
            aria-label={t('wall.studio.search-visualization', '시각화 검색')}
            placeholder={t('wall.studio.search-visualization', '시각화 검색')}
            autoFocus
          />
        </div>
        <Tabs
          value={listMode}
          className="wall-studio-gallery-tabs"
          onValueChange={(value) => {
            if (typeof value === 'number') {
              handleListModeChange(value);
            }
          }}
        >
          <TabsList
            aria-label={t('wall.studio.visualization-modes', '시각화 선택 방식')}
            className="wall-studio-gallery-navigation"
          >
            <TabsTrigger value={VisualizationSelectPaneTab.Visualizations}>
              <Trans i18nKey="wall.studio.all-visualizations">전체 유형</Trans>
            </TabsTrigger>
            <TabsTrigger value={VisualizationSelectPaneTab.Suggestions}>
              <Trans i18nKey="wall.studio.suggestions">데이터 기반 추천</Trans>
            </TabsTrigger>
          </TabsList>
          <TabsContent value={VisualizationSelectPaneTab.Visualizations} className="wall-studio-gallery-content">
            <WallVisualizationGallery pluginId={panel.state.pluginId} searchQuery={searchQuery} onChange={onChange} />
          </TabsContent>
          <TabsContent value={VisualizationSelectPaneTab.Suggestions} className="wall-studio-gallery-content">
            <VisualizationSuggestions onChange={onChange} searchQuery={searchQuery} panel={panelModel} data={data} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchRow}>
        <FilterInput
          className={styles.filter}
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus={true}
          placeholder="Search for..."
        />
        <Button
          title="Close"
          variant="secondary"
          icon="angle-up"
          className={styles.closeButton}
          data-testid={selectors.components.PanelEditor.toggleVizPicker}
          onClick={onClose}
        />
      </div>
      <Field className={styles.customFieldMargin}>
        <RadioButtonGroup options={radioOptions} value={listMode} onChange={handleListModeChange} fullWidth />
      </Field>
      <CustomScrollbar>
        {listMode === VisualizationSelectPaneTab.Visualizations && (
          <VizTypePicker pluginId={panel.state.pluginId} searchQuery={searchQuery} onChange={onChange} />
        )}
        {listMode === VisualizationSelectPaneTab.Suggestions && (
          <VisualizationSuggestions onChange={onChange} searchQuery={searchQuery} panel={panelModel} data={data} />
        )}
      </CustomScrollbar>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: theme.spacing(2, 1),
    height: '100%',
    gap: theme.spacing(2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRight: 'none',
    borderBottom: 'none',
    borderTopLeftRadius: theme.shape.radius.default,
  }),
  searchRow: css({
    display: 'flex',
    marginBottom: theme.spacing(1),
  }),
  closeButton: css({
    marginLeft: theme.spacing(1),
  }),
  customFieldMargin: css({
    marginBottom: theme.spacing(1),
  }),
  filter: css({
    minHeight: theme.spacing(4),
  }),
});
