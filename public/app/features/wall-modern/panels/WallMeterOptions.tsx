import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

import type { StandardEditorProps, PanelOptionsEditorBuilder, SelectFieldConfigSettings } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import type { MeterAppearance } from '@grafana/ui/src/components/VizPresentation/VizPresentation';
import { Trans } from 'app/core/internationalization';

import { wallSurfaceVariables } from '../surfaceTokens';
import { wallTypographyVariables, wallEditorTypographyVariables } from '../typography';
import { Button } from '../ui';
import '../charts/timeSeries.css';

import type { WallMeterOptions } from './meterPresentation';
import { wallMeterTokens } from './meterTokens';

type Theme = keyof typeof wallMeterTokens.palettes;
const choices: Array<{ value: Theme | 'auto'; label: string }> = [
  { value: 'auto', label: '자동 · 기존 설정 우선' },
  ...Object.keys(wallMeterTokens.palettes)
    .filter((value): value is Theme => value in wallMeterTokens.palettes)
    .map((value) => ({
      value,
      label: wallMeterTokens.palettes[value].label,
    })),
];
export function WallMeterThemeEditor({ value, onChange }: StandardEditorProps<Theme | undefined>) {
  const theme = useTheme2();
  return (
    <div className="wall-metric-profile">
      <Select.Root<Theme | 'auto'>
        items={choices}
        value={value ?? 'auto'}
        onValueChange={(next) => next && onChange(next === 'auto' ? undefined : next)}
      >
        <Select.Trigger aria-label="게이지 색상 테마" render={<Button className="wall-metric-trigger" />}>
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
                {choices.map((item: (typeof choices)[number]) => (
                  <Select.Item key={item.value} value={item.value} className="wall-metric-option">
                    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 3, minWidth: 31 }}>
                      {item.value !== 'auto' &&
                        (theme.isDark
                          ? wallMeterTokens.palettes[item.value].dark
                          : wallMeterTokens.palettes[item.value].light
                        ).map((color) => (
                          <span key={color} style={{ width: 14, height: 6, borderRadius: 3, background: color }} />
                        ))}
                    </span>
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
      <small className="wall-metric-policy">
        <Trans i18nKey="wall.wall-meter-options.text-23750a52">
          일반 표시색입니다. 저장된 임계치·고정색·값 매핑이 우선합니다.
        </Trans>
      </small>
    </div>
  );
}
export function addWallMeterOptions<T extends WallMeterOptions>(
  builder: PanelOptionsEditorBuilder<T>,
  circular: boolean
) {
  builder.addCustomEditor({
    id: 'wallGaugeTheme',
    path: 'wallGaugeTheme',
    name: '색상 테마',
    category: ['Wall Gauge / Meter'],
    defaultValue: undefined,
    editor: WallMeterThemeEditor,
  });
  builder.addRadio<
    NonNullable<MeterAppearance['finish']>,
    SelectFieldConfigSettings<NonNullable<MeterAppearance['finish']>>
  >({
    path: 'wallGaugeFinish',
    name: '일반색 표현',
    category: ['Wall Gauge / Meter'],
    defaultValue: undefined,
    settings: {
      options: [
        { value: 'solid', label: '단색' },
        { value: 'duo', label: '두 가지 색' },
      ],
    },
    description: '두 가지 색은 장식용 팔레트이며 임계치 구간을 뜻하지 않습니다. 명시적 상태색은 유지합니다.',
  });
  if (circular) {
    builder.addRadio<
      NonNullable<MeterAppearance['shape']>,
      SelectFieldConfigSettings<NonNullable<MeterAppearance['shape']>>
    >({
      path: 'wallGaugeShape',
      name: '게이지 형태',
      category: ['Wall Gauge / Meter'],
      defaultValue: undefined,
      settings: {
        options: [
          { value: 'ring', label: '원형' },
          { value: 'arc', label: '오픈 링' },
          { value: 'semi', label: '반원' },
        ],
      },
    });
  }
}
