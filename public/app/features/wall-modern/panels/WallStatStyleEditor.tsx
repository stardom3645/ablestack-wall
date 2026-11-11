import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import type { StandardEditorProps } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { StatPresentationStyle, statPresentationStyle } from '@grafana/ui/src/components/BigValue/StatCardPresentation';

import { wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, wallEditorTypographyVariables } from '../typography';
import { Button } from '../ui';
import '../charts/timeSeries.css';

const choices = [
  { value: 'legacy', label: '기존 Grafana 호환 표현' },
  { value: 'soft', label: 'Wall Soft Surface · 추천' },
  { value: 'minimal', label: 'Wall Minimal' },
] satisfies Array<{ value: StatPresentationStyle; label: string }>;

/** Explicit presentation only. The native colorMode and field configuration stay untouched. */
export function WallStatStyleEditor({
  value,
  onChange,
  context,
}: StandardEditorProps<StatPresentationStyle | undefined>) {
  const theme = useTheme2();
  const style = statPresentationStyle(value);
  const options: { colorMode?: string; textMode?: string } | undefined = context.options;
  const policy =
    style === 'legacy'
      ? '저장된 숫자색·단색 배경·그라데이션을 그대로 표시합니다.'
      : options?.textMode === 'none'
        ? '텍스트 없음에서는 숫자·Accent를 표시하지 않습니다. 보조 그래프 설정은 유지합니다.'
        : options?.colorMode === 'none'
          ? '색상 적용이 없음이므로 Accent도 표시하지 않습니다.'
          : '큰 숫자는 중립색, 설정된 필드 색은 작은 Accent로 표시합니다. 기존 색상 모드는 보존되며 호환 표현을 선택하면 복원됩니다.';
  return (
    <div className="wall-metric-profile">
      <Select.Root<StatPresentationStyle>
        items={choices}
        value={style}
        onValueChange={(next) => next && onChange(next)}
      >
        <Select.Trigger aria-label="Stat 표현 스타일" render={<Button className="wall-metric-trigger" />}>
          <Select.Value />
          <ChevronDown size={14} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="wall-toolbar-positioner" alignItemWithTrigger={false} sideOffset={4}>
            <Select.Popup
              className="wall-modern wall-metric-popup"
              style={{
                ...wallSurfaceVariables(theme.isDark, true),
                ...wallTypographyVariables,
                ...wallEditorTypographyVariables,
              }}
            >
              <Select.List>
                {choices.map((item) => (
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
      <small className="wall-metric-policy" aria-live="polite">
        {policy}
      </small>
    </div>
  );
}
