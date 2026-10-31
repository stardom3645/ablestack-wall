import { useContext, useState, type ReactNode } from 'react';

import { t } from 'app/core/internationalization';
import type { OptionsPaneCategoryDescriptor } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

import { editorInspectorContext } from './EditorPresentationContext';

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
  const inspector = useContext(editorInspectorContext);
  const sections = [
    { id: 'general', label: t('wall.editor.option-general', '패널'), groups: general },
    { id: 'visualization', label: t('wall.editor.option-visualization', '시각화'), groups: visualization },
    { id: 'fields', label: t('wall.editor.option-fields', '필드'), groups: fields },
    { id: 'overrides', label: t('wall.editor.option-overrides', '재정의'), groups: overrides },
  ];
  // Plugin changes can remove an option group while this navigator stays mounted.
  // Keep a real, available tab selected without mutating the native editor model.
  const selected =
    sections.find((section) => section.id === active && section.groups.length) ??
    sections.find((section) => section.groups.length);
  const selectedId = selected?.id ?? 'general';
  if (inspector) {
    const groups = inspector === 'panel' ? general : [...visualization, ...fields, ...overrides];
    return (
      <div className="wall-studio-option-groups">
        {searching ? (
          <div role="region" aria-label={t('wall.editor.option-results', '설정 검색 결과')}>
            {searchResults}
          </div>
        ) : (
          groups.map((group) => group.render())
        )}
      </div>
    );
  }
  return (
    <Tabs
      className="wall-option-navigator"
      value={selectedId}
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
      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="wall-option-groups">
          {section.id === selectedId &&
            (searching ? (
              <div role="region" aria-label={t('wall.editor.option-results', '설정 검색 결과')}>
                {searchResults}
              </div>
            ) : (
              section.groups.map((group) => group.render())
            ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
