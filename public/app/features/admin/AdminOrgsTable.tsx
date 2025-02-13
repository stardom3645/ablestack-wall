import { css } from '@emotion/css';
import { useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, ConfirmModal, useStyles2 } from '@grafana/ui';
import { SkeletonComponent, attachSkeleton } from '@grafana/ui/src/unstable';
import { contextSrv } from 'app/core/core';
import { AccessControlAction, Organization } from 'app/types';

import {t} from "../../core/internationalization";

interface Props {
  orgs: Organization[];
  onDelete: (orgId: number) => void;
}

const getTableHeader = () => (
  <thead>
    <tr>
      <th>{t("ablestack-wall.common.id", "ID")}</th>
      <th>{t("ablestack-wall.common.name", "Name")}</th>
      <th style={{ width: '1%' }}></th>
    </tr>
  </thead>
);

function AdminOrgsTableComponent({ orgs, onDelete }: Props) {
  const canDeleteOrgs = contextSrv.hasPermission(AccessControlAction.OrgsDelete);

  const [deleteOrg, setDeleteOrg] = useState<Organization>();
  return (
    <table className="filter-table form-inline filter-table--hover">
      {getTableHeader()}
      <tbody>
        {orgs.map((org) => (
          <tr key={`${org.id}-${org.name}`}>
            <td className="link-td">
              <a href={`admin/orgs/edit/${org.id}`}>{org.id}</a>
            </td>
            <td className="link-td">
              <a href={`admin/orgs/edit/${org.id}`}>{org.name}</a>
            </td>
            <td className="text-right">
              <Button
                variant="destructive"
                size="sm"
                icon="times"
                onClick={() => setDeleteOrg(org)}
                aria-label="Delete org"
                disabled={!canDeleteOrgs}
              />
            </td>
          </tr>
        ))}
      </tbody>
      {deleteOrg && (
        <ConfirmModal
          isOpen
          icon="trash-alt"
          title={t("ablestack-wall.common.delete", "Delete")}
          body={
            <div>
              {t('ablestack-wall.administration.general.confirm-delete-org', 'Are you sure you want to delete {{orgName}}?', {orgName: deleteOrg.name,})}
              <br /> <small>{t('ablestack-wall.administration.general.confirm-sub-delete-org', "All dashboards for this organization will be removed!")}</small>
            </div>
          }
          confirmText={t("ablestack-wall.common.delete", "Delete")}
          dismissText={t("ablestack-wall.common.cancel", "Cancel")}
          onDismiss={() => setDeleteOrg(undefined)}
          onConfirm={() => {
            onDelete(deleteOrg.id);
            setDeleteOrg(undefined);
          }}
        />
      )}
    </table>
  );
}

const AdminOrgsTableSkeleton: SkeletonComponent = ({ rootProps }) => {
  const styles = useStyles2(getSkeletonStyles);
  return (
    <table className="filter-table" {...rootProps}>
      {getTableHeader()}
      <tbody>
        {new Array(3).fill(null).map((_, index) => (
          <tr key={index}>
            <td>
              <Skeleton width={16} />
            </td>
            <td>
              <Skeleton width={240} />
            </td>
            <td>
              <Skeleton containerClassName={styles.deleteButton} width={22} height={24} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const AdminOrgsTable = attachSkeleton(AdminOrgsTableComponent, AdminOrgsTableSkeleton);

const getSkeletonStyles = (theme: GrafanaTheme2) => ({
  deleteButton: css({
    alignItems: 'center',
    display: 'flex',
    height: 30,
    lineHeight: 1,
  }),
});
