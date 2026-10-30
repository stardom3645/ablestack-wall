import { ChevronDown, Layers2 } from 'lucide-react';

import { VariableHide } from '@grafana/data';
import { MultiValueVariable, SceneVariable, useSceneObjectState, VariableValueSelectWrapper } from '@grafana/scenes';

import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Button } from '../ui';

/** A presentation-only summary. Selection, search and multi-value commit remain native. */
export function variableSelectionSummary(variable: Pick<MultiValueVariable, 'state' | 'hasAllValue'>) {
  const { value, text, options } = variable.state;
  const values = (Array.isArray(value) ? value : [value]).filter((v) => v !== '' && v != null);
  if (!values.length) {
    return '미선택';
  }
  if (variable.hasAllValue()) {
    return '전체';
  }
  const labels = Array.isArray(text) ? text : [text];
  const names = values.map((v, index) =>
    String(options.find((option) => option.value === v)?.label ?? labels[index] ?? v)
  );
  return names.length > 1 ? `${names[0]} 외 ${names.length - 1}개` : names[0] || String(values[0]);
}

export function WallVariableControl({ variable }: { variable: SceneVariable }) {
  const state = useSceneObjectState(variable, { shouldActivateOrKeepAlive: true });
  if (state.hide === VariableHide.hideVariable) {
    return null;
  }
  // Text, ad-hoc and future variable types retain their original input rather than gaining dropdown semantics.
  if (!(variable instanceof MultiValueVariable)) {
    return <VariableValueSelectWrapper variable={variable} />;
  }
  const name = state.label || state.name;
  const summary = variableSelectionSummary(variable);
  return (
    <Popover>
      <PopoverTrigger
        render={<Button className="wall-toolbar-control wall-variable-trigger" />}
        aria-label={`${name}: ${summary}`}
        aria-busy={Boolean(state.loading)}
        disabled={variable.state.isReadOnly}
        title={variable.getValueText() || summary}
      >
        <Layers2 size={15} className="wall-variable-icon" aria-hidden="true" />
        {state.hide !== VariableHide.hideLabel && <span className="wall-variable-name">{name}</span>}
        <span className="wall-variable-value">{summary}</span>
        <ChevronDown size={13} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={`${name} 선택`} className="wall-scope-popover wall-variable-popover">
        <VariableValueSelectWrapper variable={variable} layout="vertical" />
      </PopoverContent>
    </Popover>
  );
}
