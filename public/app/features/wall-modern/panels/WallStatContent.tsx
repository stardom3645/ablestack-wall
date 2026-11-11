import { CSSProperties, useContext } from 'react';

import type { StatContentProps } from '@grafana/ui/src/components/BigValue/StatCardPresentation';

import { wallDisplayText } from '../formatSystem';
import { WallFontStatusContext, wallTypography } from '../typography';

import { fitStatValue, statStateDotSize, wallStatTokens as tokens } from './statReadout';

/** Native formatted values, application-owned hierarchy. No reducers or invented trend data. */
export function WallStatContent(props: StatContentProps) {
  useContext(WallFontStatusContext); // Re-measure after self-hosted font loading; do not remount the panel.
  const { value, kind, indicator, chart, centered, percentChange } = props;
  const status = kind === 'status';
  const single = props.singleValue && !props.nameOnly && kind !== 'empty';
  const modern = !single && (props.presentationStyle === 'soft' || props.presentationStyle === 'minimal');
  const chip = status && indicator && !modern && !single;
  const empty = kind === 'empty';
  const textual = props.textual || status || empty;
  const inline = props.layout === 'inline';
  const neutralCount =
    !single &&
    !modern &&
    !textual &&
    !props.nameOnly &&
    kind === 'metric' &&
    props.indicatorSpace &&
    !value.prefix &&
    !value.suffix &&
    Number.isInteger(value.numeric);
  const profile = props.nameOnly ? tokens.name : textual ? tokens.status : inline ? tokens.inlineValue : tokens.value;
  const dotSpace = neutralCount ? statStateDotSize(props.explicitValueSize ?? profile.size) + tokens.statusGap : 0;
  const text = value.text;
  const hasText = Boolean(text || value.prefix || value.suffix);
  const hasLabel = Boolean(value.title);
  const sideChart = Boolean(chart && props.chartWidth < props.width);
  const width = props.width - (sideChart ? props.chartWidth + tokens.gap : 0);
  const height = props.height - (chart && !sideChart ? props.chartHeight : 0);
  const labelSize = props.explicitLabelSize ?? tokens.label.size;
  const gap = inline || height < tokens.minimumItemHeight ? tokens.denseGap : tokens.gap;
  const extras =
    (!inline && hasLabel ? labelSize * (tokens.label.line / tokens.label.size) + gap : 0) +
    (percentChange ? tokens.status.line + tokens.gap : 0);
  const statusInsetY = height < tokens.minimumItemHeight ? tokens.compactStatusInsetY : tokens.statusInsetY;
  const badgeInset = chip ? tokens.statusInsetX * 2 + 2 : 0;
  const maximum = single ? Math.max(1, props.autoValueSize ?? profile.size) : profile.size;
  const unitMaximum = single ? maximum * tokens.unitScale : tokens.unit.size;
  const size =
    props.explicitValueSize ??
    fitStatValue({
      text: props.alignmentFactors?.text || text,
      prefix: props.alignmentFactors?.prefix || value.prefix,
      suffix: props.alignmentFactors?.suffix || value.suffix,
      width: width - badgeInset - dotSpace,
      height: height - extras - (chip ? statusInsetY * 2 + 2 : 0),
      lineHeight: profile.line / profile.size,
      maximum,
      unitMaximum,
      weight: profile.weight,
    });
  const dotSize = statStateDotSize(size);
  const unit = Math.min(single ? size * tokens.unitScale : tokens.unit.size, size * tokens.unitScale);
  const softInsetY = inline
    ? 0
    : Math.min(tokens.accentInset, Math.max(0, (height - extras - (size * profile.line) / profile.size) / 2));
  const valueStyle: CSSProperties = {
    ...props.valueStyle,
    ...(neutralCount ? { color: props.foreground } : {}),
    display: 'inline-flex',
    boxSizing: 'border-box',
    alignItems: textual ? 'center' : 'baseline',
    minHeight: textual && !props.nameOnly && !single ? tokens.status.line + statusInsetY * 2 + 2 : undefined,
    justifySelf: inline ? 'end' : undefined,
    fontSize: size,
    fontWeight: profile.weight,
    letterSpacing: profile.tracking,
    lineHeight: profile.line / profile.size,
    fontVariantNumeric: 'tabular-nums',
    gap: tokens.statusGap,
    ...(chip ? { borderRadius: tokens.statusRadius, padding: `${statusInsetY}px ${tokens.statusInsetX}px` } : {}),
  };
  const unitStyle: CSSProperties = {
    fontSize: unit,
    fontWeight: tokens.unit.weight,
    letterSpacing: tokens.unit.tracking,
    color: kind === 'plain' ? 'inherit' : props.labelStyle.color,
  };
  return (
    <>
      {hasText || hasLabel ? (
        <div
          className="wall-stat-content"
          data-wall-stat-layout
          data-wall-stat-single={single || undefined}
          data-wall-stat-style={props.presentationStyle ?? 'legacy'}
          data-wall-stat-flow={inline ? 'inline' : 'tile'}
          style={{
            fontFamily: wallTypography.family,
            width: Math.max(0, width),
            height: single && !chart && !percentChange ? Math.max(0, height) : undefined,
            flexDirection: single ? 'column' : undefined,
            alignSelf: modern ? 'center' : 'stretch',
            display: inline ? 'grid' : 'flex',
            gridTemplateColumns: inline ? 'minmax(0, 1fr) max-content' : undefined,
            gap,
            alignItems: inline ? 'center' : centered ? 'center' : 'flex-start',
            justifyContent: 'center',
            paddingBottom: chart && !sideChart ? props.chartHeight : undefined,
          }}
        >
          {!single && props.surfaceStyle && (
            <span
              aria-hidden="true"
              data-wall-stat-surface
              style={{
                ...props.surfaceStyle,
                position: 'absolute',
                pointerEvents: 'none',
                zIndex: -1,
                insetInline: -(props.contentInset ?? tokens.itemInset),
                insetBlock: -softInsetY,
              }}
            />
          )}
          {modern && indicator && (
            <span
              aria-hidden="true"
              data-wall-stat-accent={props.presentationStyle}
              style={{
                position: 'absolute',
                pointerEvents: 'none',
                background: props.color,
                borderRadius: tokens.accentThickness,
                ...(props.presentationStyle === 'soft'
                  ? {
                      insetInlineStart: -(props.contentInset ?? tokens.itemInset) + tokens.accentInset,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: tokens.accentThickness,
                      height: `min(${tokens.accentLength}px, 100%)`,
                    }
                  : {
                      insetInlineStart: centered && !inline ? '50%' : 0,
                      transform: centered && !inline ? 'translateX(-50%)' : undefined,
                      bottom: inline ? 0 : -softInsetY,
                      width: tokens.accentLength,
                      height: tokens.accentThickness,
                    }),
              }}
            />
          )}
          {hasLabel && (
            <div
              className="wall-stat-label"
              title={value.title}
              style={{ ...props.labelStyle, fontSize: labelSize, textAlign: inline ? 'left' : undefined }}
            >
              {value.title}
            </div>
          )}
          {hasText && (
            <div
              className="wall-stat-card-value wall-stat-readout"
              style={valueStyle}
              data-wall-stat-kind={kind}
              data-wall-stat-colored={chip || undefined}
              title={wallDisplayText(value)}
            >
              <span className="wall-stat-number" style={{ gap: tokens.unitGap }}>
                {value.prefix && (
                  <span className="wall-stat-unit" style={unitStyle}>
                    {value.prefix}
                  </span>
                )}
                <span>{text}</span>
                {value.suffix && (
                  <span className="wall-stat-unit" style={unitStyle}>
                    {value.suffix}
                  </span>
                )}
              </span>
              {neutralCount && indicator && (
                <i
                  aria-hidden="true"
                  className="wall-stat-state-dot"
                  style={{
                    background: props.color,
                    width: dotSize,
                    height: dotSize,
                    flex: `0 0 ${dotSize}px`,
                    borderRadius: '50%',
                    alignSelf: 'center',
                  }}
                />
              )}
            </div>
          )}
          {percentChange}
        </div>
      ) : null}
      {chart}
    </>
  );
}
