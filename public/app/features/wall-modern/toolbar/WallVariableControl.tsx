import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

import { VariableHide } from '@grafana/data';
import { MultiValueVariable, SceneVariable, useSceneObjectState, VariableValueSelectWrapper } from '@grafana/scenes';
import { EmbeddedSelectContext } from '@grafana/ui/src/components/Select/EmbeddedSelectContext';
import { Trans } from 'app/core/internationalization';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { wallEventTokens } from '../eventTokens';
import { Button } from '../ui';

/** A presentation-only summary. Selection, search and multi-value commit remain native. */
export function variableSelectionSummary(variable: Pick<MultiValueVariable, 'state' | 'hasAllValue'>) {
  const selection = variableSelection(variable);
  return selection.all
    ? '전체'
    : selection.labels.length > 1
      ? `${selection.labels[0]} 외 ${selection.labels.length - 1}개`
      : selection.labels[0] || '미선택';
}

export function variableSelection(variable: Pick<MultiValueVariable, 'state' | 'hasAllValue'>) {
  const { value, text, options } = variable.state;
  const values = (Array.isArray(value) ? value : [value]).filter(
    (v) => v != null && (v !== '' || options.some((o) => o.value === '' && o.label))
  );
  if (variable.hasAllValue()) {
    return { all: true, labels: ['전체'] };
  }
  const labels = Array.isArray(text) ? text : [text];
  const names = values.map((v, index) =>
    String(options.find((option) => option.value === v)?.label ?? labels[index] ?? v)
  );
  return { all: false, labels: names };
}

export function WallVariableControl({ variable }: { variable: SceneVariable }) {
  const state = useSceneObjectState(variable, { shouldActivateOrKeepAlive: true });
  const multi = variable instanceof MultiValueVariable ? variable : undefined;
  const isMulti = multi?.state.isMulti;
  const [open, setOpen] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const changeOpen = (next: boolean) => {
    // The native multi-value selector commits on blur. Flush it before the host unmounts.
    if (!next && isMulti) {
      content.current?.querySelector('input')?.blur();
    }
    setOpen(next);
  };
  if (state.hide === VariableHide.hideVariable) {
    return null;
  }
  // Text, ad-hoc and future variable types retain their original input rather than gaining dropdown semantics.
  if (!(variable instanceof MultiValueVariable)) {
    return <VariableValueSelectWrapper variable={variable} />;
  }
  const name = state.label || state.name;
  const summary = variableSelectionSummary(variable);
  const selection = variableSelection(variable);
  const text = selection.labels.join(', ') || summary;
  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={<Button className="wall-toolbar-control wall-variable-trigger" />}
        aria-label={`${name}: ${summary}`}
        aria-busy={Boolean(state.loading)}
        disabled={variable.state.isReadOnly}
        title={`${name}: ${text}`}
        style={{
          '--wall-variable-width': `${wallEventTokens.variableWidth}px`,
          '--wall-variable-name-width': `${wallEventTokens.variableNameWidth}px`,
        }}
      >
        {state.hide !== VariableHide.hideLabel && (
          <span className="wall-variable-name" title={name}>
            {name}
            <Trans i18nKey="wall.wall-variable-control.text-05a79f06">:</Trans>
          </span>
        )}
        <span className="wall-variable-value">{selection.labels[0] || summary}</span>
        {!selection.all && selection.labels.length > 1 && (
          <span className="wall-variable-count" aria-hidden="true">
            {selection.labels.length}
            <Trans i18nKey="wall.wall-variable-control.text-11600c9a">개</Trans>
          </span>
        )}
        <ChevronDown size={13} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={`${name} 선택`} className="wall-scope-popover wall-variable-popover">
        <div ref={content}>
          <EmbeddedSelectContext.Provider value={{ onClose: () => changeOpen(false), maxHeight: 240 }}>
            <VariableValueSelectWrapper variable={variable} layout="vertical" />
          </EmbeddedSelectContext.Provider>
        </div>
        <div className="wall-variable-summary" title={text} role="status">
          {selection.all ? '전체 선택' : selection.labels.length ? `${selection.labels.length}개 선택` : '미선택'}
          {isMulti && (
            <span>
              <Trans i18nKey="wall.wall-variable-control.text-e1ff7836">선택기에서 나가면 적용됩니다.</Trans>
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
