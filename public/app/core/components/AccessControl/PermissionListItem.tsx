import { css } from '@emotion/css';
import { LockKeyhole, Trash2 } from 'lucide-react';

import { GrafanaTheme2 } from '@grafana/data';
import { Box, Button, Icon, Select, Tooltip, useStyles2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { UserIdentity } from 'app/features/admin/Users/WallUsers';
import { WallChoice } from 'app/features/wall-modern/management/WallChoice';
import { Button as WallButton } from 'app/features/wall-modern/ui';

import { ResourcePermission } from './types';

interface Props {
  wallPresentation?: boolean;
  item: ResourcePermission;
  permissionLevels: string[];
  canSet: boolean;
  onRemove: (item: ResourcePermission) => void;
  onChange: (item: ResourcePermission, permission: string) => void;
}

export const PermissionListItem = ({ item, permissionLevels, canSet, onRemove, onChange, wallPresentation }: Props) => {
  const styles = useStyles2(getStyles);

  if (wallPresentation) {
    const name = getName(item) ?? '';
    return (
      <li className="wall-permission-row">
        <div className="wall-permission-identity">
          <UserIdentity login={name} avatarUrl={item.userAvatarUrl ?? item.teamAvatarUrl} />
          {item.isInherited && (
            <small>
              <Trans i18nKey="wall.enterprise.text-1b23a65c">폴더에서 상속됨</Trans>
            </small>
          )}
        </div>
        <WallChoice
          value={item.permission}
          options={permissionLevels.map((value) => ({ value, label: value }))}
          label={`${name} 접근 권한: ${item.permission}`}
          disabled={!canSet || !item.isManaged}
          onChange={(permission) => onChange(item, permission)}
        />
        <Tooltip
          content={
            <>
              {item.warning && <Box marginBottom={1}>{item.warning}</Box>}
              {getPermissionInfo(item)}
            </>
          }
        >
          <WallButton
            variant="ghost"
            size="icon"
            className={item.warning ? styles.warning : undefined}
            aria-label={`${name} 권한 상세`}
          >
            <Icon name={item.warning ? 'exclamation-triangle' : 'info-circle'} />
          </WallButton>
        </Tooltip>
        {item.isManaged ? (
          <WallButton
            size="icon"
            variant="ghost"
            className="wall-admin-danger"
            disabled={!canSet}
            onClick={() => onRemove(item)}
            aria-label={`Remove permission for ${name}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </WallButton>
        ) : (
          <span title={item.isInherited ? '상속된 권한' : '프로비저닝된 권한'}>
            <LockKeyhole size={15} aria-label="잠긴 권한" />
          </span>
        )}
      </li>
    );
  }
  return (
    <tr>
      <td>{getAvatar(item)}</td>
      <td>{getDescription(item)}</td>
      <td>{item.isInherited && <em className={styles.inherited}>Inherited from folder</em>}</td>
      <td>
        <Select
          disabled={!canSet || !item.isManaged}
          onChange={(p) => onChange(item, p.value!)}
          value={permissionLevels.find((p) => p === item.permission)}
          options={permissionLevels.map((p) => ({ value: p, label: p }))}
        />
      </td>
      <td>
        {item.warning ? (
          <Tooltip
            content={
              <>
                <Box marginBottom={1}>{item.warning}</Box>
                {getPermissionInfo(item)}
              </>
            }
          >
            <Icon name="exclamation-triangle" className={styles.warning} />
          </Tooltip>
        ) : (
          <Tooltip content={getPermissionInfo(item)}>
            <Icon name="info-circle" />
          </Tooltip>
        )}
      </td>
      <td>
        {item.isManaged ? (
          <Button
            size="sm"
            icon="times"
            variant="destructive"
            disabled={!canSet}
            onClick={() => onRemove(item)}
            aria-label={`Remove permission for ${getName(item)}`}
          />
        ) : (
          <Tooltip content={item.isInherited ? 'Inherited Permission' : 'Provisioned Permission'}>
            <Button size="sm" icon="lock" aria-label="Locked permission indicator" />
          </Tooltip>
        )}
      </td>
    </tr>
  );
};

const getAvatar = (item: ResourcePermission) => {
  if (item.teamId) {
    return <img className="filter-table__avatar" src={item.teamAvatarUrl} alt={`Avatar for team ${item.teamId}`} />;
  } else if (item.userId) {
    return <img className="filter-table__avatar" src={item.userAvatarUrl} alt={`Avatar for user ${item.userId}`} />;
  }
  return <Icon size="xl" name="shield" />;
};

const getName = (item: ResourcePermission) => {
  if (item.userId) {
    return item.userLogin;
  }
  if (item.teamId) {
    return item.team;
  }
  return item.builtInRole;
};

const getDescription = (item: ResourcePermission) => {
  if (item.userId) {
    return <span key="name">{item.userLogin} </span>;
  } else if (item.teamId) {
    return <span key="name">{item.team} </span>;
  } else if (item.builtInRole) {
    return <span key="name">{item.builtInRole} </span>;
  }
  return <span key="name" />;
};

const getPermissionInfo = (p: ResourcePermission) => `Actions: ${[...new Set(p.actions)].sort().join(' ')}`;

const getStyles = (theme: GrafanaTheme2) => ({
  warning: css({
    color: theme.colors.warning.main,
  }),
  inherited: css({
    color: theme.colors.text.secondary,
    flexWrap: 'nowrap',
  }),
});
