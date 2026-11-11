import { fireEvent, screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import { MappingType, SpecialValueMatch, type ValueMapping } from '@grafana/data';

import { WallValueMappingsEditor } from './WallValueMappingsEditor';

it('edits a display result while preserving all native mapping types, conditions and colors', () => {
  const value: ValueMapping[] = [
    {
      type: MappingType.ValueToText,
      options: { '0': { text: 'Zero', color: 'green', index: 0 }, '': { text: 'Empty exact', index: 1 } },
    },
    {
      type: MappingType.RangeToText,
      options: { from: -Infinity, to: 10, result: { text: 'Range', color: 'orange', index: 2 } },
    },
    { type: MappingType.RegexToText, options: { pattern: '/host-(.*)/', result: { text: '$1', index: 3 } } },
    {
      type: MappingType.SpecialValue,
      options: { match: SpecialValueMatch.NullAndNaN, result: { text: 'Unavailable', index: 4 } },
    },
  ];
  const onChange = jest.fn();
  render(<WallValueMappingsEditor value={value} onChange={onChange} />);
  fireEvent.change(screen.getByDisplayValue('Zero'), { target: { value: '정상' } });
  const result: ValueMapping[] = onChange.mock.lastCall[0];
  expect(result).toEqual([
    {
      ...value[0],
      options: { '0': { text: '정상', color: 'green', index: 0 }, '': { text: 'Empty exact', index: 1 } },
    },
    ...value.slice(1),
  ]);
  expect(value[0]).toMatchObject({ options: { '0': { text: 'Zero' } } });
});

it('does not publish incomplete new rules and preserves a typed range draft until it is valid', () => {
  const onChange = jest.fn();
  const value: ValueMapping[] = [
    { type: MappingType.RangeToText, options: { from: 0, to: 10, result: { text: 'Range' } } },
  ];
  render(<WallValueMappingsEditor value={value} onChange={onChange} />);
  const start = screen.getByRole('textbox', { name: '규칙 1 범위 시작' });
  fireEvent.change(start, { target: { value: '-' } });
  expect(start).toHaveValue('-');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(start, { target: { value: '-0.5' } });
  expect(onChange.mock.lastCall[0][0].options.from).toBe(-0.5);
  onChange.mockClear();
  fireEvent.click(screen.getByRole('button', { name: '매핑 규칙 추가' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toBeVisible();
  fireEvent.change(screen.getByRole('textbox', { name: '규칙 2 값' }), { target: { value: 'new-key' } });
  expect(onChange).toHaveBeenCalledTimes(1);
});
