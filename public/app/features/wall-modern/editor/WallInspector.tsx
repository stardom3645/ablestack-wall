import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';

import { t } from 'app/core/internationalization';
import type { OptionsPaneCategoryDescriptor as Category } from 'app/features/dashboard/components/PanelEditor/OptionsPaneCategoryDescriptor';
import type { OptionsPaneItemDescriptor as Item } from 'app/features/dashboard/components/PanelEditor/OptionsPaneItemDescriptor';

import { Collapsible } from '../components/ui/collapsible';
import { Button } from '../ui';

import { wallOptionText } from './optionText';

type Part = { category: Category; items: Item[]; native?: boolean };
export type InspectorSection = { id: string; title: string; parts: Part[] };

/** Projection only: descriptors, parents, native renderers and value callbacks are never rewritten. */
export function projectInspector(groups: Category[], overrides: Category[], timeSeries: boolean): InspectorSection[] {
  const sections: InspectorSection[] = timeSeries
    ? [
        { id: 'metric', title: t('wall.studio.metric-type', '지표 유형'), parts: [] },
        { id: 'chart', title: t('wall.studio.chart-style', '차트 스타일'), parts: [] },
        { id: 'axis', title: t('wall.studio.axis-range', '축과 범위'), parts: [] },
        { id: 'info', title: t('wall.studio.information', '정보 표시'), parts: [] },
        { id: 'values', title: t('wall.studio.values-colors', '값과 색상'), parts: [] },
        { id: 'additional', title: t('wall.studio.additional', '추가 설정'), parts: [] },
      ]
    : [];
  const add = (id: string, title: string, part: Part) => {
    let section = sections.find((entry) => entry.id === id);
    if (!section) {
      section = { id, title, parts: [] };
      sections.push(section);
    }
    section.parts.push(part);
  };
  const visit = (group: Category) => {
    if (group.props.customRender || group.props.renderTitle) {
      add('additional', '추가 설정', { category: group, items: [], native: true });
      return;
    }
    const buckets = new Map<string, Item[]>();
    for (const item of group.items) {
      let target = ['Standard options', 'Thresholds', 'Value mappings'].includes(group.props.id)
        ? 'values'
        : group.props.id;
      if (timeSeries) {
        target =
          group.props.id === 'Metric type'
            ? 'metric'
            : group.props.id === 'Graph styles'
              ? 'chart'
              : group.props.id === 'Axis' || ['Min', 'Max', 'Field min/max'].includes(item.props.title)
                ? 'axis'
                : ['Tooltip', 'Legend'].includes(group.props.id)
                  ? 'info'
                  : ['Standard options', 'Value mappings', 'Thresholds'].includes(group.props.id)
                    ? 'values'
                    : 'additional';
      }
      const items = buckets.get(target) ?? [];
      items.push(item);
      buckets.set(target, items);
    }
    for (const [id, items] of buckets) {
      add(id, id === 'values' ? t('wall.studio.values-colors', '값과 색상') : wallOptionText(group.props.title), {
        category: group,
        items,
      });
    }
    group.categories.forEach(visit);
  };
  groups.forEach(visit);
  overrides.forEach((group) => add('additional', '추가 설정', { category: group, items: [], native: true }));
  return sections.filter((section) => section.parts.length);
}
function isDetail(part: Part) {
  return ['Thresholds', 'Value mappings'].includes(part.category.props.id);
}
function matches(part: Part, item: Item, query: string) {
  return [part.category.props.title, item.props.title, item.props.description ?? ''].some((value) =>
    `${value} ${wallOptionText(value)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
}

export function WallInspector({
  groups,
  overrides,
  pluginId,
  searchQuery,
}: {
  groups: Category[];
  overrides: Category[];
  pluginId: string;
  searchQuery: string;
}) {
  const sections = projectInspector(groups, overrides, pluginId === 'timeseries');
  const [expanded, setExpanded] = useLocalStorage<Record<string, boolean>>(`wall.studio.inspector.v3.${pluginId}`, {});
  const [detail, setDetail] = useState<string>();
  useEffect(() => setDetail(undefined), [pluginId, searchQuery]);
  const query = searchQuery.trim();
  const selected = sections.flatMap((section) => section.parts).find((part) => part.category.props.id === detail);
  const titleMatches = (title: string) =>
    Boolean(query) && title.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const visible = (part: Part, sectionTitle: string) =>
    !query ||
    titleMatches(sectionTitle) ||
    (part.native
      ? titleMatches(wallOptionText(part.category.props.title)) ||
        part.category.items.some((item) => matches(part, item, query))
      : part.items.some((item) => matches(part, item, query)));
  const count = sections.reduce(
    (sum, section) => sum + section.parts.filter((part) => visible(part, section.title)).length,
    0
  );

  return (
    <div className="wall-inspector-sections">
      <div hidden={Boolean(selected)}>
        {query && !count && (
          <p className="wall-option-empty">{t('wall.studio.no-settings', '검색 조건에 맞는 설정이 없습니다.')}</p>
        )}
        {sections.map((section, index) => (
          <Collapsible.Root
            key={section.id}
            className="wall-setting-section"
            hidden={!section.parts.some((part) => visible(part, section.title))}
            open={Boolean(query) || (expanded?.[section.id] ?? index === 0)}
            onOpenChange={(open) => !query && setExpanded({ ...expanded, [section.id]: open })}
          >
            <Collapsible.Trigger render={<Button variant="ghost" />} className="wall-setting-section-heading">
              <span>{section.title}</span>
              <ChevronDown size={14} />
            </Collapsible.Trigger>
            <Collapsible.Panel keepMounted className="wall-setting-section-body">
              {section.parts.map((part) => (
                <div
                  key={categoryPath(part.category)}
                  hidden={!visible(part, section.title)}
                  className="wall-setting-part"
                >
                  {part.native ? (
                    part.category.render(query || undefined)
                  ) : (
                    <>
                      {section.id === 'info' && <h3>{wallOptionText(part.category.props.title)}</h3>}
                      {isDetail(part) && !query ? (
                        <Button
                          variant="ghost"
                          className="wall-setting-detail-link"
                          onClick={() => setDetail(part.category.props.id)}
                        >
                          <span>{wallOptionText(part.category.props.title)}</span>
                          <ChevronRight size={15} />
                        </Button>
                      ) : (
                        <NativeFields part={part} query={titleMatches(section.title) ? '' : query} />
                      )}
                    </>
                  )}
                </div>
              ))}
            </Collapsible.Panel>
          </Collapsible.Root>
        ))}
      </div>
      {selected && (
        <section className="wall-setting-detail" aria-label={wallOptionText(selected.category.props.title)}>
          <header>
            <Button variant="ghost" size="sm" onClick={() => setDetail(undefined)}>
              <ArrowLeft size={15} />
              {t('wall.studio.back-visual', '시각화 설정으로')}
            </Button>
            <h2>{wallOptionText(selected.category.props.title)}</h2>
          </header>
          <NativeFields part={selected} query="" />
        </section>
      )}
    </div>
  );
}
function NativeFields({ part, query }: { part: Part; query: string }) {
  const render = (item: Item) => (
    <div key={item.props.title} className="wall-native-field" hidden={Boolean(query) && !matches(part, item, query)}>
      {item.render(query || undefined)}
    </div>
  );
  const range = part.items.filter((item) => ['Min', 'Max'].includes(item.props.title));
  return (
    <>
      {part.items.map((item) => {
        if (range.length === 2 && range.includes(item)) {
          return item === range[0] ? (
            <div className="wall-minmax-row" key="native-range">
              {range.map(render)}
            </div>
          ) : null;
        }
        return render(item);
      })}
    </>
  );
}

function categoryPath(category: Category): string {
  return category.parent ? `${categoryPath(category.parent)}/${category.props.id}` : category.props.id;
}
