import { useMemo } from 'react';

import { Trans } from 'app/core/internationalization';

import { PermissionListItem } from './PermissionListItem';
import { ResourcePermission } from './types';

interface Props {
  wallPresentation?: boolean;
  title: string;
  compareKey: 'builtInRole' | 'userLogin' | 'team';
  items: ResourcePermission[];
  permissionLevels: string[];
  canSet: boolean;
  onRemove: (item: ResourcePermission) => void;
  onChange: (resourcePermission: ResourcePermission, permission: string) => void;
}

export const PermissionList = ({
  title,
  items,
  compareKey,
  permissionLevels,
  canSet,
  onRemove,
  onChange,
  wallPresentation,
}: Props) => {
  const computed = useMemo(() => {
    const keep: { [key: string]: ResourcePermission } = {};
    for (let item of items) {
      const key = item[compareKey]!;
      if (!keep[key]) {
        keep[key] = item;
        continue;
      }

      if (item.actions.length > keep[key].actions.length) {
        keep[key] = item;
        continue;
      }

      // If the same permission has been inherited and applied directly, keep the one that is applied directly
      if (item.actions.length === keep[key].actions.length && !item.isInherited) {
        keep[key] = item;
      }
    }
    return Object.keys(keep).map((k) => keep[k]);
  }, [items, compareKey]);

  if (computed.length === 0) {
    return null;
  }

  if (wallPresentation) {
    return (
      <section className="wall-permission-group" aria-label={title}>
        <h3>{title}</h3>
        <ul>
          {computed.map((item, index) => (
            <PermissionListItem
              key={`${index}-${item.userId}`}
              wallPresentation
              item={item}
              onRemove={onRemove}
              onChange={onChange}
              canSet={canSet}
              permissionLevels={permissionLevels}
            />
          ))}
        </ul>
      </section>
    );
  }
  return (
    <div>
      <table className="filter-table gf-form-group">
        <thead>
          <tr>
            <th style={{ width: '1%' }} />
            <th>{title}</th>
            <th style={{ width: '1%' }} />

            <th style={{ width: '40%' }}>
              <Trans i18nKey="access-control.permission-list.permission">Permission</Trans>
            </th>

            <th style={{ width: '1%' }} />
            <th style={{ width: '1%' }} />
          </tr>
        </thead>
        <tbody>
          {computed.map((item, index) => (
            <PermissionListItem
              item={item}
              onRemove={onRemove}
              onChange={onChange}
              canSet={canSet}
              key={`${index}-${item.userId}`}
              permissionLevels={permissionLevels}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
