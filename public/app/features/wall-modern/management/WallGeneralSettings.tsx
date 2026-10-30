import { Input as InputPrimitive } from '@base-ui/react/input';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { Clock3, LayoutDashboard, MousePointer2, ShieldCheck, X } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';

import { rangeUtil } from '@grafana/data';
import { config } from '@grafana/runtime';
import { TimeZonePicker, WeekStartPicker, defaultIntervals } from '@grafana/ui';
import { FolderPicker } from 'app/core/components/Select/FolderPicker';
import { t, Trans } from 'app/core/internationalization';
import {
  getValidIntervals,
  validateIntervals,
} from 'app/features/dashboard/components/DashboardSettings/AutoRefreshIntervals';
import { GenAIDashDescriptionButton } from 'app/features/dashboard/components/GenAI/GenAIDashDescriptionButton';
import { GenAIDashTitleButton } from 'app/features/dashboard/components/GenAI/GenAIDashTitleButton';
import { DeleteDashboardButton } from 'app/features/dashboard-scene/settings/DeleteDashboardButton';
import type { GeneralSettingsEditView } from 'app/features/dashboard-scene/settings/GeneralSettingsEditView';

import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../ui';

/** Same add/remove semantics as native TagsInput; only the display composition changes. */
function WallTagsInput({ tags = [], onChange }: { tags?: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (draft && !tags.includes(draft)) {
      onChange(tags.concat(draft));
    }
    setDraft('');
  };
  return (
    <div className="wall-tags-input">
      <div className="wall-tags-entry">
        <InputPrimitive
          id="tags-input"
          className="wall-form-input"
          value={draft}
          onValueChange={setDraft}
          placeholder={t('wall.settings.tag-placeholder', '태그 입력 후 Enter')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && draft) {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button size="sm" variant="ghost" disabled={!draft} onClick={add}>
          {t('wall.settings.tag-add', '추가')}
        </Button>
      </div>
      {tags.length > 0 && (
        <ul className="wall-tag-chips">
          {tags.map((tag) => (
            <li key={tag}>
              <span>{tag}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('wall.settings.tag-remove', '{{tag}} 태그 제거', { tag })}
                onClick={() => onChange(tags.filter((value) => value !== tag))}
              >
                <X size={12} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WallFormField({
  label,
  description,
  children,
  id,
  addon,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  id?: string;
  addon?: ReactNode;
}) {
  return (
    <div className="wall-form-field">
      <div className="wall-form-field-label">
        <>{id ? <label htmlFor={id}>{label}</label> : <span>{label}</span>}</>
        {addon}
      </div>
      {children}
      {description && <p>{description}</p>}
    </div>
  );
}
export function WallFormSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="wall-form-switch-row">
      <div>
        <label htmlFor={id}>{label}</label>
        {description && <p>{description}</p>}
      </div>
      <SwitchPrimitive.Root
        id={id}
        aria-label={label}
        checked={checked}
        onCheckedChange={onChange}
        className="wall-form-switch"
      >
        <SwitchPrimitive.Thumb className="wall-form-switch-thumb" />
      </SwitchPrimitive.Root>
    </div>
  );
}
function Choice<T extends string | number | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}) {
  return (
    <Tabs
      value={String(value)}
      onValueChange={(v) => {
        const next = options.find((o) => String(o.value) === v);
        if (next) {
          onChange(next.value);
        }
      }}
    >
      <TabsList aria-label={label}>
        {options.map((o) => (
          <TabsTrigger key={String(o.value)} value={String(o.value)}>
            {o.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
export function WallGeneralSettings({ model }: { model: GeneralSettingsEditView }) {
  const dashboard = model.getDashboard();
  const { title, description, tags, meta, editable, preload } = dashboard.useState();
  const { sync } = model.getCursorSync()?.useState() ?? {};
  const { timeZone, weekStart, UNSAFE_nowDelay: nowDelay } = model.getTimeRange().useState();
  const { intervals } = model.getRefreshPicker().useState();
  const { hideTimeControls } = model.getDashboardControls().useState();
  const { enabled: liveNow } = model.getLiveNowTimer().useState();
  const [intervalText, setIntervalText] = useState((intervals ?? defaultIntervals).join(','));
  const [intervalError, setIntervalError] = useState<string | null>(null);
  const [delay, setDelay] = useState(nowDelay ?? '');
  const validDelay = !delay || rangeUtil.isValidTimeSpan(delay);
  useEffect(() => setIntervalText((intervals ?? defaultIntervals).join(',')), [intervals]);
  useEffect(() => setDelay(nowDelay ?? ''), [nowDelay]);
  return (
    <div className="wall-form-grid">
      <section className="wall-form-section">
        <header>
          <h3>
            <LayoutDashboard size={17} />
            <Trans i18nKey="wall.settings.identity">기본 정보</Trans>
          </h3>
          <p>
            <Trans i18nKey="wall.settings.identity-help">대시보드의 이름과 분류를 관리합니다.</Trans>
          </p>
        </header>
        <WallFormField
          id="title-input"
          label={t('wall.settings.title', '제목')}
          addon={config.featureToggles.dashgpt && <GenAIDashTitleButton onGenerate={model.onTitleChange} />}
        >
          <InputPrimitive
            className="wall-form-input"
            id="title-input"
            name="title"
            value={title}
            onValueChange={model.onTitleChange}
          />
        </WallFormField>
        <WallFormField
          id="description-input"
          label={t('wall.settings.description', '설명')}
          addon={config.featureToggles.dashgpt && <GenAIDashDescriptionButton onGenerate={model.onDescriptionChange} />}
        >
          <textarea
            className="wall-form-input"
            rows={3}
            id="description-input"
            value={description ?? ''}
            onChange={(e) => model.onDescriptionChange(e.target.value)}
          />
        </WallFormField>
        <WallFormField id="tags-input" label={t('wall.settings.tags', '태그')}>
          <WallTagsInput tags={tags} onChange={model.onTagsChange} />
        </WallFormField>
        <WallFormField id="dashboard-folder-input" label={t('wall.settings.folder', '폴더')}>
          <FolderPicker
            value={meta.folderUid}
            onChange={model.onFolderChange}
            initialTitle={meta.folderTitle}
            inputId="dashboard-folder-input"
            enableCreateNew
            skipInitialLoad
          />
        </WallFormField>
      </section>
      <section className="wall-form-section">
        <header>
          <h3>
            <Clock3 size={17} />
            <Trans i18nKey="wall.settings.time">시간과 데이터 갱신</Trans>
          </h3>
          <p>
            <Trans i18nKey="wall.settings.time-help">시간 범위와 갱신 동작의 기본값입니다.</Trans>
          </p>
        </header>
        <div className="wall-form-pair">
          <WallFormField id="time-options-input" label={t('wall.settings.timezone', '시간대')}>
            <TimeZonePicker
              inputId="time-options-input"
              includeInternal
              value={timeZone ?? ''}
              onChange={(value) => {
                if (typeof value === 'string') {
                  model.onTimeZoneChange(value);
                }
              }}
            />
          </WallFormField>
          <WallFormField id="week-start-input" label={t('wall.settings.week-start', '주 시작 요일')}>
            <WeekStartPicker inputId="week-start-input" value={weekStart ?? ''} onChange={model.onWeekStartChange} />
          </WallFormField>
        </div>
        <WallFormField
          id="wall-refresh-intervals"
          label={t('wall.settings.intervals', '자동 갱신 간격')}
          description={intervalError ?? t('wall.settings.intervals-help', '쉼표로 구분합니다. 예: 5s, 30s, 1m, 5m')}
        >
          <InputPrimitive
            className="wall-form-input"
            id="wall-refresh-intervals"
            value={intervalText}
            aria-invalid={!!intervalError}
            onValueChange={setIntervalText}
            onBlur={() => {
              const values = intervalText ? intervalText.split(',') : [];
              const error = validateIntervals(values);
              setIntervalError(error);
              if (error === null) {
                model.onRefreshIntervalChange(getValidIntervals(values));
              }
            }}
          />
        </WallFormField>
        <WallFormField
          id="now-delay-input"
          label={t('wall.settings.delay', '최근 데이터 제외')}
          description={t('wall.settings.delay-help', '수집이 완료되지 않은 최근 구간을 제외합니다. 예: 1m')}
        >
          <InputPrimitive
            className="wall-form-input"
            id="now-delay-input"
            value={delay}
            placeholder="0m"
            aria-invalid={!validDelay}
            onValueChange={(value) => {
              setDelay(value);
              if (!value || rangeUtil.isValidTimeSpan(value)) {
                model.onNowDelayChange(value);
              }
            }}
          />
        </WallFormField>
        <WallFormSwitch
          label={t('wall.settings.hide-time', '시간 선택기 숨기기')}
          checked={!!hideTimeControls}
          onChange={model.onHideTimePickerChange}
        />
        <WallFormSwitch
          label={t('wall.settings.live', '라이브 데이터 갱신')}
          description={t('wall.settings.live-help', '현재 시각을 참조하는 패널을 연속으로 갱신합니다.')}
          checked={!!liveNow}
          onChange={model.onLiveNowChange}
        />
      </section>
      <section className="wall-form-section">
        <header>
          <h3>
            <MousePointer2 size={17} />
            <Trans i18nKey="wall.settings.interactions">조회 경험</Trans>
          </h3>
          <p>
            <Trans i18nKey="wall.settings.interactions-help">패널 간 탐색과 데이터 로딩 동작을 설정합니다.</Trans>
          </p>
        </header>
        <WallFormField label={t('wall.settings.tooltip', '패널 간 툴팁 동기화')}>
          <Choice
            label={t('wall.settings.tooltip', '패널 간 툴팁 동기화')}
            value={sync ?? 0}
            options={[
              { value: 0, label: t('wall.settings.individual', '개별') },
              { value: 1, label: t('wall.settings.crosshair', '십자선') },
              { value: 2, label: t('wall.settings.shared-tooltip', '툴팁') },
            ]}
            onChange={model.onTooltipChange}
          />
        </WallFormField>
        <WallFormSwitch
          label={t('wall.settings.preload', '패널 미리 로드')}
          description={t('wall.settings.preload-help', '대시보드를 열 때 모든 패널의 데이터를 조회합니다.')}
          checked={!!preload}
          onChange={model.onPreloadChange}
        />
      </section>
      <section className="wall-form-section">
        <header>
          <h3>
            <ShieldCheck size={17} />
            <Trans i18nKey="wall.settings.editability">편집 정책</Trans>
          </h3>
          <p>
            <Trans i18nKey="wall.settings.editability-help">사용자 권한은 권한 메뉴에서 별도로 관리합니다.</Trans>
          </p>
        </header>
        <WallFormField label={t('wall.settings.editable', '대시보드 편집')}>
          <Choice
            label={t('wall.settings.editable', '대시보드 편집')}
            value={editable ?? true}
            options={[
              { value: true, label: t('wall.settings.allow-edit', '편집 허용') },
              { value: false, label: t('wall.settings.read-only', '읽기 전용') },
            ]}
            onChange={model.onEditableChange}
          />
        </WallFormField>
      </section>
      {meta.canDelete && (
        <section className="wall-form-section wall-form-danger">
          <div>
            <h3>
              <Trans i18nKey="wall.settings.delete">대시보드 삭제</Trans>
            </h3>
            <p>
              <Trans i18nKey="wall.settings.delete-help">삭제 전 기존 확인 절차가 표시됩니다.</Trans>
            </p>
          </div>
          <DeleteDashboardButton dashboard={dashboard} />
        </section>
      )}
    </div>
  );
}
