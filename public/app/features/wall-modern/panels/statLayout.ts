import type { FieldDisplay } from '@grafana/data';
import { StatLayoutOptions, statPresentationStyle } from '@grafana/ui/src/components/BigValue/StatCardPresentation';
import { panelScrollTokens } from '@grafana/ui/src/components/PanelScrollArea/PanelScrollArea';
import type { VizRepeaterGrid } from '@grafana/ui/src/components/VizRepeater/VizRepeater';

import { measureStatText, statValueMapping, wallStatTokens as tokens } from './statReadout';

/** Presentation-only geometry from native formatted values. Never infer health or reduce data here. */
export function statGridDimensions(
  values: FieldDisplay[],
  width: number,
  height: number,
  spacing: number,
  options: StatLayoutOptions
): VizRepeaterGrid | undefined {
  if (
    !values.length ||
    (options.graphMode && options.graphMode !== 'none') ||
    options.showPercentChange ||
    options.textMode === 'none'
  ) {
    return undefined; // Preserve the native Sparkline/percent-change layout contract.
  }
  if (values.length === 1) {
    // One readout uses the actual body height; chip minimums must not create overflow.
    const available = Math.max(1, width);
    return { width: available, widthOnLastRow: available, height: Math.max(1, height), xCount: 1, yCount: 1, spacing };
  }
  const nameOnly = options.textMode === 'name';
  const measured = values.map((value) => {
    const display = value.display;
    const mapping = statValueMapping(value);
    const textual =
      (!Number.isFinite(display.numeric) || mapping?.text === display.text) &&
      !/^[+-]?(?:\d[\d,.\s]*|\d*\.\d+)%?$/.test(display.text.trim());
    const profile = nameOnly ? tokens.name : textual ? tokens.status : tokens.value;
    const text = nameOnly ? (display.title ?? '') : display.text;
    const hasLabel =
      !nameOnly &&
      options.textMode !== 'value' &&
      !(options.textMode === 'auto' && values.length === 1) &&
      Boolean(display.title);
    const labelSize = options.text?.titleSize ?? tokens.label.size;
    const valueSize = options.text?.valueSize ?? profile.size;
    const compactSize = options.text?.valueSize ?? (textual || nameOnly ? profile.size : tokens.inlineValue.size);
    const unitWidth = nameOnly
      ? 0
      : measureStatText((display.prefix ?? '') + (display.suffix ?? ''), tokens.unit.size, tokens.unit.weight) +
        (Number(Boolean(display.prefix)) + Number(Boolean(display.suffix))) * tokens.unitGap;
    const chip = textual && !nameOnly && mapping?.text ? tokens.statusInsetX * 2 + 2 : 0;
    return {
      label: hasLabel ? measureStatText(display.title!, labelSize, tokens.label.weight) : 0,
      value: measureStatText(text, valueSize, profile.weight) + unitWidth + chip,
      compact:
        measureStatText(text, compactSize, textual || nameOnly ? profile.weight : tokens.inlineValue.weight) +
        unitWidth +
        chip,
      line: (valueSize * profile.line) / profile.size + (textual && !nameOnly ? tokens.statusInsetY * 2 + 2 : 0),
      compactLine:
        compactSize *
          (textual || nameOnly ? profile.line / profile.size : tokens.inlineValue.line / tokens.inlineValue.size) +
        (textual ? tokens.statusInsetY * 2 + 2 : 0),
      labelLine: hasLabel ? (labelSize * tokens.label.line) / tokens.label.size : 0,
    };
  });
  const available = Math.max(1, width - panelScrollTokens.clearance);
  const labelWidth = Math.max(...measured.map((v) => v.label));
  const valueWidth = Math.max(...measured.map((v) => v.value));
  const compactWidth = Math.max(...measured.map((v) => v.compact));
  const inset = tokens.itemInset * 2;
  const background =
    statPresentationStyle(options.wallStatStyle) === 'legacy' &&
    ['background', 'background_solid'].includes(options.colorMode ?? '');
  const inline =
    measured.every((v) => v.label > 0) &&
    !nameOnly &&
    !background &&
    labelWidth > valueWidth + tokens.labelReadingMinimum &&
    available >= tokens.labelReadingMinimum + compactWidth + inset + tokens.gap;
  const contentWidth = inline
    ? Math.min(labelWidth, tokens.labelReadingWidth) + compactWidth + inset + tokens.gap
    : Math.max(valueWidth, Math.min(labelWidth, tokens.labelReadingWidth)) + inset;
  // A value-colored readout can be narrow; a filled surface should not become a tall stripe.
  const preferredWidth = background ? Math.max(contentWidth, Math.min(height, tokens.labelReadingWidth)) : contentWidth;
  const gap = inline ? tokens.inlineRowGap : spacing;
  const capacity = Math.max(1, Math.min(values.length, Math.floor((available + gap) / (preferredWidth + gap))));
  const rows = Math.ceil(values.length / capacity);
  const columns = Math.ceil(values.length / rows);
  const minimumHeight = inline
    ? Math.max(...measured.map((v) => v.compactLine))
    : Math.max(...measured.map((v) => v.line + v.labelLine + (v.labelLine ? tokens.gap : 0)));
  const itemWidth = Math.max(1, (available - (columns - 1) * gap) / columns);
  return {
    width: itemWidth,
    widthOnLastRow: itemWidth,
    height: Math.max(minimumHeight, (height - (rows - 1) * gap) / rows),
    xCount: columns,
    yCount: rows,
    spacing: gap,
    layout: inline ? 'inline' : undefined,
  };
}
