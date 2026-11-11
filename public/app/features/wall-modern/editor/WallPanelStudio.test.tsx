import { fireEvent, render, screen } from '@testing-library/react';
import { useContext } from 'react';

import { editorInspectorContext, queryWorkspaceViewContext } from './EditorPresentationContext';
import { WallEditorPreview, WallPanelEditorContext } from './WallPanelEditor';
import { WallPanelStudio } from './WallPanelStudio';

function NativeOptions() {
  const surface = useContext(editorInspectorContext);
  return (
    <div>
      <span>{surface} options</span>
      <input aria-label="Native property buffer" defaultValue="original" />
    </div>
  );
}

it('keeps native query and option buffers mounted across contextual inspector surfaces', () => {
  const { container } = render(
    <WallPanelStudio
      preview={<div>Live preview</div>}
      options={<NativeOptions />}
      data={<textarea aria-label="Native query buffer" defaultValue="query" />}
    />
  );
  fireEvent.click(screen.getByRole('tab', { name: '시각화' }));
  const properties = screen.getByRole('textbox', { name: 'Native property buffer' });
  fireEvent.change(properties, { target: { value: 'property draft' } });
  fireEvent.click(screen.getByRole('tab', { name: '데이터 쿼리' }));
  const query = screen.getByRole('textbox', { name: 'Native query buffer' });
  fireEvent.change(query, { target: { value: 'unsaved query' } });
  expect(container.querySelector('.wall-panel-studio')).toHaveAttribute('data-surface', 'data');
  fireEvent.click(screen.getByRole('tab', { name: '패널 설정' }));
  expect(screen.getByText('panel options')).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Native property buffer' })).toBe(properties);
  expect(properties).toHaveValue('property draft');
  fireEvent.click(screen.getByRole('tab', { name: '데이터 쿼리' }));
  expect(screen.getByRole('textbox', { name: 'Native query buffer' })).toBe(query);
  expect(query).toHaveValue('unsaved query');
  expect(screen.getByText('Live preview')).toBeVisible();
});

it('links the selected inspector tab and panel and retains native data URL entry intent', () => {
  render(<WallPanelStudio initialData preview="Preview" options="Options" data="Native transforms" />);
  const tab = screen.getByRole('tab', { name: '데이터 쿼리' });
  const panel = screen.getByRole('tabpanel', { name: '데이터 쿼리' });
  expect(tab).toHaveAttribute('aria-controls', panel.id);
  expect(panel).toHaveTextContent('Native transforms');
  fireEvent.click(screen.getByRole('tab', { name: '시각화' }));
  const visual = screen.getByRole('tab', { name: '시각화' });
  expect(visual).toHaveAttribute('aria-controls', screen.getByRole('tabpanel', { name: '시각화' }).id);
});

it('shows properties for query-free plugins and recovers when native plugin loading removes the selected data pane', () => {
  const { rerender } = render(
    <WallPanelStudio initialData preview="Preview" options="Native Text options" data="Native data" />
  );
  expect(screen.getByRole('tab', { name: '데이터 쿼리' })).toHaveAttribute('aria-selected', 'true');
  rerender(<WallPanelStudio preview="Preview" options="Native Text options" />);
  expect(screen.getByRole('tab', { name: '데이터 쿼리' })).toHaveAttribute('aria-disabled', 'true');
  expect(screen.getByRole('tab', { name: '시각화' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: '시각화' })).toHaveTextContent('Native Text options');
  fireEvent.click(screen.getByRole('tab', { name: '패널 설정' }));
  expect(screen.getByRole('tabpanel', { name: '패널 설정' })).toHaveTextContent('Native Text options');
});

