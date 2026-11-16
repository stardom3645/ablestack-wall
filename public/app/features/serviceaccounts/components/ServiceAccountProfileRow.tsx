import { useEffect, useRef, useState } from 'react';

import { Input, Label } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { Button } from 'app/features/wall-modern/ui';

interface Props {
  label: string;
  value?: string;
  inputType?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export const ServiceAccountProfileRow = ({ label, value, inputType, disabled, onChange }: Props): JSX.Element => {
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value ?? '');
  const [editing, setEditing] = useState(false);
  const inputId = `${label}-input`;
  useEffect(() => {
    if (editing) {
      input.current?.focus();
    }
  }, [editing]);
  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };
  const save = () => {
    if (draft.trim()) {
      onChange?.(draft);
      setEditing(false);
    }
  };
  return (
    <div className="wall-service-profile-row">
      <div>
        <Label htmlFor={editing ? inputId : undefined}>{label}</Label>
      </div>
      <div className="wall-service-profile-value">
        {editing && !disabled ? (
          <Input
            id={inputId}
            ref={input}
            type={inputType}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                cancel();
              }
              if (event.key === 'Enter') {
                event.preventDefault();
                save();
              }
            }}
          />
        ) : (
          <span title={value}>{value}</span>
        )}
      </div>
      <div className="wall-admin-actions">
        {onChange &&
          (editing ? (
            <>
              <Button size="sm" variant="default" onClick={save} disabled={disabled || !draft.trim()}>
                <Trans i18nKey="wall.enterprise.text-1f1712ac">저장</Trans>
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                <Trans i18nKey="wall.enterprise.text-19b2d19b">취소</Trans>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                setDraft(value ?? '');
                setEditing(true);
              }}
            >
              <Trans i18nKey="wall.enterprise.text-d482e14b">편집</Trans>
            </Button>
          ))}
      </div>
    </div>
  );
};
