import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { MappingType, SpecialValueMatch, type ValueMapping } from '@grafana/data';
import { ColorPicker, Input, Select } from '@grafana/ui';
import { t } from 'app/core/internationalization';
import { ResourcePicker } from 'app/features/dimensions/editors/ResourcePicker';
import type { ValueMappingEditRowModel } from 'app/features/dimensions/editors/ValueMappingsEditor/ValueMappingEditRow';
import {
  buildEditRowModels,
  editModelToSaveModel,
} from 'app/features/dimensions/editors/ValueMappingsEditor/ValueMappingsEditorModal';
import { MediaType, ResourceFolderName, ResourcePickerSize } from 'app/features/dimensions/types';

import { Button } from '../ui';

import { wallOptionText } from './optionText';

export function WallValueMappingsEditor({
  value,
  onChange,
  showIconPicker,
}: {
  value: ValueMapping[];
  onChange: (value: ValueMapping[]) => void;
  showIconPicker?: boolean;
}) {
  const [rows, setRows] = useState(() => buildEditRowModels(value));
  const last = useRef(value);
  const [bounds, setBounds] = useState<Record<string, string>>({});
  const next = useRef(0);
  useEffect(() => {
    if (value !== last.current) {
      setRows(buildEditRowModels(value));
      setBounds({});
      last.current = value;
    }
  }, [value]);
  const validRows = (items: ValueMappingEditRowModel[]) =>
    items.every((row) =>
      row.type === MappingType.ValueToText
        ? row.key !== undefined
        : row.type === MappingType.RangeToText
          ? typeof row.from === 'number' &&
            !Number.isNaN(row.from) &&
            typeof row.to === 'number' &&
            !Number.isNaN(row.to) &&
            row.from! <= row.to!
          : row.type === MappingType.RegexToText
            ? Boolean(row.pattern)
            : Boolean(row.specialMatch)
    ) &&
    new Set(items.filter((row) => row.type === MappingType.ValueToText).map((row) => row.key)).size ===
      items.filter((row) => row.type === MappingType.ValueToText).length;
  const publish = (items: ValueMappingEditRowModel[]) => {
    setRows(items);
    if (validRows(items)) {
      const wire = editModelToSaveModel(items);
      last.current = wire;
      onChange(wire);
    }
  };
  const update = (id: string, patch: Partial<ValueMappingEditRowModel>) =>
    publish(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const types = [
    { value: MappingType.ValueToText, label: t('wall.mapping.value', '값') },
    { value: MappingType.RangeToText, label: t('wall.mapping.range', '범위') },
    { value: MappingType.RegexToText, label: t('wall.mapping.regex', '정규식') },
    { value: MappingType.SpecialValue, label: t('wall.mapping.special', '특수값') },
  ];
  const special = [
    { value: SpecialValueMatch.Null, label: 'Null' },
    { value: SpecialValueMatch.NaN, label: 'NaN' },
    { value: SpecialValueMatch.NullAndNaN, label: 'Null + NaN' },
    { value: SpecialValueMatch.True, label: 'True' },
    { value: SpecialValueMatch.False, label: 'False' },
    { value: SpecialValueMatch.Empty, label: 'Empty' },
  ].map((option) => ({ ...option, label: wallOptionText(option.label) }));
  const makeId = () => `wall-mapping-${next.current++}`;
  return (
    <div className="wall-mapping-editor">
      <p className="wall-option-help">
        {t('wall.mapping.guide', '조건에 일치하는 값을 표시 텍스트와 색상으로 바꿉니다.')}
      </p>
      <DragDropContext
        onDragEnd={({ source, destination }) => {
          if (!destination || destination.index === source.index) {
            return;
          }
          const copy = [...rows];
          const [row] = copy.splice(source.index, 1);
          copy.splice(destination.index, 0, row);
          publish(copy);
        }}
      >
        <Droppable droppableId="wall-value-mappings">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {rows.map((row, index) => (
                <Draggable key={row.id} draggableId={row.id} index={index}>
                  {(drag) => (
                    <section
                      className="wall-mapping-rule"
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      aria-label={`매핑 규칙 ${index + 1}`}
                    >
                      <header>
                        <span {...drag.dragHandleProps} aria-label={`규칙 ${index + 1} 이동`}>
                          <GripVertical size={14} />
                        </span>
                        <strong>
                          {t('wall.mapping.rule', '규칙')} {index + 1}
                        </strong>
                        <span className="wall-rule-actions">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`매핑 규칙 ${index + 1} 복제`}
                            onClick={() => {
                              const copy = [...rows];
                              copy.splice(index + 1, 0, { ...row, result: { ...row.result }, id: makeId() });
                              publish(copy);
                            }}
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`매핑 규칙 ${index + 1} 삭제`}
                            onClick={() => publish(rows.filter((entry) => entry.id !== row.id))}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </span>
                      </header>
                      <div className="wall-mapping-flow">
                        <label>
                          {t('wall.mapping.type', '매핑 유형')}
                          <Select
                            aria-label={`규칙 ${index + 1} 유형`}
                            value={row.type}
                            options={types}
                            onChange={(choice) =>
                              choice.value &&
                              update(row.id, {
                                type: choice.value,
                                specialMatch: row.specialMatch ?? SpecialValueMatch.Null,
                              })
                            }
                          />
                        </label>
                        <div className="wall-mapping-condition">
                          <span>{t('wall.mapping.condition', '조건')}</span>
                          {row.type === MappingType.ValueToText && (
                            <Input
                              aria-label={`규칙 ${index + 1} 값`}
                              value={row.key ?? ''}
                              onChange={(event) => update(row.id, { key: event.currentTarget.value })}
                              placeholder={t('wall.mapping.exact', '일치할 값')}
                            />
                          )}
                          {row.type === MappingType.RangeToText && (
                            <div className="wall-minmax-row">
                              <Input
                                aria-label={`규칙 ${index + 1} 범위 시작`}
                                inputMode="decimal"
                                value={bounds[`${row.id}-from`] ?? String(row.from ?? '')}
                                placeholder={t('wall.mapping.from', '시작')}
                                onChange={(event) => {
                                  setBounds({ ...bounds, [`${row.id}-from`]: event.currentTarget.value });
                                  update(row.id, {
                                    from:
                                      event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value),
                                  });
                                }}
                              />
                              <Input
                                aria-label={`규칙 ${index + 1} 범위 끝`}
                                inputMode="decimal"
                                value={bounds[`${row.id}-to`] ?? String(row.to ?? '')}
                                placeholder={t('wall.mapping.to', '끝')}
                                onChange={(event) => {
                                  setBounds({ ...bounds, [`${row.id}-to`]: event.currentTarget.value });
                                  update(row.id, {
                                    to:
                                      event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value),
                                  });
                                }}
                              />
                            </div>
                          )}
                          {row.type === MappingType.RegexToText && (
                            <Input
                              aria-label={`규칙 ${index + 1} 정규식`}
                              value={row.pattern ?? ''}
                              onChange={(event) => update(row.id, { pattern: event.currentTarget.value })}
                              placeholder={t('wall.mapping.regex', '정규식')}
                            />
                          )}
                          {row.type === MappingType.SpecialValue && (
                            <Select
                              aria-label={`규칙 ${index + 1} 특수값`}
                              value={row.specialMatch}
                              options={special}
                              onChange={(choice) => update(row.id, { specialMatch: choice.value })}
                            />
                          )}
                        </div>
                        <label>
                          {t('wall.mapping.result', '표시 결과')}
                          <Input
                            aria-label={`규칙 ${index + 1} 표시 텍스트`}
                            value={row.result.text ?? ''}
                            onChange={(event) =>
                              update(row.id, { result: { ...row.result, text: event.currentTarget.value } })
                            }
                            placeholder={t('wall.mapping.display-text', '표시 텍스트')}
                          />
                        </label>
                        <div className="wall-mapping-colors">
                          <span>{t('wall.mapping.color', '표시 색상')}</span>
                          <ColorPicker
                            color={row.result.color ?? 'gray'}
                            enableNamedColors
                            onChange={(color) => update(row.id, { result: { ...row.result, color } })}
                          />
                          {!row.result.color && <span>{t('wall.mapping.no-color', '미지정')}</span>}
                          {row.result.color && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => update(row.id, { result: { ...row.result, color: undefined } })}
                            >
                              {t('wall.mapping.remove-color', '색상 해제')}
                            </Button>
                          )}
                          {showIconPicker && (
                            <ResourcePicker
                              value={row.result.icon}
                              onChange={(icon) => update(row.id, { result: { ...row.result, icon } })}
                              onClear={() => update(row.id, { result: { ...row.result, icon: undefined } })}
                              size={ResourcePickerSize.SMALL}
                              folderName={ResourceFolderName.Icon}
                              mediaType={MediaType.Icon}
                              color={row.result.color}
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {!validRows(rows) && (
        <p role="alert">
          {t(
            'wall.mapping.invalid',
            '조건을 확인하세요. 값은 중복될 수 없으며 범위의 시작은 끝보다 클 수 없습니다. 미완성 조건은 아직 적용되지 않았습니다.'
          )}
        </p>
      )}
      <Button
        variant="ghost"
        onClick={() => setRows([...rows, { id: makeId(), type: MappingType.ValueToText, result: {} }])}
      >
        <Plus size={14} />
        {t('wall.mapping.add', '매핑 규칙 추가')}
      </Button>
    </div>
  );
}
