import { PanelMenuItem } from '@grafana/data';

const identity = (item: PanelMenuItem) => `${item.iconClassName ?? ''} ${item.text}`;
export const isDangerAction = (item: PanelMenuItem) => /trash|remove|delete|삭제|제거/i.test(identity(item));

/** Groups are presentation headers, not actions. Keep every real native leaf/callback. */
export function commandItems(items: PanelMenuItem[], readOnly = false, kiosk = false): PanelMenuItem[] {
  return items.flatMap((item) => {
    if (item.type === 'divider') {
      return [];
    }
    if (readOnly && /edit|duplicate|remove|delete|trash|편집|복제|삭제|제거/i.test(identity(item))) {
      return [];
    }
    // Native Inspector includes Query/JSON tabs; kiosk hides its entry rather
    // than reimplementing that tool or introducing another permission model.
    if (kiosk && item.iconClassName === 'info-circle') {
      return [];
    }
    if (
      kiosk &&
      /query|json|쿼리|질의|copy|library|alert|라이브러리|복사|경보/i.test(`${identity(item)} ${item.href ?? ''}`)
    ) {
      return [];
    }
    const children = item.subMenu ? commandItems(item.subMenu, readOnly, kiosk) : undefined;
    if (item.type === 'group') {
      return children ?? [];
    }
    if (children) {
      return children.length ? [{ ...item, subMenu: children }] : [];
    }
    return [item];
  });
}

export function splitCommandItems(items: PanelMenuItem[]) {
  const danger: PanelMenuItem[] = [];
  const collect = (items: PanelMenuItem[]): PanelMenuItem[] =>
    items.flatMap((item) => {
      if (isDangerAction(item)) {
        danger.push(item);
        return [];
      }
      if (item.subMenu) {
        const subMenu = collect(item.subMenu);
        return subMenu.length ? [{ ...item, subMenu }] : [];
      }
      return [item];
    });
  const safe = collect(items);
  const find = (entries: PanelMenuItem[], icon: string): PanelMenuItem | undefined =>
    entries.find((item) => item.iconClassName === icon) ??
    entries.flatMap((item) => (item.subMenu ? [find(item.subMenu, icon)] : [])).find(Boolean);
  const quick = ['eye', 'edit', 'file-copy-alt'].flatMap((icon) => {
    const item = find(safe, icon);
    return item ? [item] : [];
  });
  const remaining = (entries: PanelMenuItem[]): PanelMenuItem[] =>
    entries.flatMap((item) => {
      if (quick.includes(item)) {
        return [];
      }
      if (item.subMenu) {
        const subMenu = remaining(item.subMenu);
        return subMenu.length ? [{ ...item, subMenu }] : [];
      }
      return [item];
    });
  let regular = remaining(safe);
  const more = regular.find((item) => item.iconClassName === 'cube' && item.subMenu);
  const sharing = regular.filter((item) => item.iconClassName === 'share-alt');
  if (more && sharing.length) {
    more.subMenu = [...sharing, ...more.subMenu!];
    regular = regular.filter((item) => !sharing.includes(item));
  }
  return { quick, regular, danger };
}
