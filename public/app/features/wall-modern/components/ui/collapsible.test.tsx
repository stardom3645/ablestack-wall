import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Collapsible } from './collapsible';

it('preserves an edited input and component identity across repeated open/close interactions', async () => {
  let mounts = 0;
  function Content() {
    const [value, setValue] = useState(() => {
      mounts++;
      return '원본';
    });
    return <input aria-label="설정" value={value} onChange={(e) => setValue(e.target.value)} />;
  }
  render(
    <Collapsible.Root>
      <Collapsible.Trigger>옵션</Collapsible.Trigger>
      <Collapsible.Panel>
        <Content />
      </Collapsible.Panel>
    </Collapsible.Root>
  );
  await userEvent.click(screen.getByRole('button', { name: '옵션' }));
  await userEvent.clear(screen.getByRole('textbox', { name: '설정' }));
  await userEvent.type(screen.getByRole('textbox', { name: '설정' }), '수정 값');
  for (let i = 0; i < 4; i++) {
    await userEvent.click(screen.getByRole('button', { name: '옵션' }));
  }
  expect(screen.getByRole('textbox', { name: '설정' })).toHaveValue('수정 값');
  expect(mounts).toBe(1);
});
