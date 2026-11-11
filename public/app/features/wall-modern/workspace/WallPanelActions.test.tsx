import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PanelMenuItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { VizPanel, VizPanelMenu } from '@grafana/scenes';

import { PanelActionsProvider, WallPanelHeader } from './PanelActionDock';
import { WallPanelActions } from './WallPanelActions';

function setup(items: PanelMenuItem[], synchronize?: (href: string) => void) {
  const menu = new VizPanelMenu({ items });
  const panel = new VizPanel({ key: 'panel-28', pluginId: 'stat', title: '가동 시간', menu });
  const view = render(
    <PanelActionsProvider actions={<WallPanelActions panel={panel} synchronize={synchronize} />}>
      <WallPanelHeader title="가동 시간" />
    </PanelActionsProvider>
  );
  return { ...view, panel, menu };
}
afterEach(() => jest.restoreAllMocks());

it('keeps the native view URL in the header menu without mutating panel settings', async () => {
  const share = jest.fn();
  const synchronize = jest.fn();
  const href = '/d/uid/name?viewPanel=28&from=now-1h&var-scvm=test';
  const { panel } = setup(
    [
      { text: '보기', iconClassName: 'eye', href },
      { text: '공유', iconClassName: 'share-alt', onClick: share },
    ],
    synchronize
  );
  expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  const before = panel.state;
  await userEvent.click(screen.getByRole('button', { name: '가동 시간 추가 작업' }));
  expect(await screen.findByRole('menuitem', { name: '보기' })).toHaveAttribute('href', href);
  const push = jest.spyOn(locationService, 'push').mockImplementation(() => {});
  await userEvent.click(screen.getByRole('menuitem', { name: '보기' }));
  expect(push).toHaveBeenCalledWith(href);
  expect(synchronize).toHaveBeenCalledWith(href);
  expect(share).not.toHaveBeenCalled();
  expect(panel.state.fieldConfig).toBe(before.fieldConfig);
  expect(panel.state.options).toBe(before.options);
});

it('renders native permission-filtered items, nested inspector actions and extension links with Base UI', async () => {
  const inspect = jest.fn((event) => event.preventDefault());
  setup([
    { text: '탐색', iconClassName: 'compass', href: '/explore?left=original' },
    { text: '검사', iconClassName: 'info-circle', subMenu: [{ text: '데이터', onClick: inspect }] },
    { text: '확장 기능', type: 'group', subMenu: [{ text: '외부 분석', href: '/a/extension' }] },
  ]);
  await userEvent.click(screen.getByRole('button', { name: '가동 시간 추가 작업' }));
  expect(await screen.findByRole('menu')).toHaveClass('wall-panel-actions-menu');
  expect(screen.queryByRole('menuitem', { name: '편집' })).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: '탐색' })).toHaveAttribute('href', '/explore?left=original');
  expect(screen.getByRole('menuitem', { name: '외부 분석' })).toHaveAttribute('href', '/a/extension');
  await userEvent.click(screen.getByRole('menuitem', { name: '검사' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '데이터' }));
  expect(inspect).toHaveBeenCalledTimes(1);
});

it('uses the menu registered activation behavior and releases its reference on unmount', async () => {
  const { menu, unmount, container } = setup([]);
  const cleanup = jest.fn();
  menu.addActivationHandler(() => {
    menu.setState({ items: [{ text: '편집', iconClassName: 'edit', href: '/native-edit' }] });
    return cleanup;
  });
  fireEvent.mouseEnter(container.querySelector('.wall-panel-native-actions')!);
  await userEvent.click(screen.getByRole('button', { name: '가동 시간 추가 작업' }));
  expect(await screen.findByRole('menuitem', { name: '편집' })).toHaveAttribute('href', '/native-edit');
  expect(menu.isActive).toBe(true);
  unmount();
  await waitFor(() => expect(menu.isActive).toBe(false));
  expect(cleanup).toHaveBeenCalled();
});

it('synchronizes the native edit URL when a menu link is selected', async () => {
  const synchronize = jest.fn();
  const push = jest.spyOn(locationService, 'push').mockImplementation(() => {});
  setup([{ text: '편집', iconClassName: 'edit', href: '/d/uid/name?editPanel=28' }], synchronize);
  await userEvent.click(screen.getByRole('button', { name: '가동 시간 추가 작업' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '편집' }));
  expect(push).toHaveBeenCalledWith('/d/uid/name?editPanel=28');
  expect(synchronize).toHaveBeenCalledWith('/d/uid/name?editPanel=28');
});

