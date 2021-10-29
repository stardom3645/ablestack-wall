import React, { ChangeEvent, FC, FormEvent, useEffect, useState } from 'react';
import { EventsWithValidation, LegacyForms, ValidationEvents, Button, Select, InlineField } from '@grafana/ui';
import { NewApiKey, OrgRole } from '../../types';
import { rangeUtil, SelectableValue } from '@grafana/data';
import { SlideDown } from '../../core/components/Animations/SlideDown';
import { CloseButton } from 'app/core/components/CloseButton/CloseButton';

const { Input } = LegacyForms;
const ROLE_OPTIONS: Array<SelectableValue<OrgRole>> = Object.keys(OrgRole).map((role) => ({
  label: role,
  value: role as OrgRole,
}));

interface Props {
  show: boolean;
  onClose: () => void;
  onKeyAdded: (apiKey: NewApiKey) => void;
}

function isValidInterval(value: string): boolean {
  if (!value) {
    return true;
  }
  try {
    rangeUtil.intervalToSeconds(value);
    return true;
  } catch {}
  return false;
}

const timeRangeValidationEvents: ValidationEvents = {
  [EventsWithValidation.onBlur]: [
    {
      rule: isValidInterval,
      errorMessage: 'Not a valid duration',
    },
  ],
};

const tooltipText =
  'API 키 수명 기간입니다. 예를 들어 키가 하루 동안 지속되는 경우 1d입니다. 지원되는 단위: s,m,h,d,w,M,y';

export const ApiKeysForm: FC<Props> = ({ show, onClose, onKeyAdded }) => {
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<OrgRole>(OrgRole.Viewer);
  const [secondsToLive, setSecondsToLive] = useState<string>('');
  useEffect(() => {
    setName('');
    setRole(OrgRole.Viewer);
    setSecondsToLive('');
  }, [show]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isValidInterval(secondsToLive)) {
      onKeyAdded({ name, role, secondsToLive });
      onClose();
    }
  };
  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.currentTarget.value);
  };
  const onRoleChange = (role: SelectableValue<OrgRole>) => {
    setRole(role.value!);
  };
  const onSecondsToLiveChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSecondsToLive(event.currentTarget.value);
  };

  return (
    <SlideDown in={show}>
      <div className="gf-form-inline cta-form">
        <CloseButton onClick={onClose} />
        <form className="gf-form-group" onSubmit={onSubmit}>
          <h5>API 키 추가</h5>
          <div className="gf-form-inline">
            <div className="gf-form max-width-21">
              <span className="gf-form-label">Key 이름</span>
              <Input type="text" className="gf-form-input" value={name} placeholder="Name" onChange={onNameChange} />
            </div>
            <div className="gf-form">
              <InlineField label="Role">
                <Select
                  inputId="role-select"
                  value={role}
                  onChange={onRoleChange}
                  options={ROLE_OPTIONS}
                  menuShouldPortal
                />
              </InlineField>
            </div>
            <div className="gf-form max-width-21">
              <InlineField tooltip={tooltipText} label="Time to live">
                <Input
                  id="time-to-live-input"
                  type="text"
                  placeholder="1d"
                  validationEvents={timeRangeValidationEvents}
                  value={secondsToLive}
                  onChange={onSecondsToLiveChange}
                />
              </InlineField>
            </div>
            <div className="gf-form">
              <Button>추가</Button>
            </div>
          </div>
        </form>
      </div>
    </SlideDown>
  );
};
