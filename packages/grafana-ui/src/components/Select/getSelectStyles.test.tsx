import { render, screen } from '@testing-library/react';

import { createTheme } from '@grafana/data';

import { getSelectStyles } from './getSelectStyles';

it('keeps the group boundary on the following option without relational selector matching', () => {
  const styles = getSelectStyles(createTheme());
  render(
    <div>
      <div className={styles.group}>Group</div>
      <div role="option" aria-selected={false}>
        Standalone option
      </div>
    </div>
  );
  const option = screen.getByRole('option', { name: 'Standalone option' });
  expect(getComputedStyle(option).borderTopWidth).toBe('1px');
  expect(getComputedStyle(option).borderTopStyle).toBe('solid');
});
