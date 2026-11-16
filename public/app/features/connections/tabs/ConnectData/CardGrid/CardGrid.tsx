import * as React from 'react';

import { PluginAngularBadge } from 'app/features/plugins/admin/components/Badges';

export type CardGridItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  logo?: string;
  angularDetected?: boolean;
};

export interface CardGridProps {
  items: CardGridItem[];
  onClickItem?: (e: React.MouseEvent<HTMLElement>, item: CardGridItem) => void;
}

export const CardGrid = ({ items, onClickItem }: CardGridProps) => {
  return (
    <div className="wall-plugin-list" aria-label="연결 유형 목록">
      {items.map((item) => (
        <a key={item.id} className="wall-plugin-item" href={item.url} onClick={(event) => onClickItem?.(event, item)}>
          <span className="wall-plugin-logo">
            <img src={item.logo} alt="" />
          </span>
          <div>
            <h2>{item.name}</h2>
            {item.description && <p>{item.description}</p>}
            {item.angularDetected && (
              <div className="wall-plugin-badges">
                <PluginAngularBadge />
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
};
