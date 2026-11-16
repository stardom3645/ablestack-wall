import { act, renderHook } from '@testing-library/react';

import { useNavigationLayout } from './useNavigationLayout';

it('keeps responsive disclosure separate from the saved desktop preference and restores it on resize', () => {
  let matches = false;
  let listener: () => void = () => {};
  const remove = jest.fn();
  const original = window.matchMedia;
  window.matchMedia = jest.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, callback: () => void) => {
      listener = callback;
    },
    removeEventListener: remove,
  }));
  const save = jest.fn();
  const { result, rerender, unmount } = renderHook(({ manual }) => useNavigationLayout(manual, save), {
    initialProps: { manual: false },
  });
  expect(result.current.collapsed).toBe(false);
  act(() => {
    matches = true;
    listener();
  });
  expect(result.current.collapsed).toBe(true);
  act(() => result.current.setCollapsed(false));
  expect(result.current.collapsed).toBe(false);
  expect(save).not.toHaveBeenCalled();
  act(() => {
    matches = false;
    listener();
  });
  expect(result.current.collapsed).toBe(false);
  act(() => result.current.setCollapsed(true));
  expect(save).toHaveBeenCalledWith(true);
  rerender({ manual: true });
  act(() => {
    matches = true;
    listener();
  });
  act(() => {
    matches = false;
    listener();
  });
  expect(result.current.collapsed).toBe(true);
  unmount();
  expect(remove).toHaveBeenCalledWith('change', listener);
  window.matchMedia = original;
});
