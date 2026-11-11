import { queryByTestId, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DataSourceInstanceSettings,
  DataSourcePluginMeta,
  GrafanaConfig,
  PluginMetaInfo,
  PluginType,
  locationUtil,
} from '@grafana/data';
import { config } from '@grafana/runtime';

import { DataSourceModal, DataSourceModalProps } from './DataSourceModal';

const pluginMetaInfo: PluginMetaInfo = {
  author: { name: '' },
  description: '',
  screenshots: [],
  version: '',
  updated: '',
  links: [],
  logos: { small: '', large: '' },
};

function createPluginMeta(name: string, builtIn: boolean): DataSourcePluginMeta {
  return { builtIn, name, id: name, type: PluginType.datasource, baseUrl: '', info: pluginMetaInfo, module: '' };
}

function createDS(name: string, id: number, builtIn: boolean): DataSourceInstanceSettings {
  return {
    name: name,
    uid: name + 'uid',
    meta: createPluginMeta(name, builtIn),
    id,
    access: 'direct',
    jsonData: {},
    type: '',
    readOnly: true,
  };
}

const mockDS1 = createDS('mock.datasource.1', 1, false);
const mockDS2 = createDS('mock.datasource.2', 2, false);
const mockDSBuiltIn = createDS('mock.datasource.builtin', 3, true);

const mockDSList = [mockDS1, mockDS2, mockDSBuiltIn];

const setup = (partialProps: Partial<DataSourceModalProps> = {}) => {
  window.HTMLElement.prototype.scrollIntoView = function () {};

  const props: DataSourceModalProps = {
    ...partialProps,
    onChange: partialProps.onChange || jest.fn(),
    onDismiss: partialProps.onDismiss || jest.fn(),
    current: partialProps.current || mockDS1,
  };

  return render(<DataSourceModal {...props} />);
};

jest.mock('@grafana/runtime', () => {
  const actual = jest.requireActual('@grafana/runtime');
  return {
    ...actual,
    getTemplateSrv: () => {
      return {
        getVariables: () => [],
      };
    },
  };
});

jest.mock('@grafana/runtime/src/services/dataSourceSrv', () => {
  return {
    getDataSourceSrv: () => ({
      getList: getListMock,
      getInstanceSettings: getInstanceSettingsMock,
    }),
  };
});

locationUtil.initialize({
  config: { appSubUrl: '/my-sub-path' } as GrafanaConfig,
  getTimeRangeForUrl: jest.fn(),
  getVariablesUrlParams: jest.fn(),
});

const getListMock = jest.fn();
const getInstanceSettingsMock = jest.fn();
beforeEach(() => {
  getListMock.mockReturnValue(mockDSList);
  getInstanceSettingsMock.mockReturnValue(mockDS1);
});

