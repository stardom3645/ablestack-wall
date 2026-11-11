import { Input } from '@base-ui/react/input';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { ThresholdsMode, type ThresholdsConfig } from '@grafana/data';
import { ColorPicker, useTheme2 } from '@grafana/ui';
import { Trans, t } from 'app/core/internationalization';

import { Button } from '../ui';

import { WallOptionChoice } from './WallOptionEditor';

type Row = { key: number; color: string; value: string };

function rowsFromConfig(config: ThresholdsConfig): Row[] {
  const steps = config.steps.length ? config.steps : [{ value: -Infinity, color: 'green' }];
  return steps.map((step, index) => ({ key: index, color: step.color, value: index ? String(step.value) : '' }));
}

/** The first color covers -Infinity; following colors start at the specified inclusive value. */
export function WallThresholdEditor({
  thresholds,
  onChange,
}: {
  thresholds: ThresholdsConfig;
  onChange: (config: ThresholdsConfig) => void;
}) {
  const id = useId();
  const theme = useTheme2();
  const [rows, setRows] = useState(() => rowsFromConfig(thresholds));
  const lastConfig = useRef(thresholds);
  const nextKey = useRef(rows.length);
  const [focusKey, setFocusKey] = useState<number>();
  const percent = thresholds.mode === ThresholdsMode.Percentage;
  useEffect(() => {
    if (thresholds !== lastConfig.current) {
      setRows(rowsFromConfig(thresholds));
      nextKey.current = thresholds.steps.length || 1;
      lastConfig.current = thresholds;
      setFocusKey(undefined);
    }
  }, [thresholds]);
  const invalid = rows.some(
    (row, index) => index > 0 && (row.value.trim() === '' || !Number.isFinite(Number(row.value)))
  );
  const duplicate = new Set(rows.slice(1).map((row) => Number(row.value))).size !== rows.length - 1;
  const valid = !invalid && !duplicate;
  const publish = (next: Row[], mode = thresholds.mode) => {
    setRows(next);
    if (
      next.slice(1).some((row) => !row.value.trim() || !Number.isFinite(Number(row.value))) ||
      new Set(next.slice(1).map((row) => Number(row.value))).size !== next.length - 1
    ) {
      return;
    }
    const sorted = [next[0], ...next.slice(1).sort((a, b) => Number(a.value) - Number(b.value))];
    setRows(sorted);
    const config = {
      ...thresholds,
      mode,
      steps: sorted.map((row, index) => ({ color: row.color, value: index ? Number(row.value) : -Infinity })),
    };
    lastConfig.current = config;
    onChange(config);
  };
  const format = (value: string) => `${value}${percent ? '%' : ''}`;
  const ordered = [rows[0], ...rows.slice(1).sort((a, b) => Number(a.value) - Number(b.value))];
  return (
    <div className="wall-threshold-editor">
      <WallOptionChoice
        label="임계치 계산 기준"
        value={thresholds.mode}
        options={[
          { label: '실제 값', value: ThresholdsMode.Absolute },
          { label: '범위 대비 비율', value: ThresholdsMode.Percentage },
        ]}
        onChange={(mode) => mode !== undefined && valid && publish(rows, mode)}
      />
      <p className="wall-option-help">
        {percent
          ? '설정한 최솟값과 최댓값 사이를 0~100%로 계산합니다. 단위 자체가 %인 경우와 다릅니다.'
          : '입력한 값 이상부터 선택한 색상이 적용됩니다. 표시 단위와 같은 값으로 입력하세요.'}
      </p>
      <div className="wall-threshold-summary" aria-label={t('wall.threshold.summary', '색상 구간 요약')}>
        {ordered.map((row, index) => (
          <span key={row.key}>
            <i aria-hidden="true" style={{ backgroundColor: theme.visualization.getColorByName(row.color) }} />
            <small>{index === 0 ? t('wall.threshold.base', '기본') : `${format(row.value)} 이상`}</small>
          </span>
        ))}
      </div>
      <div className="wall-threshold-rows">
        {rows.map((row, index) => {
          const position = ordered.findIndex((entry) => entry.key === row.key);
          const upper = ordered[position + 1];
          return (
            <div className="wall-threshold-row" key={row.key}>
              <div
                className="wall-threshold-color"
                role="group"
                aria-label={index ? `구간 ${index} 색상` : '기본 구간 색상'}
              >
                <ColorPicker
                  color={row.color}
                  enableNamedColors
                  onChange={(color) => {
                    const next = rows.map((entry) => (entry.key === row.key ? { ...entry, color } : entry));
                    setRows(next);
                    if (valid) {
                      publish(next);
                    }
                  }}
                />
              </div>
              <div className="wall-threshold-value">
                {index === 0 ? (
                  <strong>
                    <Trans i18nKey="wall.wall-threshold-editor.text-d1ed9280">기본 구간</Trans>
                  </strong>
                ) : (
                  <>
                    <Input
                      id={`${id}-${row.key}`}
                      aria-label={`구간 ${index} 시작 값`}
                      aria-describedby={!valid ? `${id}-error` : undefined}
                      aria-invalid={!valid}
                      className="wall-form-input"
                      type="number"
                      step="any"
                      value={row.value}
                      ref={(input) => {
                        if (focusKey === row.key) {
                          input?.focus();
                        }
                      }}
                      onChange={(event) =>
                        setRows(
                          rows.map((entry) =>
                            entry.key === row.key ? { ...entry, value: event.currentTarget.value } : entry
                          )
                        )
                      }
                      onFocus={() => setFocusKey(undefined)}
                      onBlur={() => {
                        if (valid) {
                          publish(rows);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && valid) {
                          publish(rows);
                        }
                      }}
                    />
                  </>
                )}
                <small>
                  {valid
                    ? index
                      ? `${format(row.value)} 이상${upper ? ` ~ ${format(upper.value)} 미만` : ''}`
                      : upper
                        ? `${format(upper.value)} 미만`
                        : '모든 값에 적용'
                    : '시작 값을 확인하세요'}
                </small>
              </div>
              {index > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`구간 ${index} 삭제`}
                  onClick={() => publish(rows.filter((entry) => entry.key !== row.key))}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {!valid && (
        <p id={`${id}-error`} role="alert">
          {invalid ? '시작 값에 유효한 숫자를 입력하세요.' : '각 구간의 시작 값은 서로 달라야 합니다.'}
        </p>
      )}
      <Button
        className="wall-threshold-add"
        disabled={!valid}
        onClick={() => {
          const key = nextKey.current++;
          const value = rows.length > 1 ? Math.max(...rows.slice(1).map((row) => Number(row.value))) + 10 : 0;
          const color =
            ['green', 'orange', 'red', 'blue', 'purple'].find((color) => !rows.some((row) => row.color === color)) ??
            'blue';
          publish([...rows, { key, value: String(value), color }]);
          setFocusKey(key);
        }}
      >
        <Plus size={14} aria-hidden="true" />
        <Trans i18nKey="wall.wall-threshold-editor.text-079de499">구간 추가</Trans>
      </Button>
      <p className="wall-option-help">
        <Trans i18nKey="wall.wall-threshold-editor.text-5dd9827c">
          패널의 색상 표시 기준입니다. 알림을 보내는 경보 규칙은 별도로 설정합니다.
        </Trans>
      </p>
    </div>
  );
}
