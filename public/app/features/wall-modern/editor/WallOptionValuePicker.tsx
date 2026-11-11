import { useContext, type ComponentProps } from 'react';

import { ValuePicker } from '@grafana/ui';

import { editorPresentationContext } from './EditorPresentationContext';
import { wallOptionText } from './optionText';

export function WallOptionValuePicker(props: ComponentProps<typeof ValuePicker<string>>) {
  const wall = useContext(editorPresentationContext);
  const picker = (
    <ValuePicker
      {...props}
      label={wall ? wallOptionText(props.label) : props.label}
      options={
        wall
          ? props.options.map((option) => ({
              ...option,
              label: option.label?.split(' > ').map(wallOptionText).join(' > '),
              description: option.description ? wallOptionText(option.description) : undefined,
            }))
          : props.options
      }
    />
  );
  return wall ? <div className="wall-option-action">{picker}</div> : picker;
}
