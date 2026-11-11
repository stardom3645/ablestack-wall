import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { standardEditorsRegistry } from '@grafana/data';
import { getAllOptionEditors } from 'app/core/components/OptionsUI/registry';
import { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';
import { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';
import { renderSearchHits } from 'app/features/dashboard/components/PanelEditor/OptionsPaneOptions';

import { editorPresentationContext } from './EditorPresentationContext';
import { WallOptionEditor } from './WallOptionEditor';

standardEditorsRegistry.setInit(getAllOptionEditors);

it('keeps boolean and undefined radio values typed and translates labels only', () => {
  const onChange = jest.fn();
  const Editor = standardEditorsRegistry.get('radio').editor;
  const item = {
    id: 'grid',
    path: 'grid',
    name: 'Show grid lines',
    settings: {
      options: [
        { label: 'Auto', value: undefined },
        { label: 'On', value: true },
        { label: 'Off', value: false },
      ],
    },
  };
  render(
    <WallOptionEditor editor={<Editor value={undefined} item={item} onChange={onChange} context={{ data: [] }} />} />
  );
  expect(screen.getByRole('radio', { name: '자동' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('radio', { name: '사용' }));
  expect(onChange).toHaveBeenLastCalledWith(true);
  expect(item.settings.options[1].label).toBe('On');
});

it('searches Korean and English metadata and opens results even when ordinary groups start collapsed', () => {
  const category = new OptionsPaneCategoryDescriptor({ id: 'Thresholds', title: 'Thresholds' });
  category.addItem(
    new OptionsPaneItemDescriptor({ title: 'Show thresholds', render: () => <input defaultValue="untouched" /> })
  );
  const { rerender } = render(
    <editorPresentationContext.Provider value>
      {renderSearchHits([category], [], '임계치', true)}
    </editorPresentationContext.Provider>
  );
  expect(screen.getByText('그래프에 임계치 표시')).toBeVisible();
  expect(screen.getByRole('textbox')).toHaveValue('untouched');
  rerender(
    <editorPresentationContext.Provider value>
      {renderSearchHits([category], [], 'threshold', true)}
    </editorPresentationContext.Provider>
  );
  expect(screen.getByRole('textbox')).toHaveValue('untouched');
});

it('preserves icon-only native choices and their translated accessible names', () => {
  const changed = jest.fn();
  const Editor = standardEditorsRegistry.get('radio').editor;
  const item = {
    id: 'interpolation',
    name: 'Line interpolation',
    settings: {
      options: [
        { description: 'Linear', icon: 'gf-interpolation-linear', value: 'linear' },
        { description: 'Smooth', icon: 'gf-interpolation-smooth', value: 'smooth' },
      ],
    },
  };
  render(<WallOptionEditor editor={<Editor value="linear" item={item} onChange={changed} context={{ data: [] }} />} />);
  expect(screen.getByRole('radio', { name: '선형' }).querySelector('svg')).not.toBeNull();
  expect(screen.getByRole('radio', { name: '곡선' }).querySelector('svg')).not.toBeNull();
  fireEvent.click(screen.getByRole('radio', { name: '곡선' }));
  expect(changed).toHaveBeenLastCalledWith('smooth');
  expect(item.settings.options[0].description).toBe('Linear');
});

it('preserves image and custom preview choices instead of rendering an empty control', () => {
  const Editor = standardEditorsRegistry.get('radio').editor;
  const item = {
    id: 'preview',
    name: 'Preview',
    settings: {
      options: [
        { label: 'Image', value: 'image', imgUrl: '/preview.svg' },
        { label: 'Custom', value: 'custom', component: () => <span>native option preview</span> },
      ],
    },
  };
  render(
    <WallOptionEditor editor={<Editor value="image" item={item} onChange={jest.fn()} context={{ data: [] }} />} />
  );
  expect(screen.getByRole('radio', { name: '이미지' }).querySelector('img')).toHaveAttribute('src', '/preview.svg');
  expect(screen.getByRole('radio', { name: 'Custom' })).toHaveTextContent('native option preview');
});
