import { css } from '@emotion/css';
import { QueryEditorProps } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { FileDropzone, InlineField, InlineFieldRow, Input, RadioButtonGroup, useTheme2 } from '@grafana/ui';
import React from 'react';
import { JaegerDatasource } from '../datasource';
import { JaegerQuery, JaegerQueryType } from '../types';
import { SearchForm } from './SearchForm';

type Props = QueryEditorProps<JaegerDatasource, JaegerQuery>;

export function QueryEditor({ datasource, query, onChange, onRunQuery }: Props) {
  const theme = useTheme2();

  const renderEditorBody = () => {
    if (query.queryType === 'search') {
      return <SearchForm datasource={datasource} query={query} onChange={onChange} />;
    }

    if (query.queryType !== 'upload') {
      return (
        <InlineFieldRow>
          <InlineField label="Trace ID" labelWidth={21} grow>
            <Input
              aria-label={selectors.components.DataSource.Jaeger.traceIDInput}
              placeholder="Eg. 4050b8060d659e52"
              value={query.query || ''}
              onChange={(v) =>
                onChange({
                  ...query,
                  query: v.currentTarget.value,
                })
              }
            />
          </InlineField>
        </InlineFieldRow>
      );
    }

    return null;
  };

  return (
    <>
      <div className={css({ width: '50%' })}>
        <InlineFieldRow>
          <InlineField label="Query type">
            <RadioButtonGroup<JaegerQueryType>
              options={[
                { value: 'search', label: 'Search' },
                { value: undefined, label: 'TraceID' },
                { value: 'upload', label: 'JSON File' },
              ]}
              value={query.queryType}
              onChange={(v) =>
                onChange({
                  ...query,
                  queryType: v,
                })
              }
              size="md"
            />
          </InlineField>
        </InlineFieldRow>
        {renderEditorBody()}
      </div>
      {query.queryType === 'upload' ? (
        <div className={css({ padding: theme.spacing(2) })}>
          <FileDropzone
            options={{ accept: '.json', multiple: false }}
            onLoad={(result: string) => {
              datasource.uploadedJson = result;
              onRunQuery();
            }}
          />
        </div>
      ) : null}
    </>
  );
}
