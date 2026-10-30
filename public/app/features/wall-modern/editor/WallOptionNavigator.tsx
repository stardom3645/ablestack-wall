import { useState, type ReactNode } from 'react';

import { t } from 'app/core/internationalization';
import type { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';

import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Props {
  general: OptionsPaneCategoryDescriptor[];
  visualization: OptionsPaneCategoryDescriptor[];
  fields: OptionsPaneCategoryDescriptor[];
  overrides: OptionsPaneCategoryDescriptor[];
  overrideCount: number;
  searchResults?: ReactNode;
  searching: boolean;
}

/** Native option descriptors keep editors, validation, overrides and plugin callbacks intact. */
export function WallOptionNavigator({
  general,
  visualization,
  fields,
  overrides,
  overrideCount,
  searching,
  searchResults,
}: Props) {
  const [active, setActive] = useState('general');
  const sections = [
    { id: 'general', label: t('wall.editor.option-general', '패널'), groups: general },
    { id: 'visualization', label: t('wall.editor.option-visualization', '시각화'), groups: visualization },
    { id: 'fields', label: t('wall.editor.option-fields', '필드'), groups: fields },
    { id: 'overrides', label: t('wall.editor.option-overrides', '재정의'), groups: overrides },
  ];
  return (
    <Tabs
      className="wall-option-navigator"
      value={active}
      onValueChange={(value) => typeof value === 'string' && setActive(value)}
    >
      <TabsList aria-label={t('wall.editor.option-sections', '표시 설정 영역')} className="wall-option-navigation">
        {sections.map((section) => (
          <TabsTrigger key={section.id} value={section.id} disabled={!section.groups.length}>
            {section.label}
            {section.id === 'overrides' && overrideCount > 0 && (
              <span className="wall-editor-tab-count">{overrideCount}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      <div
        className="wall-option-groups"
        role="region"
        aria-label={
          searching
            ? t('wall.editor.option-results', '설정 검색 결과')
            : sections.find((section) => section.id === active)?.label
        }
      >
        {searching
          ? searchResults
          : sections.find((section) => section.id === active)?.groups.map((group) => group.render())}
      </div>
    </Tabs>
  );
}
