import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import type { StandardEditorProps } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';

import { wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, wallEditorTypographyVariables } from '../typography';
import { Button } from '../ui';

import { metricProfile, metricProfiles, type MetricType } from './metricProfiles';
import './timeSeries.css';

export function WallMetricTypeEditor({ value, onChange }: StandardEditorProps<MetricType>) {
  const theme = useTheme2();
  const profile = metricProfile(value);
  return (
    <div className="wall-metric-profile">
      <Select.Root items={metricProfiles} value={profile.value} onValueChange={(next) => next && onChange(next)}>
        <Select.Trigger aria-label="지표 유형 선택" render={<Button className="wall-metric-trigger" />}>
          <Select.Value />
          <ChevronDown size={14} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="wall-toolbar-positioner" sideOffset={4} alignItemWithTrigger={false}>
            <Select.Popup
              className="wall-modern wall-metric-popup"
              style={{
                ...wallSurfaceVariables(theme.isDark, true),
                ...wallTypographyVariables,
                ...wallEditorTypographyVariables,
              }}
            >
              <Select.List>
                {metricProfiles.map((item) => (
                  <Select.Item key={item.value} value={item.value} className="wall-metric-option">
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <p className="wall-metric-hint">{profile.hint}</p>
      <p className="wall-metric-hint">
        <Trans i18nKey="wall.wall-metric-type-editor.text-13f3af22">권장 스타일: 선 </Trans>
        {profile.lineWidth}
        <Trans i18nKey="wall.wall-metric-type-editor.text-31739dca">px · 영역 채움 사용 시 </Trans>
        {profile.fillOpacity}
        <Trans i18nKey="wall.wall-metric-type-editor.text-4345cb1f">%</Trans>
      </p>
      <small className="wall-metric-policy">
        <Trans i18nKey="wall.wall-metric-type-editor.text-6ef1f40c">
          사용자 설정과 필드별 재정의가 우선하며, 데이터·단위·임계치는 변경하지 않습니다.
        </Trans>
      </small>
    </div>
  );
}
