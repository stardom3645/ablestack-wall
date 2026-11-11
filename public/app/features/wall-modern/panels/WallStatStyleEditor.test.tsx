import { screen } from '@testing-library/react';
import { render } from 'test/test-utils';

import type { StatPresentationStyle } from '@grafana/ui/src/components/BigValue/StatCardPresentation';

import { WallStatStyleEditor } from './WallStatStyleEditor';

it('keeps missing presentation compatible and explains color-mode precedence without changing options', () => {
  const options = { colorMode: 'background_solid', textMode: 'auto' };
  const changed = jest.fn();
  const draw = (value?: StatPresentationStyle) => (
    <WallStatStyleEditor
      value={value}
      onChange={changed}
      context={{ data: [], options }}
      item={{ id: 'wallStatStyle', name: '표현 스타일', path: 'wallStatStyle', settings: {} }}
    />
  );
  const { rerender } = render(draw());
  expect(screen.getByRole('combobox', { name: 'Stat 표현 스타일' })).toHaveTextContent('기존 Grafana 호환 표현');
  rerender(draw('soft'));
  expect(screen.getByText(/기존 색상 모드는 보존되며/)).toBeVisible();
  options.colorMode = 'none';
  rerender(draw('minimal'));
  expect(screen.getByText('색상 적용이 없음이므로 Accent도 표시하지 않습니다.')).toBeVisible();
  expect(changed).not.toHaveBeenCalled();
  expect(options).toEqual({ colorMode: 'none', textMode: 'auto' });
});
