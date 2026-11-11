import { isValidElement, useContext } from 'react';

import { getValueFormats } from '@grafana/data';
import type { OptionsPaneItemDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

import { editorPresentationContext } from './EditorPresentationContext';
import { wallOptionText } from './optionText';

export function WallOptionSummary({ items }: { items: OptionsPaneItemDescriptor[] }) {
  const wall = useContext(editorPresentationContext);
  if (!wall) {
    return null;
  }
  const values: string[] = [];
  for (const item of items) {
    if (item.props.skipField || (item.props.showIf && !item.props.showIf())) {
      continue;
    }
    const editor = item.props.render();
    if (
      !isValidElement<{
        value?: unknown;
        item?: { settings?: { options?: Array<{ value?: unknown; label?: string }> } };
      }>(editor)
    ) {
      continue;
    }
    const { value } = editor.props;
    const choice = editor.props.item?.settings?.options?.find((option) => option.value === value);
    if (choice?.label) {
      values.push(`${wallOptionText(item.props.title)} ${wallOptionText(choice.label)}`);
    } else if (typeof value === 'boolean') {
      values.push(`${wallOptionText(item.props.title)} ${value ? '사용' : '사용 안 함'}`);
    } else if (Array.isArray(value)) {
      values.push(`${value.length}개 항목`);
    } else if (typeof value === 'string' && item.props.title === 'Unit') {
      const unit = getValueFormats()
        .flatMap((group) => group.submenu)
        .find((unit) => unit.value === value);
      values.push(wallOptionText(unit?.text ?? value));
    } else if (typeof value === 'number') {
      values.push(`${wallOptionText(item.props.title)} ${value}`);
    } else if (value && typeof value === 'object' && 'steps' in value && Array.isArray(value.steps)) {
      values.push(value.steps.length > 1 ? `${value.steps.length - 1}개 경계값` : '기본 색상');
    }
    if (values.length >= 2) {
      break;
    }
  }
  return (
    <small className="wall-option-summary" title={values.join(' · ')}>
      {values.length ? values.join(' · ') : `${items.length}개 설정`}
    </small>
  );
}
