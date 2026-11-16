import { css } from '@emotion/css';
import { PureComponent } from 'react';
import * as React from 'react';

import { FeatureState, getBuiltInThemes, ThemeRegistryItem } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { config, reportInteraction } from '@grafana/runtime';
import { Preferences as UserPreferencesDTO } from '@grafana/schema/src/raw/preferences/x/preferences_types.gen';
import {
  Button,
  Field,
  FieldSet,
  Label,
  stylesFactory,
  TimeZonePicker,
  WeekStartPicker,
  FeatureBadge,
} from '@grafana/ui';
import { Combobox, ComboboxOption } from '@grafana/ui/src/unstable';
import { DashboardPicker } from 'app/core/components/Select/DashboardPicker';
import { t, Trans } from 'app/core/internationalization';
import { LANGUAGES, PSEUDO_LOCALE } from 'app/core/internationalization/constants';
import { PreferencesService } from 'app/core/services/PreferencesService';
import { changeTheme } from 'app/core/services/theme';
import { getMessageFromError } from 'app/core/utils/errors';

export interface Props {
  wallPresentation?: boolean;
  resourceUri: string;
  disabled?: boolean;
  preferenceType: 'org' | 'team' | 'user';
  onConfirm?: () => Promise<boolean>;
}

export type State = UserPreferencesDTO & { saving?: boolean; saveError?: string };

function getLanguageOptions(): ComboboxOption[] {
  const languageOptions = LANGUAGES.map((v) => ({
    value: v.code,
    label: v.name,
  })).sort((a, b) => {
    if (a.value === PSEUDO_LOCALE) {
      return 1;
    }

    if (b.value === PSEUDO_LOCALE) {
      return -1;
    }

    return a.label.localeCompare(b.label);
  });

  const options = [
    {
      value: '',
      label: t('common.locale.default', 'Default'),
    },
    ...languageOptions,
  ];

  return options;
}

export class SharedPreferences extends PureComponent<Props, State> {
  service: PreferencesService;
  themeOptions: ComboboxOption[];

  constructor(props: Props) {
    super(props);

    this.service = new PreferencesService(props.resourceUri);
    this.state = {
      theme: '',
      timezone: '',
      weekStart: '',
      language: '',
      queryHistory: { homeTab: '' },
      navbar: { bookmarkUrls: [] },
    };

    this.themeOptions = getBuiltInThemes(config.featureToggles.extraThemes).map((theme) => ({
      value: theme.id,
      label: getTranslatedThemeName(theme),
    }));

    // Add default option
    this.themeOptions.unshift({ value: '', label: t('shared-preferences.theme.default-label', 'Default') });
  }

  async componentDidMount() {
    const prefs = await this.service.load();

    this.setState({
      homeDashboardUID: prefs.homeDashboardUID,
      theme: prefs.theme,
      timezone: prefs.timezone,
      weekStart: prefs.weekStart,
      language: prefs.language,
      queryHistory: prefs.queryHistory,
      navbar: prefs.navbar,
    });
  }

  onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (this.props.disabled || this.state.saving) {
      return;
    }
    if (this.props.wallPresentation) {
      this.setState({ saving: true, saveError: undefined });
    }
    try {
      const confirmationResult = this.props.onConfirm ? await this.props.onConfirm() : true;
      if (confirmationResult) {
        const { homeDashboardUID, theme, timezone, weekStart, language, queryHistory, navbar } = this.state;
        await this.service.update({ homeDashboardUID, theme, timezone, weekStart, language, queryHistory, navbar });
        window.location.reload();
      }
    } catch (error) {
      if (!this.props.wallPresentation) {
        throw error;
      }
      this.setState({ saveError: getMessageFromError(error) });
    } finally {
      if (this.props.wallPresentation) {
        this.setState({ saving: false });
      }
    }
  };

  onThemeChanged = (value: ComboboxOption<string> | null) => {
    if (!value) {
      return;
    }
    this.setState({ theme: value.value });

    if (value.value) {
      changeTheme(value.value, true);
    }
  };

  onTimeZoneChanged = (timezone?: string) => {
    if (typeof timezone !== 'string') {
      return;
    }
    this.setState({ timezone: timezone });
  };

  onWeekStartChanged = (weekStart: string) => {
    this.setState({ weekStart: weekStart });
  };

  onHomeDashboardChanged = (dashboardUID: string) => {
    this.setState({ homeDashboardUID: dashboardUID });
  };

  onLanguageChanged = (language: string) => {
    this.setState({ language });

    reportInteraction('grafana_preferences_language_changed', {
      toLanguage: language,
      preferenceType: this.props.preferenceType,
    });
  };

  render() {
    const { theme, timezone, weekStart, homeDashboardUID, language } = this.state;
    const { disabled, wallPresentation } = this.props;
    const styles = getStyles();
    const languages = getLanguageOptions();
    const currentThemeOption = this.themeOptions.find((x) => x.value === theme) ?? this.themeOptions[0];

    return (
      <form
        onSubmit={this.onSubmitForm}
        className={wallPresentation ? `${styles.form} wall-preferences-form` : styles.form}
      >
        <FieldSet
          label={<Trans i18nKey="shared-preferences.title">Preferences</Trans>}
          disabled={disabled || this.state.saving}
        >
          <Field
            label={t('shared-preferences.fields.theme-label', 'Interface theme')}
            description={
              wallPresentation
                ? '기본값은 서버의 테마 설정을 따릅니다. 개인 설정은 조직 설정보다 우선합니다.'
                : undefined
            }
          >
            <Combobox
              options={this.themeOptions}
              value={currentThemeOption.value}
              onChange={this.onThemeChanged}
              id="shared-preferences-theme-select"
            />
          </Field>

          <Field
            label={
              <Label htmlFor="home-dashboard-select">
                <span className={styles.labelText}>
                  <Trans i18nKey="shared-preferences.fields.home-dashboard-label">Home Dashboard</Trans>
                </span>
              </Label>
            }
            description={
              wallPresentation ? '로그인 후 열리는 기본 대시보드입니다. 비워 두면 상위 기본값을 사용합니다.' : undefined
            }
            data-testid="User preferences home dashboard drop down"
          >
            <DashboardPicker
              value={homeDashboardUID}
              onChange={(v) => this.onHomeDashboardChanged(v?.uid ?? '')}
              defaultOptions={true}
              isClearable={true}
              placeholder={t('shared-preferences.fields.home-dashboard-placeholder', 'Default dashboard')}
              inputId="home-dashboard-select"
            />
          </Field>

          <Field
            label={t('shared-dashboard.fields.timezone-label', 'Timezone')}
            description={
              wallPresentation ? '시간 표시의 기본 시간대입니다. 대시보드의 명시적인 설정은 유지됩니다.' : undefined
            }
            data-testid={selectors.components.TimeZonePicker.containerV2}
          >
            <TimeZonePicker
              includeInternal={true}
              value={timezone}
              onChange={this.onTimeZoneChanged}
              inputId="shared-preferences-timezone-picker"
            />
          </Field>

          <Field
            label={t('shared-preferences.fields.week-start-label', 'Week start')}
            description={wallPresentation ? '달력에서 한 주가 시작되는 요일입니다.' : undefined}
            data-testid={selectors.components.WeekStartPicker.containerV2}
          >
            <WeekStartPicker
              value={weekStart || ''}
              onChange={this.onWeekStartChanged}
              inputId={'shared-preferences-week-start-picker'}
            />
          </Field>

          <Field
            label={
              wallPresentation ? (
                '언어'
              ) : (
                <Label htmlFor="locale-select">
                  <span className={styles.labelText}>
                    <Trans i18nKey="shared-preferences.fields.locale-label">Language</Trans>
                  </span>
                  <FeatureBadge featureState={FeatureState.beta} />
                </Label>
              )
            }
            description={wallPresentation ? '언어 설정입니다. 개인 프로필에 지정한 언어가 우선합니다.' : undefined}
            data-testid="User preferences language drop down"
          >
            <Combobox
              value={languages.find((lang) => lang.value === language)?.value || ''}
              onChange={(lang: ComboboxOption | null) => this.onLanguageChanged(lang?.value ?? '')}
              options={languages}
              placeholder={t('shared-preferences.fields.locale-placeholder', 'Choose language')}
              id="locale-select"
            />
          </Field>
        </FieldSet>
        <div className={wallPresentation ? 'wall-admin-save-row' : undefined}>
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || this.state.saving}
            data-testid={selectors.components.UserProfile.preferencesSaveButton}
          >
            {this.state.saving ? '저장 중…' : <Trans i18nKey="common.save">Save</Trans>}
          </Button>
          {wallPresentation && this.state.saveError && (
            <span role="alert" className="wall-admin-danger">
              {this.state.saveError}
            </span>
          )}
        </div>
      </form>
    );
  }
}

export default SharedPreferences;

const getStyles = stylesFactory(() => {
  return {
    labelText: css({
      marginRight: '6px',
    }),
    form: css({
      width: '100%',
      maxWidth: '600px',
    }),
  };
});

function getTranslatedThemeName(theme: ThemeRegistryItem) {
  switch (theme.id) {
    case 'dark':
      return t('shared.preferences.theme.dark-label', 'Dark');
    case 'light':
      return t('shared.preferences.theme.light-label', 'Light');
    case 'system':
      return t('shared.preferences.theme.system-label', 'System preference');
    default:
      return theme.name;
  }
}
