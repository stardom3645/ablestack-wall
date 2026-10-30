import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Globe } from 'lucide-react';
import { useState } from 'react';
import { useLocalStorage } from 'react-use';

import { isDateTime, rangeUtil, TimeRange } from '@grafana/data';
import { sceneGraph, SceneTimePicker } from '@grafana/scenes';
import { TimePickerButtonLabel } from '@grafana/ui/src/components/DateTimePickers/TimeRangePicker';
import { TimePickerContent } from '@grafana/ui/src/components/DateTimePickers/TimeRangePicker/TimePickerContent';
import { getWeekStart } from '@grafana/ui/src/components/DateTimePickers/WeekStartPicker';
import { quickOptions } from '@grafana/ui/src/components/DateTimePickers/options';
import { useTimeSync } from '@grafana/ui/src/components/DateTimePickers/utils/useTimeSync';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../ui';

// Same history format/key as SceneTimePicker, so existing absolute-range history survives.
const historyOptions = {
  raw: false,
  serializer: (ranges: TimeRange[]) =>
    JSON.stringify(
      ranges
        .map(({ raw }) => ({
          from: typeof raw.from === 'string' ? raw.from : raw.from.toISOString(),
          to: typeof raw.to === 'string' ? raw.to : raw.to.toISOString(),
        }))
        .filter(
          (item, index, all) => all.findIndex((other) => other.from === item.from && other.to === item.to) === index
        )
        .slice(0, 4)
    ),
  deserializer: (value: string) =>
    (JSON.parse(value) as Array<{ from: string; to: string }>).map((raw) =>
      rangeUtil.convertRawToRange(raw, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss')
    ),
};

export function WallTimeRangeControl({ model }: { model: SceneTimePicker }) {
  const { hidePicker } = model.useState();
  const timeRange = sceneGraph.getTimeRange(model);
  const { value, fiscalYearStartMonth, weekStart } = timeRange.useState();
  const timeZone = timeRange.getTimeZone();
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [history, setHistory] = useLocalStorage<TimeRange[]>(
    'grafana.dashboard.timepicker.history',
    [],
    historyOptions
  );
  const { onChangeWithSync, timeSyncButton } = useTimeSync({ value, onChangeProp: timeRange.onTimeRangeChange });
  if (hidePicker) {
    return null;
  }

  const change = (range: TimeRange) => {
    if (isDateTime(range.raw.from) || isDateTime(range.raw.to)) {
      setHistory([range, ...(history ?? [])]);
    }
    onChangeWithSync(range);
    setOpen(false);
  };

  return (
    <div className="wall-toolbar-time-group" role="group" aria-label="시간 범위">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setAdvanced(false);
          }
        }}
      >
        <PopoverTrigger
          render={<Button className="wall-toolbar-control wall-toolbar-time-trigger" />}
          aria-label="시간 범위 선택"
        >
          <Clock3 size={16} />
          <TimePickerButtonLabel value={value} timeZone={timeZone} />
          <ChevronDown size={14} />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label="시간 범위 설정"
          className={`wall-time-range-popover ${advanced ? 'is-advanced' : ''}`}
        >
          {advanced ? (
            <>
              <Button className="wall-time-advanced-back" variant="ghost" size="sm" onClick={() => setAdvanced(false)}>
                <ChevronLeft size={14} />
                빠른 시간 범위
              </Button>
              <TimePickerContent
                value={value}
                timeZone={timeZone}
                fiscalYearStartMonth={fiscalYearStartMonth}
                weekStart={getWeekStart(weekStart)}
                quickOptions={quickOptions}
                history={history}
                showHistory
                onChange={change}
                onChangeTimeZone={timeRange.onTimeZoneChange}
                onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
              />
            </>
          ) : (
            <>
              <div className="wall-timeframe-heading">시간 범위</div>
              <button
                className="wall-timeframe-summary"
                onClick={() => setAdvanced(true)}
                aria-label="직접 시간 범위 입력"
              >
                <span>
                  {typeof value.raw.from === 'string' ? value.raw.from : value.from.format('YYYY-MM-DD HH:mm')}
                </span>
                <span>→</span>
                <span>{typeof value.raw.to === 'string' ? value.raw.to : value.to.format('YYYY-MM-DD HH:mm')}</span>
                <CalendarDays size={16} />
              </button>
              <div className="wall-time-presets">
                {compactTimePresets.map((option) => (
                  <Button
                    key={option.display}
                    variant="ghost"
                    className="wall-time-preset"
                    aria-pressed={value.raw.from === option.from && value.raw.to === option.to}
                    onClick={() => change(rangeUtil.convertRawToRange(option, timeZone, fiscalYearStartMonth))}
                  >
                    <span>{option.display}</span>
                    <small>
                      {option.from.replace('now', '') || 'Now'} →{' '}
                      {option.to === 'now' ? 'Now' : option.to.replace('now', '')}
                    </small>
                  </Button>
                ))}
              </div>
              <div className="wall-timeframe-footer">
                <span>
                  <Globe size={13} />
                  {timeZone === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timeZone}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setAdvanced(true)}>
                  고급 시간 설정
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
      <Button
        className="wall-toolbar-control wall-toolbar-icon"
        size="icon"
        aria-label="이전 시간 범위"
        onClick={model.onMoveBackward}
      >
        <ChevronLeft size={15} />
      </Button>
      <Button
        className="wall-toolbar-control wall-toolbar-icon"
        size="icon"
        aria-label="다음 시간 범위"
        onClick={model.onMoveForward}
      >
        <ChevronRight size={15} />
      </Button>
      {timeSyncButton}
    </div>
  );
}

const compactTimePresets = [
  { from: 'now-30m', to: 'now', display: '최근 30분' },
  { from: 'now-1h', to: 'now', display: '최근 1시간' },
  { from: 'now-2h', to: 'now', display: '최근 2시간' },
  { from: 'now/d', to: 'now/d', display: '오늘' },
  { from: 'now-1d/d', to: 'now-1d/d', display: '어제' },
  { from: 'now-24h', to: 'now', display: '최근 24시간' },
  { from: 'now-7d', to: 'now', display: '최근 7일' },
];
