import { fireEvent, render, screen } from '@testing-library/react';

import { readTextPanel, textPanelDefinitions, WallTextPanel } from './WallTextPanel';
import { KpiPosition } from './kpiLayout';

const base = 'wall-text-panel-test';
function setup(storageKey?: string) {
  return render(<WallTextPanel name="trends" storageKey={storageKey} draftCache={new Map<string, KpiPosition[]>()} />);
}
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());
it('shows a text panel to viewers without edit controls or source dashboard panel identity', () => {
  const { container } = setup();
  expect(screen.getByRole('heading', { name: '성능 추이' })).toBeInTheDocument();
  expect(container.querySelector('[data-wall-text-panel="trends"]')).toBeInTheDocument();
  expect(container.querySelector('[data-wall-panel-id]')).toBeNull();
  expect(screen.queryByRole('button', { name: /텍스트 편집/ })).not.toBeInTheDocument();
});
it('rejects corrupt or oversized stored content and keeps initial text', () => {
  localStorage.setItem('bad', JSON.stringify({ version: 1, title: '', description: 'x' }));
  expect(readTextPanel('bad', textPanelDefinitions.trends)).toEqual({
    title: '성능 추이',
    description: 'CPU · 메모리 · 네트워크 · 디스크',
  });
  localStorage.setItem('bad', JSON.stringify({ version: 1, title: 'x', description: 'x'.repeat(501) }));
  expect(readTextPanel('bad', textPanelDefinitions.trends).title).toBe('성능 추이');
});
it('cancels content edits separately and restores saved plain text after remount', async () => {
  const view = setup(base);
  fireEvent.click(screen.getByRole('button', { name: '성능 추이 추가 작업' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '텍스트 편집' }));
  fireEvent.change(await screen.findByLabelText('제목'), { target: { value: '취소할 제목' } });
  fireEvent.click(screen.getByRole('button', { name: '취소' }));
  expect(screen.getByRole('heading', { name: '성능 추이' })).toBeInTheDocument();
  expect(localStorage.getItem(`${base}:text-content:trends`)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '성능 추이 추가 작업' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '텍스트 편집' }));
  fireEvent.change(await screen.findByLabelText('제목'), { target: { value: '자원 성능' } });
  fireEvent.change(screen.getByLabelText('설명'), { target: { value: '<img src=x onerror=alert(1)>' } });
  fireEvent.click(screen.getByRole('button', { name: '텍스트 저장' }));
  view.unmount();
  const restored = setup(base);
  expect(screen.getByRole('heading', { name: '자원 성능' })).toBeInTheDocument();
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  expect(restored.container.querySelector('img')).toBeNull();
  expect(localStorage.getItem(`${base}:text-content:trends`)).not.toMatch(/query|gridPos|fieldConfig/);
});
it('keeps edit content when browser save fails', async () => {
  setup(base);
  fireEvent.click(screen.getByRole('button', { name: '성능 추이 추가 작업' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: '텍스트 편집' }));
  fireEvent.change(await screen.findByLabelText('제목'), { target: { value: '변경 내용' } });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  fireEvent.click(screen.getByRole('button', { name: '텍스트 저장' }));
  expect(screen.getByRole('alert')).toHaveTextContent('저장하지 못했습니다');
  expect(screen.getByLabelText('제목')).toHaveValue('변경 내용');
});
