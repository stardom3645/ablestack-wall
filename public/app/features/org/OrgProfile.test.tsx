import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import OrgProfile from './OrgProfile';

jest.mock('app/core/core', () => ({ contextSrv: { hasPermission: () => true } }));

it('shows success only after the real save resolves and prevents a duplicate submission', async () => {
  let finish: () => void = () => {};
  const save = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  render(<OrgProfile orgName="Wall QA" onSubmit={save} />);
  await userEvent.click(screen.getByRole('button', { name: '조직 이름 저장' }));
  await waitFor(() => expect(save).toHaveBeenCalledWith('Wall QA'));
  expect(screen.getByRole('button', { name: '저장 중…' })).toBeDisabled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await act(async () => finish());
  expect(await screen.findByRole('status')).toHaveTextContent('조직 이름을 저장했습니다.');
  expect(save).toHaveBeenCalledTimes(1);
});

it('reports the backend error and leaves the entered name available for retry', async () => {
  const save = jest.fn().mockRejectedValue(new Error('QA save rejected'));
  render(<OrgProfile orgName="Wall QA" onSubmit={save} />);
  await userEvent.clear(screen.getByRole('textbox'));
  await userEvent.type(screen.getByRole('textbox'), 'Updated QA');
  await userEvent.click(screen.getByRole('button', { name: '조직 이름 저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('QA save rejected');
  expect(screen.getByRole('textbox')).toHaveValue('Updated QA');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
