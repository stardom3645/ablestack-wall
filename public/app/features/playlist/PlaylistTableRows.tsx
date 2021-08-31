import React, { FC } from 'react';

import { PlaylistTableRow } from './PlaylistTableRow';
import { PlaylistItem } from './types';

interface PlaylistTableRowsProps {
  items: PlaylistItem[];
  onMoveUp: (item: PlaylistItem) => void;
  onMoveDown: (item: PlaylistItem) => void;
  onDelete: (item: PlaylistItem) => void;
}

export const PlaylistTableRows: FC<PlaylistTableRowsProps> = ({ items, onMoveUp, onMoveDown, onDelete }) => {
  if (items.length === 0) {
    return (
      <tr>
        <td>
          <em>플레이리스트가 비어 있습니다. 아래에 대시보드를 추가하세요.</em>
        </td>
      </tr>
    );
  }

  return (
    <>
      {items.map((item, index) => {
        const first = index === 0;
        const last = index === items.length - 1;
        return (
          <PlaylistTableRow
            first={first}
            last={last}
            item={item}
            onDelete={onDelete}
            onMoveDown={onMoveDown}
            onMoveUp={onMoveUp}
            key={item.title}
          />
        );
      })}
    </>
  );
};
