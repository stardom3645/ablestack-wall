import { css } from '@emotion/css';
import { Check } from 'lucide-react';
import { ComponentProps, PropsWithChildren } from 'react';

import { useTheme2 } from '@grafana/ui';
import { ColorPickerPresentationContext } from '@grafana/ui/src/components/ColorPicker/ColorPickerPresentation';
import { Trans } from 'app/core/internationalization';

import { wallColorPalettes } from './colorSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { wallCommandTokens, wallSurfaceTokens, wallSurfaceVariables } from './surfaceTokens';
import { wallTypography, wallTypographyVariables } from './typography';
import { Button } from './ui';

type Presentation = NonNullable<ComponentProps<typeof ColorPickerPresentationContext.Provider>['value']>;

export function WallColorPickerContent({
  color,
  onChange,
  palette,
  spectrum,
  extra,
}: Parameters<Presentation['render']>[0]) {
  const theme = useTheme2();
  const current = theme.visualization.getColorByName(color);
  const styles = css({
    width: wallCommandTokens.width + wallSurfaceTokens.cardGap * 2,
    maxWidth: 'calc(100vw - 24px)',
    padding: wallSurfaceTokens.compactPadding,
    fontFamily: wallTypography.family,
    fontSize: wallTypography.roles.control.size,
    color: 'var(--wall-text)',
    background: 'var(--wall-surface)',
    border: '1px solid var(--wall-border)',
    borderRadius: wallSurfaceTokens.radius,
    boxShadow: 'var(--wall-shadow)',
    '.wall-series-color &': { width: '100%', padding: 0, border: 0, boxShadow: 'none' },
    '& > header': {
      display: 'flex',
      alignItems: 'center',
      gap: wallSurfaceTokens.contentGap,
      marginBottom: wallSurfaceTokens.compactPadding,
    },
    '& > header > span:last-child': {
      marginLeft: 'auto',
      color: 'var(--wall-muted)',
      fontVariantNumeric: 'tabular-nums',
    },
    '& .wall-ui-tabs-list': {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2,
      marginBottom: wallSurfaceTokens.compactPadding,
    },
    '& .wall-ui-tabs-trigger': {
      flex: '1 0 auto',
      minHeight: wallSurfaceTokens.controlSize,
      padding: '0 8px',
      fontSize: 'inherit',
    },
    '& .wall-ui-tabs-content': { minHeight: 0, padding: 0 },
    '& section': { display: 'grid', gap: wallSurfaceTokens.compactPadding },
    '& .wall-palette-row': { display: 'flex', alignItems: 'center', gap: wallSurfaceTokens.contentGap },
    '& .wall-palette-row > span': { flex: 1, minWidth: 0 },
    '& .wall-color-swatch': {
      width: wallSurfaceTokens.controlSize,
      height: wallSurfaceTokens.controlSize,
      minHeight: 0,
      padding: 0,
      border: '1px solid var(--wall-border)',
      borderRadius: wallSurfaceTokens.radius / 2,
    },
    '& footer': {
      marginTop: wallSurfaceTokens.compactPadding,
      paddingTop: wallSurfaceTokens.compactPadding,
      borderTop: '1px solid var(--wall-border)',
      color: 'var(--wall-muted)',
      fontSize: wallTypography.roles.caption.size,
    },
  });
  const swatch = (value: string, name: string) => {
    const resolved = theme.visualization.getColorByName(value);
    const selected = resolved.toLowerCase() === current.toLowerCase();
    return (
      <Button
        key={`${name}-${value}`}
        className="wall-color-swatch"
        aria-label={`${name} ${value}`}
        aria-pressed={selected}
        title={`${name} · ${value}`}
        style={{ background: resolved }}
        onClick={() => onChange(value)}
      >
        {selected && <Check size={14} color={theme.colors.getContrastText(resolved)} />}
      </Button>
    );
  };
  return (
    <div
      className={`wall-modern ${styles}`}
      data-wall-color-picker
      style={{ ...wallSurfaceVariables(theme.isDark, true), ...wallTypographyVariables }}
    >
      <header>
        <strong>
          <Trans i18nKey="wall.wall-color-format-provider.text-9f8b556b">색상</Trans>
        </strong>
        <span title={current}>{color || '미선택'}</span>
      </header>
      <Tabs defaultValue="wall">
        <TabsList aria-label="색상 선택 방식">
          <TabsTrigger value="wall">
            <Trans i18nKey="wall.wall-color-format-provider.text-1addf78a">Wall 팔레트</Trans>
          </TabsTrigger>
          <TabsTrigger value="native">
            <Trans i18nKey="wall.wall-color-format-provider.text-bbf2624f">기본 색상</Trans>
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Trans i18nKey="wall.wall-color-format-provider.text-bda68518">사용자 지정</Trans>
          </TabsTrigger>
          {extra.map((item) => (
            <TabsTrigger key={item.id} value={`extra:${item.id}`}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="wall">
          <section aria-label="일반 지표 강조색">
            {Object.values(wallColorPalettes).map((item) => (
              <div key={item.label} className="wall-palette-row">
                <span>{item.label}</span>
                {item[theme.isDark ? 'dark' : 'light'].map((value) => swatch(value, item.label))}
              </div>
            ))}
          </section>
          <footer>
            <div className="wall-palette-row">
              <span>
                <Trans i18nKey="wall.wall-color-format-provider.text-19a4586b">상태·임계치 색</Trans>
              </span>
              {['green', 'orange', 'red', 'text'].map((value) => swatch(value, '상태색'))}
            </div>
            <p style={{ margin: '8px 0 0' }}>
              <Trans i18nKey="wall.wall-color-format-provider.text-6f346df2">다른 임계치·매핑 설정은 유지합니다.</Trans>
            </p>
          </footer>
        </TabsContent>
        <TabsContent value="native">{palette}</TabsContent>
        <TabsContent value="custom">{spectrum}</TabsContent>
        {extra.map((item) => (
          <TabsContent key={item.id} value={`extra:${item.id}`}>
            {item.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

const presentation: Presentation = { render: (props) => <WallColorPickerContent {...props} /> };

/** One adapter for native legend, field, value-mapping and threshold color pickers, including their portals. */
export function WallColorFormatProvider({ children }: PropsWithChildren) {
  return (
    <ColorPickerPresentationContext.Provider value={presentation}>{children}</ColorPickerPresentationContext.Provider>
  );
}
