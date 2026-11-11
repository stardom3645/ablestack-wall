import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CoreApp } from '@grafana/data';
import { EditorMode } from '@grafana/experimental';

import { SqlDatasource } from '../datasource/SqlDatasource';
import { SQLQuery } from '../types';

import { SqlQueryEditor } from './QueryEditor';
import { buildMockDatasource } from './SqlComponents.testHelpers';

jest.mock('./query-editor-raw/RawEditor', () => ({
  RawEditor: ({ query, onChange }: { query: SQLQuery; onChange: (q: SQLQuery, process: boolean) => void }) => (
    <textarea
      aria-label="Native SQL"
      defaultValue={query.rawSql}
      onChange={(e) => onChange({ ...query, rawSql: e.target.value, rawQuery: true }, false)}
    />
  ),
}));

it.each([EditorMode.Builder, EditorMode.Code])(
  'opens stored SQL %s as code while preserving native update and execution',
  async (editorMode) => {
    const source = buildMockDatasource(true) as unknown as SqlDatasource;
    const query: SQLQuery = { refId: 'A', editorMode, rawSql: 'SELECT count(*) FROM hosts WHERE name = $host' };
    const original = { ...query };
    const onChange = jest.fn();
    const onRun = jest.fn();
    render(
      <SqlQueryEditor
        datasource={source}
        query={query}
        app={CoreApp.PanelEditor}
        onChange={onChange}
        onRunQuery={onRun}
        wallPresentation={{
          codeHeight: 320,
          options: (children) => <>{children}</>,
          actions: (run) => <button onClick={run}>쿼리 실행</button>,
        }}
      />
    );
    const editor = await screen.findByRole('textbox', { name: 'Native SQL' });
    expect(editor).toHaveValue(query.rawSql);
    expect(screen.queryByRole('radio', { name: 'Builder' })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(query).toEqual(original);
    fireEvent.change(editor, { target: { value: 'SELECT 1' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ refId: 'A', rawSql: 'SELECT 1', rawQuery: true, editorMode })
    );
    await userEvent.click(screen.getByRole('button', { name: '쿼리 실행' }));
    expect(onRun).toHaveBeenCalledTimes(1);
  }
);
