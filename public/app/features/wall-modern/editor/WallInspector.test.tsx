import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { OptionsPaneCategoryDescriptor as Category } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';
import { OptionsPaneItemDescriptor as Item } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

import { editorPresentationContext } from './EditorPresentationContext';
import { projectInspector, WallInspector } from './WallInspector';

const group = (id: string, titles: string[]) => {
  const category = new Category({ id, title: id });
  titles.forEach((title) =>
    category.addItem(
      new Item({ title, skipField: true, render: () => <input aria-label={title} defaultValue={title} /> })
    )
  );
  return category;
};

it('projects every original descriptor once into six time-series groups without mutating parents', () => {
  const groups = [
    group('Metric type', ['Metric type']),
    group('Graph styles', ['Draw style', 'Line width']),
    group('Axis', ['Placement']),
    group('Tooltip', ['Tooltip mode']),
    group('Legend', ['Visibility']),
    group('Standard options', ['Unit', 'Min', 'Max', 'Color scheme']),
    group('Thresholds', ['Thresholds']),
    group('Value mappings', ['Value mappings']),
    group('Data links', ['Data links']),
  ];
  const original = groups.flatMap((entry) => entry.items);
  const parents = original.map((item) => item.parent);
  const sections = projectInspector(groups, [], true);
  expect(sections.map((section) => section.id)).toEqual(['metric', 'chart', 'axis', 'info', 'values', 'additional']);
  const projected = sections.flatMap((section) => section.parts.flatMap((part) => part.items));
  expect(projected).toHaveLength(original.length);
  expect(new Set(projected)).toEqual(new Set(original));
  expect(original.map((item) => item.parent)).toEqual(parents);
  expect(
    sections
      .find((section) => section.id === 'axis')
      ?.parts.flatMap((part) => part.items.map((item) => item.props.title))
  ).toEqual(['Placement', 'Min', 'Max']);
});

it('preserves typed buffers and expansion state through search and opens threshold editing as a drill-in', () => {
  const props = {
    groups: [group('Graph styles', ['Line width']), group('Axis', ['Placement']), group('Thresholds', ['Thresholds'])],
    overrides: [],
    pluginId: 'timeseries',
    searchQuery: '',
  };
  const view = (query: string) => (
    <editorPresentationContext.Provider value>
      {<WallInspector {...props} searchQuery={query} />}
    </editorPresentationContext.Provider>
  );
  const { rerender } = render(view(''));
  fireEvent.change(screen.getByRole('textbox', { name: 'Line width' }), { target: { value: 'draft' } });
  fireEvent.click(screen.getByRole('button', { name: '축과 범위' }));
  rerender(view('Placement'));
  expect(screen.getByRole('textbox', { name: 'Placement' })).toBeVisible();
  rerender(view(''));
  expect(screen.getByRole('button', { name: '축과 범위' })).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('textbox', { name: 'Line width' })).toHaveValue('draft');
  fireEvent.click(screen.getByRole('button', { name: '값과 색상' }));
  fireEvent.click(screen.getByRole('button', { name: '임계치' }));
  expect(screen.getByRole('region', { name: '임계치' })).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Thresholds' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '시각화 설정으로' }));
  expect(screen.getByRole('textbox', { name: 'Line width' })).toHaveValue('draft');
});

it('retains an unknown plugin category and custom override actions without applying time-series groups', () => {
  const unknown = group('Vendor widget', ['Vendor input']);
  const custom = new Category({
    id: 'override',
    title: 'Override',
    customRender: () => <button>Native override action</button>,
  });
  const projected = projectInspector([unknown], [custom], false);
  expect(projected[0].id).toBe('Vendor widget');
  expect(projected[1].parts[0].category).toBe(custom);
});

it('searches the new group names literally, handles punctuation and reports an empty result', () => {
  const props = {
    groups: [group('Graph styles', ['Draw style']), group('Standard options', ['Unit'])],
    overrides: [
      new Category({
        id: 'add',
        title: 'Add field override',
        customRender: () => <button>Add native override</button>,
      }),
    ],
    pluginId: 'timeseries',
  };
  const { rerender } = render(<WallInspector {...props} searchQuery="차트 스타일" />);
  expect(screen.getByRole('textbox', { name: 'Draw style' })).toBeVisible();
  rerender(<WallInspector {...props} searchQuery="[" />);
  expect(screen.getByText('검색 조건에 맞는 설정이 없습니다.')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Add native override' })).not.toBeInTheDocument();
});
