import { Input as BaseInput } from '@base-ui/react/input';
import { useId } from '@react-aria/utils';
import { FormEvent, PropsWithChildren } from 'react';
import * as React from 'react';

import { Field, Input } from '@grafana/ui';
import { useWallSettings } from 'app/features/wall-modern/management/SettingsPresentationContext';

interface VariableTextFieldProps {
  value?: string;
  defaultValue?: string;
  name: string;
  placeholder?: string;
  onChange?: (event: FormEvent<HTMLInputElement>) => void;
  testId?: string;
  required?: boolean;
  width?: number;
  grow?: boolean;
  onBlur?: (event: FormEvent<HTMLInputElement>) => void;
  maxLength?: number;
  description?: React.ReactNode;
  invalid?: boolean;
  error?: React.ReactNode;
}

export function VariableTextField({
  value,
  defaultValue,
  name,
  placeholder = '',
  onChange,
  testId,
  width,
  required,
  onBlur,
  grow,
  description,
  invalid,
  error,
  maxLength,
}: PropsWithChildren<VariableTextFieldProps>) {
  const id = useId(name);
  const wallSettings = useWallSettings();
  if (wallSettings) {
    return (
      <div className="wall-form-field">
        <label htmlFor={id}>{name}</label>
        <BaseInput
          className="wall-form-input"
          id={id}
          type="text"
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onBlur={onBlur}
          data-testid={testId}
          maxLength={maxLength}
          required={required}
          aria-invalid={!!invalid}
          aria-describedby={description || error ? `${id}-help` : undefined}
        />
        {(description || error) && (
          <p id={`${id}-help`} role={invalid ? 'alert' : undefined}>
            {error || description}
          </p>
        )}
      </div>
    );
  }

  return (
    <Field label={name} description={description} invalid={invalid} error={error} htmlFor={id}>
      <Input
        type="text"
        id={id}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        width={grow ? undefined : (width ?? 30)}
        data-testid={testId}
        maxLength={maxLength}
        required={required}
      />
    </Field>
  );
}
