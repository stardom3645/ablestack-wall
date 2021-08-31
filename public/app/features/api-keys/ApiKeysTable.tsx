import React, { FC } from 'react';
import { DeleteButton } from '@grafana/ui';
import { dateTimeFormat, TimeZone } from '@grafana/data';

import { ApiKey } from '../../types';

interface Props {
  apiKeys: ApiKey[];
  timeZone: TimeZone;
  onDelete: (apiKey: ApiKey) => void;
}

export const ApiKeysTable: FC<Props> = ({ apiKeys, timeZone, onDelete }) => {
  return (
    <table className="filter-table">
      <thead>
        <tr>
          <th>이름</th>
          <th>권한</th>
          <th>만료일</th>
          <th style={{ width: '34px' }} />
        </tr>
      </thead>
      {apiKeys.length > 0 ? (
        <tbody>
          {apiKeys.map((key) => {
            return (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>{key.role}</td>
                <td>{formatDate(key.expiration, timeZone)}</td>
                <td>
                  <DeleteButton size="sm" onConfirm={() => onDelete(key)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      ) : null}
    </table>
  );
};

function formatDate(expiration: string | undefined, timeZone: TimeZone): string {
  if (!expiration) {
    return '만료일 없음';
  }
  return dateTimeFormat(expiration, { timeZone });
}