it('retains View and Share only in the header More menu', async () => {
  const share = jest.fn();
  const href = '/d/uid/name?viewPanel=28&from=now-1h&var-scvm=test';
  setup([
    { text: '보기', iconClassName: 'eye', href },
    { text: '공유', iconClassName: 'share-alt', onClick: share },
  ]);
  expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('가동 시간 보기')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('가동 시간 공유')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '가동 시간 추가 작업' }));
  expect(await screen.findByRole('menuitem', { name: '보기' })).toHaveAttribute('href', href);
  await userEvent.click(screen.getByRole('menuitem', { name: '공유' }));
  expect(share).toHaveBeenCalledTimes(1);
});

it('drills inside one popup, goes back with Escape and resets when reopened', async () => {
  setup([
    { text: '보기', iconClassName: 'eye', href: '/native-view' },
    { text: '검사', iconClassName: 'info-circle', subMenu: [{ text: '데이터', href: '/native-data' }] },
  ]);
  const trigger = screen.getByRole('button', { name: '가동 시간 추가 작업' });
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('menuitem', { name: '검사' }));
  expect(screen.getAllByRole('menu')).toHaveLength(1);
  expect(screen.queryByRole('menuitem', { name: '보기' })).not.toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: '데이터' })).toHaveAttribute('href', '/native-data');
  await userEvent.keyboard('{Escape}');
  expect(await screen.findByRole('menuitem', { name: '검사' })).toHaveFocus();
  expect(screen.getByRole('menuitem', { name: '보기' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('menuitem', { name: '검사' }));
  await userEvent.click(screen.getByRole('menuitem', { name: '기본 메뉴로 돌아가기' }));
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  await userEvent.click(trigger);
  expect(await screen.findByRole('menuitem', { name: '보기' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '데이터' })).not.toBeInTheDocument();
});

it('keeps native duplicate and delete callbacks distinct and extracts danger to the root', async () => {
  const duplicate = jest.fn();
  const remove = jest.fn();
  setup([
    {
      text: '더보기',
      iconClassName: 'cube',
      subMenu: [
        { text: '복제', iconClassName: 'file-copy-alt', onClick: duplicate },
        { text: '삭제', iconClassName: 'trash-alt', onClick: remove },
      ],
    },
  ]);
  const trigger = screen.getByRole('button', { name: '가동 시간 추가 작업' });
  await userEvent.click(trigger);
  const deletion = await screen.findByRole('menuitem', { name: '삭제' });
  expect(deletion).toHaveAttribute('data-danger', 'true');
  await userEvent.click(screen.getByRole('menuitem', { name: '복제' }));
  expect(duplicate).toHaveBeenCalledTimes(1);
  expect(remove).not.toHaveBeenCalled();
  await userEvent.click(trigger);
  await userEvent.click(await screen.findByRole('menuitem', { name: '삭제' }));
  expect(remove).toHaveBeenCalledTimes(1);
});

it('uses an explicit kiosk policy on ordinary dashboards without a Wall editing context', async () => {
  const menu = new VizPanelMenu({
    items: [
      { text: '보기', iconClassName: 'eye', href: '/view' },
      { text: '편집', iconClassName: 'edit', href: '/edit' },
      {
        text: '추가 작업',
        iconClassName: 'cube',
        subMenu: [{ text: '공유', iconClassName: 'share-alt', onClick: jest.fn() }],
      },
      { text: '검사', iconClassName: 'info-circle', subMenu: [{ text: '쿼리', onClick: jest.fn() }] },
    ],
  });
  const panel = new VizPanel({ title: '공통 패널', pluginId: 'timeseries', menu });
  render(<WallPanelActions panel={panel} policy={{ kiosk: true, readOnly: true }} />);
  await userEvent.click(screen.getByRole('button', { name: '공통 패널 추가 작업' }));
  expect(await screen.findByRole('menuitem', { name: '보기' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '편집' })).not.toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '검사' })).not.toBeInTheDocument();
  // Share remains a native action in More, never silently removed by the UI policy.
  await userEvent.click(screen.getByRole('menuitem', { name: '추가 작업' }));
  expect(await screen.findByRole('menuitem', { name: '공유' })).toBeInTheDocument();
});
