import { Input } from '@base-ui/react/input';
import { Switch } from '@base-ui/react/switch';
import { useId, type PropsWithChildren, type ReactNode } from 'react';

import { Trans } from 'app/core/internationalization';

interface Props {
  title: string;
  description?: string;
  transparent: boolean;
  onTitle: (title: string) => void;
  onDescription: (description: string) => void;
  onTransparent: (transparent: boolean) => void;
  titleAddon?: ReactNode;
  descriptionAddon?: ReactNode;
}

/** Common panel identity form. All values are passed straight to native Scene callbacks. */
export function WallPanelDetails({
  title,
  description,
  transparent,
  onTitle,
  onDescription,
  onTransparent,
  titleAddon,
  descriptionAddon,
  children,
}: PropsWithChildren<Props>) {
  const id = useId();
  return (
    <div className="wall-studio-details">
      <div className="wall-studio-detail-field">
        <div className="wall-studio-detail-label">
          <label htmlFor={`${id}-title`}>
            <Trans i18nKey="wall.studio.title">패널 제목</Trans>
          </label>
          {titleAddon}
        </div>
        <Input id={`${id}-title`} value={title} onValueChange={onTitle} />
      </div>
      <div className="wall-studio-detail-field">
        <div className="wall-studio-detail-label">
          <label htmlFor={`${id}-description`}>
            <Trans i18nKey="wall.studio.description">설명</Trans>
          </label>
          {descriptionAddon}
        </div>
        <textarea
          id={`${id}-description`}
          rows={4}
          value={description ?? ''}
          onChange={(event) => onDescription(event.currentTarget.value)}
        />
      </div>
      <div className="wall-studio-detail-switch">
        <div>
          <label id={`${id}-transparent-label`} htmlFor={`${id}-transparent`}>
            <Trans i18nKey="wall.studio.transparent">투명 배경</Trans>
          </label>
          <p>
            <Trans i18nKey="wall.studio.transparent-description">시각화의 배경을 숨깁니다.</Trans>
          </p>
        </div>
        <Switch.Root
          id={`${id}-transparent`}
          aria-labelledby={`${id}-transparent-label`}
          className="wall-studio-switch"
          checked={transparent}
          onCheckedChange={onTransparent}
        >
          <Switch.Thumb />
        </Switch.Root>
      </div>
      {children}
    </div>
  );
}
