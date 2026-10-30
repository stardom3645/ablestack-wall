import { CSSProperties, HTMLProps } from 'react';

import { FormattedValue } from '@grafana/data';

export interface Props extends Omit<HTMLProps<HTMLDivElement>, 'className' | 'value' | 'style'> {
  value: FormattedValue;
  className?: string;
  style?: CSSProperties;
  /** Optional application unit typography, leaving formatted text and native sizing untouched by default. */
  unitStyle?: CSSProperties;
}

function fontSizeReductionFactor(fontSize: number) {
  if (fontSize < 20) {
    return 0.9;
  }
  if (fontSize < 26) {
    return 0.8;
  }
  return 0.6;
}

export const FormattedValueDisplay = ({ value, className, style, unitStyle, ...htmlProps }: Props) => {
  const hasPrefix = (value.prefix ?? '').length > 0;
  const hasSuffix = (value.suffix ?? '').length > 0;
  let suffixStyle;

  if (style && style.fontSize && typeof style.fontSize === 'number') {
    const fontSize = style.fontSize;
    const reductionFactor = fontSizeReductionFactor(fontSize);
    suffixStyle = { fontSize: fontSize * reductionFactor };
  }

  return (
    <div className={className} style={style} {...htmlProps}>
      <div>
        {hasPrefix && <span style={unitStyle}>{value.prefix}</span>}
        <span>{value.text}</span>
        {hasSuffix && <span style={{ ...suffixStyle, ...unitStyle }}>{value.suffix}</span>}
      </div>
    </div>
  );
};

FormattedValueDisplay.displayName = 'FormattedDisplayValue';
