import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { selectors } from '@grafana/e2e-selectors';
import { CustomVariable } from '@grafana/scenes';
import { DashboardScene } from 'app/features/dashboard-scene/scene/DashboardScene';
import { VariableEditorList } from 'app/features/dashboard-scene/settings/variables/VariableEditorList';

import { settingsPresentationContext } from './SettingsPresentationContext';

it('connects the Wall variable collection to existing edit/duplicate handlers and preserves native delete confirmation', () => {
  const variable = new CustomVariable({ name: 'hosts', label: '호스트', query: 'cube01,cube02', value: 'cube01' });
  const onEdit = jest.fn();
  const onDuplicate = jest.fn();
  const onDelete = jest.fn();
  const onAdd = jest.fn();
  render(
    <settingsPresentationContext.Provider value={new DashboardScene({ uid: 'aec03x1adsi68f' })}>
      <VariableEditorList
        variables={[variable]}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onAdd={onAdd}
        onChangeOrder={jest.fn()}
      />
    </settingsPresentationContext.Provider>
  );
  fireEvent.click(screen.getByTestId(selectors.pages.Dashboard.Settings.Variables.List.tableRowNameFields('hosts')));
  expect(onEdit).toHaveBeenCalledWith('hosts');
  fireEvent.click(screen.getByLabelText('변수 복제'));
  expect(onDuplicate).toHaveBeenCalledWith('hosts');
  fireEvent.click(screen.getByLabelText('변수 삭제'));
  expect(onDelete).not.toHaveBeenCalled();
  expect(screen.getByText('Are you sure you want to delete: hosts?')).toBeInTheDocument();
  expect(variable.state.name).toBe('hosts');
  expect(variable.state.query).toBe('cube01,cube02');
});
