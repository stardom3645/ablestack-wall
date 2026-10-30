import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';

import { editorPresentationContext } from './EditorPresentationContext';
import { WallOptionNavigator } from './WallOptionNavigator';

const category = (id: string, value: string) =>
  new OptionsPaneCategoryDescriptor({ id, title: id, customRender: () => <div key={id}>{value}</div> });

it('navigates all native option groups without losing field or override editors and searches across sections', () => {
  const props = {
    general: [category('Panel', 'native title editor')],
    visualization: [category('Graph', 'native interpolation editor')],
    fields: [category('Thresholds', 'native threshold editor')],
    overrides: [category('Override 1', 'native override editor')],
    overrideCount: 1,
    searching: false,
  };
  const { rerender } = render(<WallOptionNavigator {...props} />);
  expect(screen.getByText('native title editor')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '시각화' }));
  expect(screen.getByText('native interpolation editor')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '필드' }));
  expect(screen.getByText('native threshold editor')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '재정의 1' }));
  expect(screen.getByText('native override editor')).toBeInTheDocument();
  rerender(<WallOptionNavigator {...props} searching searchResults={<div>all native search results</div>} />);
  expect(screen.getByText('all native search results')).toBeInTheDocument();
  rerender(<WallOptionNavigator {...props} />);
  expect(screen.getByRole('tab', { name: '재정의 1' })).toHaveAttribute('aria-selected', 'true');
});

it('uses an accessible Base UI disclosure while preserving the native category content and expansion state', () => {
  const group = new OptionsPaneCategoryDescriptor({
    id: 'Wall test category',
    title: 'Native category',
    isOpenDefault: false,
  });
  group.props.customRender = undefined;
  render(<editorPresentationContext.Provider value={true}>{group.render()}</editorPresentationContext.Provider>);
  const trigger = screen.getByRole('button', { name: 'Native category' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

it('keeps native override title actions outside the disclosure button', () => {
  const remove = jest.fn();
  const group = new OptionsPaneCategoryDescriptor({
    id: 'Wall override header',
    title: 'Override header',
    renderTitle: () => (
      <>
        <span>Override rule</span>
        <button onClick={remove}>Remove override rule</button>
      </>
    ),
  });
  const { container } = render(
    <editorPresentationContext.Provider value={true}>{group.render()}</editorPresentationContext.Provider>
  );
  expect(container.querySelector('button button')).toBeNull();
  const trigger = screen.getByRole('button', { name: 'Override header' });
  fireEvent.click(screen.getByRole('button', { name: 'Remove override rule' }));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  fireEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
});