it('keeps one live preview and native query buffer when expanding, restoring and changing modes', () => {
  const { container } = render(
    <WallPanelEditorContext.Provider value>
      <WallPanelStudio
        initialData
        controls={<button>Native time control</button>}
        resultStatus={<span role="status">Native result status</span>}
        preview={
          <WallEditorPreview tableView={false} hasData onToggleTableView={jest.fn()}>
            <span>Live chart</span>
          </WallEditorPreview>
        }
        options="Options"
        data={<textarea aria-label="Query draft" defaultValue="draft" />}
      />
    </WallPanelEditorContext.Provider>
  );
  const query = screen.getByRole('textbox', { name: 'Query draft' });
  fireEvent.change(query, { target: { value: 'unsaved' } });
  expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  expect(screen.getByRole('button', { name: 'Native time control' })).toBeVisible();
  const resultStatus = screen.getByRole('status');
  expect(resultStatus.closest('.wall-editor-preview')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '전체 화면 미리보기' }));
  expect(container.querySelector('.wall-panel-studio')).toHaveAttribute('data-preview-expanded');
  expect(screen.getAllByText('Live chart')).toHaveLength(1);
  fireEvent.keyDown(screen.getByRole('button', { name: '미리보기 크기 복원' }), { key: 'Escape' });
  expect(container.querySelector('.wall-panel-studio')).not.toHaveAttribute('data-preview-expanded');
  fireEvent.click(screen.getByRole('tab', { name: '시각화' }));
  expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '데이터 쿼리' }));
  expect(screen.getByRole('textbox', { name: 'Query draft' })).toBe(query);
  expect(query).toHaveValue('unsaved');
  expect(screen.getByRole('status')).toBe(resultStatus);
});

it('expands the live query workspace without remounting native inputs and lets child dialogs handle Escape first', () => {
  function NativeQuery() {
    const view = useContext(queryWorkspaceViewContext)!;
    return (
      <>
        <button onClick={view.onToggleExpand}>Expand workspace</button>
        <textarea aria-label="Native workspace draft" defaultValue="query" />
        <div role="dialog">
          <button>Child dialog action</button>
        </div>
      </>
    );
  }
  const { container } = render(
    <WallPanelStudio initialData preview="Live plot" options="Options" data={<NativeQuery />} />
  );
  const input = screen.getByRole('textbox', { name: 'Native workspace draft' });
  fireEvent.change(input, { target: { value: 'unfinished PromQL' } });
  fireEvent.click(screen.getByRole('button', { name: 'Expand workspace' }));
  expect(container.querySelector('.wall-panel-studio')).toHaveAttribute('data-workspace-expanded');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Child dialog action' }), { key: 'Escape' });
  expect(container.querySelector('.wall-panel-studio')).toHaveAttribute('data-workspace-expanded');
  fireEvent.keyDown(screen.getByRole('button', { name: 'Expand workspace' }), { key: 'Escape' });
  expect(container.querySelector('.wall-panel-studio')).not.toHaveAttribute('data-workspace-expanded');
  expect(screen.getByRole('textbox', { name: 'Native workspace draft' })).toBe(input);
  expect(input).toHaveValue('unfinished PromQL');
});

it('shows only the native data tab for query access, without a summary or context gap', () => {
  const { container } = render(
    <WallPanelStudio
      preview="Live preview"
      options="Visual options"
      data={<textarea aria-label="Native query" defaultValue="query" />}
    />
  );
  expect(container.querySelector('.wall-studio-context')).toBeNull();
  expect(screen.queryByRole('region', { name: '데이터 연결' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '쿼리 편집' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '데이터 쿼리' }));
  const query = screen.getByRole('textbox', { name: 'Native query' });
  fireEvent.change(query, { target: { value: 'unsaved query' } });
  fireEvent.click(screen.getByRole('tab', { name: '시각화' }));
  fireEvent.click(screen.getByRole('tab', { name: '데이터 쿼리' }));
  expect(screen.getByRole('textbox', { name: 'Native query' })).toBe(query);
  expect(query).toHaveValue('unsaved query');
  expect(screen.getByText('Live preview')).toBeVisible();
});

it('opens existing and new query-capable panels on data regardless of old tab preferences', () => {
  const preferenceKey = 'test:wall-studio:user1';
  localStorage.setItem(preferenceKey, 'panel');
  const props = { preferenceKey, preview: 'Preview', options: 'Options', data: 'Native query' };
  const first = render(<WallPanelStudio {...props} />);
  expect(screen.getAllByRole('tab').map((e) => e.textContent)).toEqual(['데이터 쿼리', '시각화', '패널 설정']);
  expect(screen.getByRole('tab', { name: '데이터 쿼리' })).toHaveAttribute('aria-selected', 'true');
  first.unmount();
  const second = render(<WallPanelStudio {...props} isNewPanel />);
  expect(screen.getByRole('tab', { name: '데이터 쿼리' })).toHaveAttribute('aria-selected', 'true');
  second.unmount();
  render(<WallPanelStudio {...props} data={undefined} />);
  expect(screen.getByRole('tab', { name: '시각화' })).toHaveAttribute('aria-selected', 'true');
  localStorage.removeItem(preferenceKey);
});
