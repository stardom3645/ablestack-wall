import { useState } from 'react';

import { Input, Field, FieldSet } from '@grafana/ui';
import { Form } from 'app/core/components/Form/Form';
import { contextSrv } from 'app/core/core';
import { getMessageFromError } from 'app/core/utils/errors';
import { Button } from 'app/features/wall-modern/ui';
import { AccessControlAction } from 'app/types';

import { Trans } from '../../core/internationalization';

export interface Props {
  orgName: string;
  onSubmit: (orgName: string) => void | Promise<void>;
}
interface FormDTO {
  orgName: string;
}

const OrgProfile = ({ onSubmit, orgName }: Props) => {
  const canWriteOrg = contextSrv.hasPermission(AccessControlAction.OrgsWrite);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const submit = async ({ orgName }: FormDTO) => {
    if (!canWriteOrg || saving) {
      return;
    }
    setSaving(true);
    setResult('');
    setError('');
    try {
      await onSubmit(orgName);
      setResult('조직 이름을 저장했습니다.');
    } catch (error) {
      setError(getMessageFromError(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Form defaultValues={{ orgName }} onSubmit={submit}>
      {({ register, errors }) => (
        <FieldSet disabled={!canWriteOrg || saving}>
          <Field
            label={<Trans i18nKey="shared-preferences.fields.organization-name-label">Organization name</Trans>}
            description="현재 조직을 식별하는 이름입니다."
            invalid={Boolean(errors.orgName)}
            error={errors.orgName ? '조직 이름을 입력하세요.' : undefined}
          >
            <Input
              id="org-name-input"
              type="text"
              {...register('orgName', { required: true })}
              onInput={() => {
                setResult('');
                setError('');
              }}
            />
          </Field>
          <div className="wall-admin-save-row">
            <Button render={<button type="submit" />} variant="default" disabled={!canWriteOrg || saving}>
              {saving ? '저장 중…' : '조직 이름 저장'}
            </Button>
            {result && <span role="status">{result}</span>}
            {error && (
              <span role="alert" className="wall-admin-danger">
                {error}
              </span>
            )}
          </div>
        </FieldSet>
      )}
    </Form>
  );
};
export default OrgProfile;
