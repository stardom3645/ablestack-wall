import { UseFieldArrayRemove } from 'react-hook-form';

import { Button } from '@grafana/ui';
import { t } from 'app/core/internationalization';

interface RemoveButtonProps {
  remove: UseFieldArrayRemove;
  index: number;
}
export function RemoveButton({ remove, index }: RemoveButtonProps) {
  return (
    <Button
      aria-label="delete label"
      icon="trash-alt"
      data-testid={`delete-label-${index}`}
      variant="secondary"
      onClick={() => {
        remove(index);
      }}
    />
  );
}

interface AddButtonProps {
  append: () => void;
}
export function AddButton({ append }: AddButtonProps) {
  return (
    <Button icon="plus" type="button" variant="secondary" onClick={append}>
      {t('ablestack-wall.alert.add-more', 'Add more')}
    </Button>
  );
}
