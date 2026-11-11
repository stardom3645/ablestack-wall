// Core Grafana history https://github.com/grafana/grafana/blob/v11.0.0-preview/public/app/plugins/datasource/prometheus/querybuilder/components/PromQueryBuilderOptions.tsx
import { SyntheticEvent, useContext } from 'react';
import * as React from 'react';

import { CoreApp, SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { EditorField, EditorRow, EditorSwitch } from '@grafana/experimental';
import { AutoSizeInput, RadioButtonGroup, Select } from '@grafana/ui';

import { editorPresentationContext } from '../../../../../public/app/features/wall-modern/editor/EditorPresentationContext';
import { wallQueryOptionText } from '../../../../../public/app/features/wall-modern/editor/optionText';
import { getQueryTypeChangeHandler, getQueryTypeOptions } from '../../components/PromExploreExtraField';
import { PromQueryFormat } from '../../dataquery';
import { PromQuery } from '../../types';
import { QueryOptionGroup } from '../shared/QueryOptionGroup';

import { FORMAT_OPTIONS, INTERVAL_FACTOR_OPTIONS } from './PromQueryEditorSelector';
import { getLegendModeLabel, PromQueryLegendEditor } from './PromQueryLegendEditor';

export interface UIOptions {
  exemplars: boolean;
  type: boolean;
  format: boolean;
  minStep: boolean;
  legend: boolean;
  resolution: boolean;
}

export interface PromQueryBuilderOptionsProps {
  query: PromQuery;
  app?: CoreApp;
  onChange: (update: PromQuery) => void;
  onRunQuery: () => void;
}

export const PromQueryBuilderOptions = React.memo<PromQueryBuilderOptionsProps>(
  ({ query, app, onChange, onRunQuery }) => {
    const wallEditor = useContext(editorPresentationContext);
    const display = (text: string) => (wallEditor ? wallQueryOptionText(text) : text);
    const onChangeFormat = (value: SelectableValue<PromQueryFormat>) => {
      onChange({ ...query, format: value.value });
      onRunQuery();
    };

    const onChangeStep = (evt: React.FormEvent<HTMLInputElement>) => {
      onChange({ ...query, interval: evt.currentTarget.value.trim() });
      onRunQuery();
    };

    const queryTypeOptions = getQueryTypeOptions(
      app === CoreApp.Explore || app === CoreApp.Correlations || app === CoreApp.PanelEditor
    );

    const onQueryTypeChange = getQueryTypeChangeHandler(query, onChange);

    const onExemplarChange = (event: SyntheticEvent<HTMLInputElement>) => {
      const isEnabled = event.currentTarget.checked;
      onChange({ ...query, exemplar: isEnabled });
      onRunQuery();
    };

    const onIntervalFactorChange = (value: SelectableValue<number>) => {
      onChange({ ...query, intervalFactor: value.value });
      onRunQuery();
    };

    const formatOption = FORMAT_OPTIONS.find((option) => option.value === query.format) || FORMAT_OPTIONS[0];
    const queryTypeValue = getQueryTypeValue(query);
    const queryTypeLabel = queryTypeOptions.find((x) => x.value === queryTypeValue)!.label;

    const Row = wallEditor ? 'div' : EditorRow;
    return (
      <Row>
        <div data-testid={selectors.components.DataSource.Prometheus.queryEditor.options}>
          <QueryOptionGroup
            title="Options"
            collapsedInfo={getCollapsedInfo(query, formatOption.label!, queryTypeLabel, app, display)}
          >
            <PromQueryLegendEditor
              legendFormat={query.legendFormat}
              onChange={(legendFormat) => onChange({ ...query, legendFormat })}
              onRunQuery={onRunQuery}
            />
            <EditorField
              label={display('Min step')}
              tooltip={
                <>
                  An additional lower limit for the step parameter of the Prometheus query and for the{' '}
                  <code>$__interval</code> and <code>$__rate_interval</code> variables.
                </>
              }
            >
              <AutoSizeInput
                type="text"
                aria-label="Set lower limit for the step parameter"
                placeholder={'auto'}
                minWidth={10}
                onCommitChange={onChangeStep}
                defaultValue={query.interval}
                data-test-id="prometheus-step"
              />
            </EditorField>
            <EditorField label={display('Format')}>
              <Select
                data-testid={selectors.components.DataSource.Prometheus.queryEditor.format}
                value={{ ...formatOption, label: display(formatOption.label!) }}
                allowCustomValue
                onChange={onChangeFormat}
                options={FORMAT_OPTIONS.map((option) => ({ ...option, label: display(option.label!) }))}
              />
            </EditorField>
            <EditorField
              label={display('Type')}
              data-testid={selectors.components.DataSource.Prometheus.queryEditor.type}
            >
              <RadioButtonGroup
                options={queryTypeOptions.map((option) => ({ ...option, label: display(String(option.label)) }))}
                value={queryTypeValue}
                onChange={onQueryTypeChange}
              />
            </EditorField>
            {shouldShowExemplarSwitch(query, app) && (
              <EditorField label={display('Exemplars')}>
                <EditorSwitch
                  value={query.exemplar || false}
                  onChange={onExemplarChange}
                  data-test-id="prometheus-exemplars"
                />
              </EditorField>
            )}
            {query.intervalFactor && query.intervalFactor > 1 && (
              <EditorField label={display('Resolution')}>
                <Select
                  aria-label="Select resolution"
                  isSearchable={false}
                  options={INTERVAL_FACTOR_OPTIONS}
                  onChange={onIntervalFactorChange}
                  value={INTERVAL_FACTOR_OPTIONS.find((option) => option.value === query.intervalFactor)}
                />
              </EditorField>
            )}
          </QueryOptionGroup>
        </div>
      </Row>
    );
  }
);

function shouldShowExemplarSwitch(query: PromQuery, app?: CoreApp) {
  if (app === CoreApp.UnifiedAlerting || !query.range) {
    return false;
  }

  return true;
}

function getQueryTypeValue(query: PromQuery) {
  return query.range && query.instant ? 'both' : query.instant ? 'instant' : 'range';
}

function getCollapsedInfo(
  query: PromQuery,
  formatOption: string,
  queryType: string,
  app?: CoreApp,
  display: (text: string) => string = (text) => text
): string[] {
  const items: string[] = [];

  items.push(
    `${display('Legend')}: ${query.legendFormat ? getLegendModeLabel(query.legendFormat) : display(String(getLegendModeLabel(query.legendFormat)))}`
  );
  items.push(`${display('Format')}: ${display(formatOption)}`);
  items.push(`${display('Step')}: ${query.interval ?? display('Auto')}`);
  items.push(`${display('Type')}: ${display(queryType)}`);

  if (shouldShowExemplarSwitch(query, app)) {
    if (query.exemplar) {
      items.push(`Exemplars: true`);
    } else {
      items.push(`Exemplars: false`);
    }
  }
  return items;
}

PromQueryBuilderOptions.displayName = 'PromQueryBuilderOptions';
