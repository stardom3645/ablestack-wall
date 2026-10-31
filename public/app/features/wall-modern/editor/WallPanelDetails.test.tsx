import { fireEvent, render, screen } from '@testing-library/react';

import { WallPanelDetails } from './WallPanelDetails';

it('passes identity edits to native callbacks without changing their value types and keeps native advanced actions', () => {
  const onTitle = jest.fn();
  const onDescription = jest.fn();
  const onTransparent = jest.fn();
  render(
    <WallPanelDetails
      title="vCPU 사용률"
      description="original"
      transparent={false}
      onTitle={onTitle}
      onDescription={onDescription}
      onTransparent={onTransparent}
      titleAddon={<button>Native title action</button>}
    >
      <button>Native repeat options</button>
    </WallPanelDetails>
  );
  fireEvent.change(screen.getByRole('textbox', { name: '패널 제목' }), { target: { value: '새 제목' } });
  fireEvent.change(screen.getByRole('textbox', { name: '설명' }), { target: { value: 'new description' } });
  fireEvent.click(screen.getByRole('switch', { name: '투명 배경' }));
  expect(onTitle).toHaveBeenLastCalledWith('새 제목', expect.anything());
  expect(onDescription).toHaveBeenCalledWith('new description');
  expect(onTransparent).toHaveBeenLastCalledWith(true, expect.anything());
  expect(screen.getByRole('button', { name: 'Native title action' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Native repeat options' })).toBeInTheDocument();
});
