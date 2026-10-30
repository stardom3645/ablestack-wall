import { PanelMenuItem } from '@grafana/data';

import { commandItems, splitCommandItems } from './panelCommandModel';

it('preserves every native action and callback while removing decorative groups and dividers', () => {
  const callback = jest.fn();
  const items: PanelMenuItem[] = [
    { text: '보기', iconClassName: 'eye', href: '/native' },
    { text: '공유', iconClassName: 'share-alt', onClick: callback },
    { text: '그룹', type: 'group', subMenu: [{ text: '확장 분석', href: '/extension', onClick: callback }] },
    { text: '', type: 'divider' },
    { text: '추가 작업', subMenu: [{ text: '삭제', iconClassName: 'trash-alt', onClick: callback }] },
  ];
  const snapshot = JSON.stringify(items);
  const result = splitCommandItems(commandItems(items));
  expect(result.quick.map((item) => item.text)).toEqual(['보기']);
  expect(result.regular).toContain(items[2].subMenu![0]);
  expect(result.danger[0].onClick).toBe(callback);
  expect(JSON.stringify(items)).toBe(snapshot);
});

it('promotes native duplicate to the third quick slot and moves sharing into More without losing its callback', () => {
  const share = jest.fn();
  const duplicate = jest.fn();
  const items: PanelMenuItem[] = [
    { text: '보기', iconClassName: 'eye' },
    { text: '편집', iconClassName: 'edit' },
    { text: '공유', iconClassName: 'share-alt', onClick: share },
    {
      text: '추가 작업',
      iconClassName: 'cube',
      subMenu: [{ text: '복제', iconClassName: 'file-copy-alt', onClick: duplicate }, { text: '도움' }],
    },
  ];
  const result = splitCommandItems(items);
  expect(result.quick.map((item) => item.text)).toEqual(['보기', '편집', '복제']);
  expect(result.quick[2].onClick).toBe(duplicate);
  expect(result.regular[0].subMenu?.map((item) => item.text)).toEqual(['공유', '도움']);
  expect(result.regular[0].subMenu?.[0].onClick).toBe(share);
  expect(items[3].subMenu).toHaveLength(2);
});

it('keeps permitted sharing in kiosk while filtering query and management recursively', () => {
  const items: PanelMenuItem[] = [
    { text: '편집', iconClassName: 'edit' },
    { text: '공유', iconClassName: 'share-alt' },
    {
      text: '검사',
      iconClassName: 'info-circle',
      subMenu: [{ text: '데이터' }, { text: '쿼리' }, { text: '패널 JSON' }],
    },
    { text: '더보기', subMenu: [{ text: '복제' }, { text: '삭제' }] },
  ];
  expect(commandItems(items, true, true)).toEqual([items[1]]);
  expect(commandItems(items, true, false)[1].subMenu).toHaveLength(3);
});
