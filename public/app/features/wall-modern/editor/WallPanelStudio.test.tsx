import { fireEvent, render, screen } from '@testing-library/react';
import { useContext } from 'react';

import { editorInspectorContext } from './EditorPresentationContext';
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
  const properties = screen.getByRole('textbox', { name: 'Native property buffer' });
  fireEvent.change(properties, { target: { value: 'property draft' } });
  fireEvent.click(screen.getByRole('tab', { name: '데이터' }));
  const query = screen.getByRole('textbox', { name: 'Native query buffer' });
  fireEvent.change(query, { target: { value: 'unsaved query' } });
  expect(container.querySelector('.wall-panel-studio')).toHaveAttribute('data-surface', 'data');
  fireEvent.click(screen.getByRole('tab', { name: '패널 정보' }));
  expect(screen.getByText('panel options')).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Native property buffer' })).toBe(properties);
  expect(properties).toHaveValue('property draft');
  fireEvent.click(screen.getByRole('tab', { name: '데이터' }));
  expect(screen.getByRole('textbox', { name: 'Native query buffer' })).toBe(query);
  expect(query).toHaveValue('unsaved query');
  expect(screen.getByText('Live preview')).toBeVisible();
});

it('links the selected inspector tab and panel and retains native data URL entry intent', () => {
  render(<WallPanelStudio initialData preview="Preview" options="Options" data="Native transforms" />);
  const tab = screen.getByRole('tab', { name: '데이터' });
  const panel = screen.getByRole('tabpanel', { name: '데이터' });
  expect(tab).toHaveAttribute('aria-controls', panel.id);
  expect(panel).toHaveTextContent('Native transforms');
  fireEvent.click(screen.getByRole('tab', { name: '표현' }));
  const visual = screen.getByRole('tab', { name: '표현' });
  expect(visual).toHaveAttribute('aria-controls', screen.getByRole('tabpanel', { name: '표현' }).id);
});