describe('DataSourceDropdown', () => {
  it('should render', () => {
    expect(() => setup()).not.toThrow();
  });

  describe('configuration', () => {
    it('displays the configure new datasource when the list is empty', async () => {
      const user = userEvent.setup();
      setup();
      const searchBox = await screen.findByRole('searchbox');
      expect(searchBox).toBeInTheDocument();
      await user.click(searchBox!);
      await user.keyboard('foobarbaz'); //Search for a DS that should not exist

      expect(screen.queryAllByText('Configure a new data source')).toHaveLength(1);
      screen.queryAllByRole('link').forEach((link) => {
        // It should point to the new data source page including any sub url configured
        expect(link).toHaveAttribute('href', '/my-sub-path/connections/datasources/new');
      });
    });

    it('only displays the file drop area when the ff is enabled', async () => {
      const defaultValue = config.featureToggles.editPanelCSVDragAndDrop;
      config.featureToggles.editPanelCSVDragAndDrop = true;
      setup({ uploadFile: true });

      expect(await screen.queryByTestId('file-drop-zone-default-children')).toBeInTheDocument();
      config.featureToggles.editPanelCSVDragAndDrop = defaultValue;
    });

    it('does not show the file drop area when the ff is disabled', async () => {
      const defaultValue = config.featureToggles.editPanelCSVDragAndDrop;
      config.featureToggles.editPanelCSVDragAndDrop = false;

      setup({ uploadFile: true });
      expect(await screen.queryByTestId('file-drop-zone-default-children')).toBeNull();

      config.featureToggles.editPanelCSVDragAndDrop = defaultValue;
    });

    it('should not display the drop zone by default', async () => {
      const defaultValue = config.featureToggles.editPanelCSVDragAndDrop;
      config.featureToggles.editPanelCSVDragAndDrop = true;

      const component = setup();

      expect(queryByTestId(component.container, 'file-drop-zone-default-children')).toBeNull();
      config.featureToggles.editPanelCSVDragAndDrop = defaultValue;
    });

    it('should display the drop zone when uploadFile is enabled', async () => {
      const defaultValue = config.featureToggles.editPanelCSVDragAndDrop;
      config.featureToggles.editPanelCSVDragAndDrop = true;
      setup({ uploadFile: true });

      expect(await screen.queryByTestId('file-drop-zone-default-children')).toBeInTheDocument();
      config.featureToggles.editPanelCSVDragAndDrop = defaultValue;
    });

    it('should fetch the DS applying the correct filters consistently across lists', async () => {
      const filters = {
        mixed: true,
        tracing: true,
        dashboard: true,
        metrics: true,
        type: 'foo',
        annotations: true,
        variables: true,
        alerting: true,
        pluginId: 'pluginid',
        logs: true,
      };

      const props = {
        onChange: () => {},
        onDismiss: () => {},
        current: mockDS1.name,
        ...filters,
      };

      getListMock.mockClear();
      render(<DataSourceModal {...props}></DataSourceModal>);

      // Every call to the service must contain same filters
      expect(getListMock).toHaveBeenCalled();
      getListMock.mock.calls.forEach((call) =>
        expect(call[0]).toMatchObject({
          ...filters,
        })
      );
    });
  });

  describe('interactions', () => {
    it('renders each source once and keeps default separate from selection', () => {
      mockDS1.isDefault = true;
      setup({ current: mockDS2 });
      expect(screen.getAllByText(mockDSBuiltIn.name, { selector: '.wall-datasource-name' })).toHaveLength(1);
      expect(screen.getByRole('button', { name: /mock.datasource.1/ })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /mock.datasource.2/ })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('기본')).toBeVisible();
      delete mockDS1.isDefault;
    });

    it('searches plugin type and navigates the unified list with native keyboard focus', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const mysql = { ...mockDS2, type: 'mysql', meta: { ...mockDS2.meta, name: 'MySQL' } };
      getListMock.mockReturnValue([mockDS1, mysql, mockDSBuiltIn]);
      setup({ onChange });
      await user.type(screen.getByRole('searchbox'), 'mysql');
      expect(screen.queryByText(mockDS1.name, { selector: '.wall-datasource-name' })).not.toBeInTheDocument();
      await user.keyboard('{ArrowDown}{Enter}');
      expect(onChange).toHaveBeenCalledWith(mysql);
    });

    it('finds built-ins by original names and Korean aliases without changing native IDs', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const mixed = { ...mockDSBuiltIn, uid: '-- Mixed --', name: '-- Mixed --' };
      getListMock.mockReturnValue([mockDS1, mixed]);
      setup({ onChange });
      await user.type(screen.getByRole('searchbox'), '혼합');
      await user.click(screen.getByRole('button', { name: /여러 데이터 소스 사용/ }));
      expect(onChange).toHaveBeenCalledWith(mixed);
    });

    it('should be searchable', async () => {
      const user = userEvent.setup();
      setup();
      const searchBox = await screen.findByRole('searchbox');
      expect(searchBox).toBeInTheDocument();
      await user.click(searchBox!);

      await user.keyboard(mockDS2.name); //Search for xMockDS

      expect(screen.queryByText(mockDS1.name, { selector: '.wall-datasource-name' })).toBeNull();
      expect(await screen.findByText(mockDS2.name, { selector: '.wall-datasource-name' })).toBeInTheDocument();

      await user.keyboard('foobarbaz'); //Search for a DS that should not exist

      expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument();
    });

    //Skipping this test as it's flaky on drone
    it.skip('calls the onChange with the default query containing the file', async () => {
      const user = userEvent.setup();
      config.featureToggles.editPanelCSVDragAndDrop = true;
      const onChange = jest.fn();
      setup({ onChange, uploadFile: true });

      const fileInput = (
        await screen.queryByTestId('file-drop-zone-default-children')!
      ).parentElement!.parentElement!.querySelector('input');
      const file = new File([''], 'test.csv', { type: 'text/plain' });
      expect(fileInput).toBeInTheDocument();
      await user.upload(fileInput!, file);
      const defaultQuery = onChange.mock.lastCall[1][0];
      expect(defaultQuery).toMatchObject({
        refId: 'A',
        datasource: { type: 'grafana', uid: 'grafana' },
        queryType: 'snapshot',
        file: { path: 'test.csv' },
      });
      config.featureToggles.editPanelCSVDragAndDrop = false;
    });

    it('should call the onChange handler with the correct datasource', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      setup({ onChange });
      await user.click(await screen.findByText(mockDS2.name, { selector: '.wall-datasource-name' }));
      expect(onChange.mock.lastCall[0].name).toEqual(mockDS2.name);
    });
  });
});
