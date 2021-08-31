import React, { useMemo } from 'react';

import { Button, Checkbox, Form, Modal, TextArea } from '@grafana/ui';
import { selectors } from '@grafana/e2e-selectors';

import { SaveDashboardFormProps } from '../types';

interface SaveDashboardFormDTO {
  message: string;
  saveVariables: boolean;
  saveTimerange: boolean;
}

export const SaveDashboardForm: React.FC<SaveDashboardFormProps> = ({ dashboard, onCancel, onSuccess, onSubmit }) => {
  const hasTimeChanged = useMemo(() => dashboard.hasTimeChanged(), [dashboard]);
  const hasVariableChanged = useMemo(() => dashboard.hasVariableValuesChanged(), [dashboard]);

  return (
    <Form
      onSubmit={async (data: SaveDashboardFormDTO) => {
        if (!onSubmit) {
          return;
        }

        const result = await onSubmit(dashboard.getSaveModelClone(data), data, dashboard);
        if (result.status === 'success') {
          if (data.saveVariables) {
            dashboard.resetOriginalVariables();
          }
          if (data.saveTimerange) {
            dashboard.resetOriginalTime();
          }
          onSuccess();
        }
      }}
    >
      {({ register, errors }) => (
        <>
          <div>
            {hasTimeChanged && (
              <Checkbox
                {...register('saveTimerange')}
                label="현재 시간 범위를 대시보드 기본값으로 저장"
                aria-label={selectors.pages.SaveDashboardModal.saveTimerange}
              />
            )}
            {hasVariableChanged && (
              <Checkbox
                {...register('saveVariables')}
                label="현재 변수 값을 대시보드 기본값으로 저장"
                aria-label={selectors.pages.SaveDashboardModal.saveVariables}
              />
            )}
            {(hasVariableChanged || hasTimeChanged) && <div className="gf-form-group" />}

            <TextArea {...register('message')} placeholder="변경 사항을 설명하는 메모를 추가합니다." autoFocus />
          </div>

          <Modal.ButtonRow>
            <Button variant="secondary" onClick={onCancel} fill="outline">
              취소
            </Button>
            <Button type="submit" aria-label={selectors.pages.SaveDashboardModal.save}>
              저장
            </Button>
          </Modal.ButtonRow>
        </>
      )}
    </Form>
  );
};
