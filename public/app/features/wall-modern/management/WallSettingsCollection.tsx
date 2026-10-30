import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { type PropsWithChildren, type ReactNode } from 'react';

import { t, Trans } from 'app/core/internationalization';

import { Button } from '../ui';

export function WallSettingsCollection({
  title,
  description,
  count,
  onAdd,
  addLabel,
  children,
  footer,
}: PropsWithChildren<{
  title: string;
  description: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  footer?: ReactNode;
}>) {
  return (
    <section className="wall-settings-collection">
      <header className="wall-collection-heading">
        <div>
          <h3>
            {title}
            <span>{count}</span>
          </h3>
          <p>{description}</p>
        </div>
        <Button variant="default" size="sm" onClick={onAdd}>
          <Plus size={15} />
          {addLabel}
        </Button>
      </header>
      <div className="wall-collection-rows">{children}</div>
      {count === 0 && (
        <p className="wall-collection-empty">
          <Trans i18nKey="wall.settings.collection-empty">아직 등록된 항목이 없습니다.</Trans>
        </p>
      )}
      {footer && <footer className="wall-collection-footer">{footer}</footer>}
    </section>
  );
}
export function WallCollectionOrder({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (direction: number) => void;
}) {
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        disabled={index === 0}
        aria-label={t('wall.settings.move-up', '위로 이동')}
        title={t('wall.settings.move-up', '위로 이동')}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={15} />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        disabled={index === count - 1}
        aria-label={t('wall.settings.move-down', '아래로 이동')}
        title={t('wall.settings.move-down', '아래로 이동')}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={15} />
      </Button>
    </>
  );
}

export function WallSettingsColumns({ children, enabled }: PropsWithChildren<{ enabled: boolean }>) {
  return enabled ? <div className="wall-variable-grid">{children}</div> : <>{children}</>;
}
export function WallSettingsRegion({ children, enabled }: PropsWithChildren<{ enabled: boolean }>) {
  return enabled ? <section className="wall-form-section wall-variable-region">{children}</section> : <>{children}</>;
}
