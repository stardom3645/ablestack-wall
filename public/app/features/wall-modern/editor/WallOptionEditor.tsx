import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Switch } from '@base-ui/react/switch';
import { CircleHelp } from 'lucide-react';
import { cloneElement, useId, useMemo, type ReactElement, type ReactNode } from 'react';

import { standardEditorsRegistry, toIconName, type SelectableValue, type StandardEditorProps } from '@grafana/data';
import { Icon, Tooltip } from '@grafana/ui';

import { Button } from '../ui';

import { wallOptionChoices, wallOptionText } from './optionText';

export function WallOptionChoice<T>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<SelectableValue<T>>;
  onChange: (value: T | undefined) => void;
  label: string;
}) {
  return (
    <RadioGroup
      className="wall-option-choice"
      aria-label={label}
      value={String(options.findIndex((option) => Object.is(option.value, value)))}
      onValueChange={(key) => {
        const option = options.find((_, index) => String(index) === key);
        if (option) {
          onChange(option.value);
        }
      }}
    >
      {options.map((option, index) => {
        const icon = option.icon ? toIconName(option.icon) : undefined;
        return (
          <Radio.Root
            key={index}
            value={String(index)}
            disabled={option.isDisabled}
            className="wall-option-choice-item"
            title={option.description}
            aria-label={option.ariaLabel ?? (option.label || option.description)}
          >
            {icon && <Icon name={icon} size="lg" aria-hidden="true" />}
            {option.imgUrl && <img src={option.imgUrl} alt="" />}
            {option.label || (!icon && !option.imgUrl && !option.component ? option.description : null)}
            {option.component && <option.component />}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}

/** Adapts display metadata only; native values, processors and callbacks stay intact. */
type EditorSettings = {
  placeholder?: string;
  options?: Array<SelectableValue<unknown>>;
  getOptions?: unknown;
  [key: string]: unknown;
};

export function WallOptionEditor({ editor }: { editor: ReactElement<StandardEditorProps<unknown, EditorSettings>> }) {
  const props = editor.props;
  const id = useId();
  const item = useMemo(() => {
    if (!props.item) {
      return undefined;
    }
    const settings = props.item.settings;
    return {
      ...props.item,
      name: wallOptionText(props.item.name),
      description: wallOptionText(props.item.description),
      settings: settings
        ? {
            ...settings,
            displayText: wallOptionText,
            placeholder: settings.placeholder ? wallOptionText(settings.placeholder) : undefined,
            // Dynamic options can contain user-defined field names. Leave those untouched.
            options: settings.options && !settings.getOptions ? wallOptionChoices(settings.options) : settings.options,
          }
        : settings,
    };
  }, [props.item]);
  const standard = standardEditorsRegistry.list().find((entry) => entry.editor === editor.type)?.id;
  if (standard === 'boolean') {
    return (
      <div className="wall-option-switch-row">
        <span>{props.value ? '사용' : '사용 안 함'}</span>
        <Switch.Root
          id={id}
          aria-label={item?.name}
          checked={Boolean(props.value)}
          onCheckedChange={props.onChange}
          className="wall-form-switch"
        >
          <Switch.Thumb className="wall-form-switch-thumb" />
        </Switch.Root>
      </div>
    );
  }
  if (standard === 'radio' && item?.settings?.options) {
    return (
      <WallOptionChoice
        label={item.name}
        value={props.value}
        options={item.settings.options}
        onChange={props.onChange}
      />
    );
  }
  return item ? cloneElement(editor, { item }) : editor;
}

export function WallOptionField({
  title,
  description,
  category,
  editor,
  addon,
  children,
  hideTitle,
}: {
  title: string;
  description?: string;
  category?: string;
  editor: ReactElement;
  addon?: ReactNode;
  children?: ReactNode;
  hideTitle?: boolean;
}) {
  const id = useId();
  const standard = standardEditorsRegistry.list().find((entry) => entry.editor === editor.type)?.id;
  const toggle = standard === 'boolean';
  return (
    <div
      data-control={standard}
      className={`wall-option-field${toggle ? ' wall-option-field-toggle' : ''}`}
      role="group"
      aria-label={hideTitle ? wallOptionText(title) : undefined}
      aria-labelledby={hideTitle ? undefined : `${id}-label`}
    >
      {!hideTitle && (
        <div className="wall-option-field-heading">
          <span id={`${id}-label`}>{wallOptionText(title)}</span>
          {['Min', 'Max'].includes(title) && (
            <small className="wall-range-mode">{editor.props.value == null ? '자동' : '직접 입력'}</small>
          )}
          {category && category !== title && (
            <span className="wall-option-field-category" title={wallOptionText(category)}>
              {wallOptionText(category)}
            </span>
          )}
          {description && (
            <Tooltip content={wallOptionText(description)}>
              <Button
                variant="ghost"
                size="icon"
                className="wall-field-help"
                aria-label={`${wallOptionText(title)} 도움말`}
              >
                <CircleHelp size={13} />
              </Button>
            </Tooltip>
          )}
          {addon}
          {children}
        </div>
      )}
      <div className="wall-option-control">
        <WallOptionEditor editor={editor} />
      </div>
    </div>
  );
}
